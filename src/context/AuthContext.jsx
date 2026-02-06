import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                loadProfile(session.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null)
                if (session?.user) {
                    await loadProfile(session.user.id)
                } else {
                    setProfile(null)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const loadProfile = async (userId) => {
        const { data } = await supabase
            .from('user_profiles')
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
