import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase' 

export interface ExtendedUser extends User {
  is_admin?: boolean
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadInitialSession() {
      // 1) Try to read any existing session from localStorage
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      setSession(initialSession)

      if (initialSession?.user) {
        // Optionally fetch extra profile data, e.g. is_admin
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', initialSession.user.id)
            .single()

          setUser({
            ...initialSession.user,
            is_admin: profile?.is_admin ?? false,
          })
        } catch {
          setUser(initialSession.user)
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    loadInitialSession()

    // 2) Subscribe to auth changes (login, logout, token refresh, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return

        setSession(newSession)

        if (newSession?.user) {
          // Re-fetch profile if needed
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('is_admin')
              .eq('id', newSession.user.id)
              .single()

            setUser({
              ...newSession.user,
              is_admin: profile?.is_admin ?? false,
            })
          } catch {
            setUser(newSession.user)
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Expose signIn, signUp, signOut wrappers if you like:
  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () =>
    supabase.auth.signOut().then(() => {
      setUser(null)
      setSession(null)
    })

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
