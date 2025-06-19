// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' 
import type { Session, User } from '@supabase/supabase-js'

export interface ExtendedUser extends User {
  is_admin?: boolean
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user,    setUser]    = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  // shared handler for every auth event
  const handleAuth = async (event: string, sess: Session | null) => {
    console.log('[useAuth] event:', event, sess)

    // signed out or refresh failed
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }

    // initial or signed in
    if (sess?.user) {
      setSession(sess)
      // fetch is_admin
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', sess.user.id)
          .single()
        setUser({ ...sess.user, is_admin: profile?.is_admin ?? false })
      } catch {
        setUser(sess.user)
      }
    } else {
      setSession(null)
      setUser(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    // subscribe once to all auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      handleAuth(event, sess)
    })

    // trigger INITIAL_SESSION exactly once
    supabase.auth
      .getSession()
      .then(({ data: { session } }) =>
        handleAuth('INITIAL_SESSION', session)
      )
      .catch((err) => {
        console.error('[useAuth] getSession error', err)
        setLoading(false)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // your signIn / signUp / signOut wrappers
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