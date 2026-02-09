import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('AuthProvider mounted')
        let mounted = true

        // Check for existing session
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error('Session check error:', error)
            } else if (mounted && data?.session?.user) {
                console.log('Restoring Supabase session', data.session.user.id)
                setUser(data.session.user)
                loadProfile(data.session.user.id)
                    .then(() => console.log('Profile loaded successfully'))
                    .catch(e => console.error('Profile load failed', e))
            }
        }).catch(err => {
            console.error('Session initialization failed:', err)
        }).finally(() => {
            if (mounted) setLoading(false)
        })

        // Backup timeout to prevent infinite loading
        setTimeout(() => {
            if (mounted && loading) {
                console.warn('Force disabling loader after timeout')
                setLoading(false)
            }
        }, 3000)

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
                        loadProfile(session.user.id).catch(e => console.error('Background profile load failed:', e))
                    } else if (_event === 'SIGNED_OUT') {
                        // Only clear on explicit sign out
                        setUser(null)
                        setProfile(null)
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
        try {
            console.log('Fetching profile for:', userId)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                // Assuming RLS or missing profile - create one if needed? 
                // For now, just log it.
                return
            }

            if (data) {
                console.log('Profile loaded:', data)
                setProfile(data)
            } else {
                console.warn('Profile loaded but data is null')
            }
        } catch (err) {
            console.error('Exception in loadProfile:', err)
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
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username, display_name: username }
                    }
                })
                if (error) throw error
                return { data, error: null }
            } catch (error) {
                console.error('Sign up error:', error)
                return { data: null, error }
            }
        },
        signIn: async (email, password) => {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                return { data, error: null }
            } catch (error) {
                console.error('Sign in error:', error)
                return { data: null, error }
            }
        },
        signOut: async () => {
            try {
                // Attempt standard sign out with timeout
                const { error } = await Promise.race([
                    supabase.auth.signOut(),
                    new Promise(resolve => setTimeout(() => resolve({ error: 'timeout' }), 2000))
                ])
                if (error) console.warn('Supabase sign out error/timeout:', error)
            } catch (error) {
                console.error('Sign out exception:', error)
            } finally {
                // FORCE cleanup local state regardless of server response
                setUser(null)
                setProfile(null)

                // Clear any lingering keys
                try {
                    localStorage.removeItem('codlyquiz-session')
                    localStorage.removeItem('sb-prsynwfjkhtdaqluwigq-auth-token')
                    window.localStorage.clear() // NUCLEAR OPTION: Clear everything
                } catch (e) {
                    console.error('LocalStorage cleanup error:', e)
                }

                return { error: null }
            }
        },
        signInWithGoogle: async () => {
            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                })
                if (error) throw error
                return { data, error: null }
            } catch (error) {
                console.error('Google sign in error:', error)
                return { data: null, error }
            }
        }
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
