import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prsynwfjkhtdaqluwigq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3lud2Zqa2h0ZGFxbHV3aWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTIwMTgsImV4cCI6MjA4NTg2ODAxOH0.BLd2VwzCzts24VhGOq0Pm-yN4Z95XINGrRbQpPBA7jY'

const customFetch = (url, options) => {
    return new Promise((resolve, reject) => {
        const fetchWithRetry = (retries) => {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 10000) // 10s global timeout

            fetch(url, { ...options, signal: controller.signal })
                .then(response => {
                    clearTimeout(id)
                    resolve(response)
                })
                .catch((error) => {
                    clearTimeout(id)
                    console.warn('Supabase fetch error:', error.message)
                    if (retries > 0 && error.name !== 'AbortError') {
                        // Retry on network errors, but maybe not on timeouts if we want to fail fast?
                        // Let's retry on timeouts too, simply.
                        setTimeout(() => fetchWithRetry(retries - 1), 1000)
                    } else {
                        reject(error)
                    }
                })
        }
        fetchWithRetry(3)
    })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    global: {
        fetch: customFetch
    }
})
