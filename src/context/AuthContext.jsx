import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
const SESSION_KEY = 'codlyquiz-session'

export const useAuth = () => useContext(AuthContext)

// Manual session helpers
const saveSession = (session) => {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
        localStorage.removeItem(SESSION_KEY)
    }
}

const getSavedSession = () => {
    try {
        const saved = localStorage.getItem(SESSION_KEY)
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('AuthProvider mounted')
        let mounted = true

        async function initSession() {
            try {
                // Try to restore saved session first (NO Supabase auth calls!)
                const savedSession = getSavedSession()
                if (savedSession?.user) {
                    console.log('Restoring saved session')
                    setUser(savedSession.user)
                    // Load profile in background
                    loadProfile(savedSession.user.id).catch(console.error)
                }
            } catch (error) {
                console.error('Session restore error:', error)
                localStorage.removeItem(SESSION_KEY)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('Auth change:', _event, session ? 'HAS_SESSION' : 'NO_SESSION')

                // SKIP INITIAL_SESSION with null - it would clear our manually restored session
                if (_event === 'INITIAL_SESSION' && !session) {
                    console.log('Skipping INITIAL_SESSION with null session')
                    return
                }

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user)
                        saveSession(session)
                        await loadProfile(session.user.id)
                    } else if (_event === 'SIGNED_OUT') {
                        // Only clear on explicit sign out
                        setUser(null)
                        setProfile(null)
                        saveSession(null)
                    }
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const loadProfile = async (userId) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) {
            setProfile(data)
        }
    }

    const refreshProfile = async () => {
        if (user) {
            await loadProfile(user.id)
        }
    }

    const updateCoins = async (amount) => {
        if (!user) return

        const { data } = await supabase
            .rpc('add_coins', { user_uuid: user.id, amount })

        if (data !== null) {
            setProfile(prev => ({ ...prev, coins: data }))
        }
        return data
    }

    const value = {
        user,
        profile,
        loading,
        refreshProfile,
        updateCoins,
        // Helper getters
        username: profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player',
        coins: profile?.coins || 0,
        selectedAvatar: profile?.selected_avatar || 'fox',

        signUp: async (email, password, username) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username, display_name: username }
                }
            })
            return { data, error }
        },
        signIn: async (email, password) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            return { data, error }
        },
        signOut: async () => {
            const { error } = await supabase.auth.signOut()
            setProfile(null)
            return { error }
        },
        signInWithGoogle: async () => {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            })
            return { data, error }
        }
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
