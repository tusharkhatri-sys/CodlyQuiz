import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prsynwfjkhtdaqluwigq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3lud2Zqa2h0ZGFxbHV3aWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIwMTgsImV4cCI6MjA4NTg2ODAxOH0.BLd2VwzCzts24VhGOq0Pm-yN4Z95XINGrRbQpPBA7jY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
    // Sign up with email
    async signUp(email, password, username) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    display_name: username
                }
            }
        })
        return { data, error }
    },

    // Sign in with email
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Get current user
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    // Get session
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession()
        return session
    },

    // Google OAuth
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
        return { data, error }
    },

    // Password reset
    async resetPassword(email) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email)
        return { data, error }
    }
}
