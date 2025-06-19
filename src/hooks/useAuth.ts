import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import type { User, Session } from '@supabase/supabase-js'

export interface ExtendedUser extends User {
  is_admin?: boolean
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser]       = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadInitialSession() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()
        console.log('[useAuth] initialSession:', initialSession)

        if (!mounted) return
        setSession(initialSession)

        if (initialSession?.user) {
          // fetch your is_admin flag
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', initialSession.user.id)
            .single()
          if (error) throw error

          setUser({
            ...initialSession.user,
            is_admin: profile?.is_admin ?? false,
          })
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('[useAuth] getSession error:', err)
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('[useAuth] auth state change:', _event, newSession)
      if (!mounted) return

      setSession(newSession)
      if (newSession?.user) {
        // re-fetch admin flag
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', newSession.user.id)
            .single()
          if (error) throw error

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
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () =>
    supabase.auth.signOut().then(() => {
      setUser(null)
      setSession(null)
    })

  return { user, session, loading, signIn, signUp, signOut }
}
