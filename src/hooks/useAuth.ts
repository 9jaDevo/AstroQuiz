import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authAPI, userAPI } from '../services/api'

interface ExtendedUser extends User {
  is_admin?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authAPI.getSession().then(async ({ session }) => {
      setSession(session)
      
      if (session?.user) {
        // Fetch user profile to get admin status
        const { data: profile } = await userAPI.getProfile(session.user.id)
        const extendedUser: ExtendedUser = {
          ...session.user,
          is_admin: profile?.is_admin || false
        }
        setUser(extendedUser)
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = authAPI.onAuthStateChange(async (_event, session) => {
      setSession(session)
      
      if (session?.user) {
        // Fetch user profile to get admin status
        const { data: profile } = await userAPI.getProfile(session.user.id)
        const extendedUser: ExtendedUser = {
          ...session.user,
          is_admin: profile?.is_admin || false
        }
        setUser(extendedUser)
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return await authAPI.signIn(email, password)
  }

  const signUp = async (email: string, password: string, username: string) => {
    return await authAPI.signUp(email, password, username)
  }

  const signOut = async () => {
    return await authAPI.signOut()
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }
}