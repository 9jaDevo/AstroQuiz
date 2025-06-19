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
    let mounted = true

    // Function to set user with admin status
    const setUserWithProfile = async (authUser: User | null) => {
      if (!mounted) return

      if (authUser) {
        try {
          // Fetch user profile to get admin status
          const { data: profile } = await userAPI.getProfile(authUser.id)
          const extendedUser: ExtendedUser = {
            ...authUser,
            is_admin: profile?.is_admin || false
          }
          setUser(extendedUser)
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Set user without admin status if profile fetch fails
          setUser(authUser)
        }
      } else {
        setUser(null)
      }
    }

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { session: initialSession } = await authAPI.getSession()
        
        if (!mounted) return

        setSession(initialSession)
        await setUserWithProfile(initialSession?.user || null)
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Start initialization
    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = authAPI.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)
      
      setSession(session)
      await setUserWithProfile(session?.user || null)
      
      // Only set loading to false after the initial load
      if (loading) {
        setLoading(false)
      }
    })

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove loading from dependencies to avoid infinite loops

  const signIn = async (email: string, password: string) => {
    const result = await authAPI.signIn(email, password)
    return result
  }

  const signUp = async (email: string, password: string, username: string) => {
    const result = await authAPI.signUp(email, password, username)
    return result
  }

  const signOut = async () => {
    const result = await authAPI.signOut()
    // Clear local state immediately
    setUser(null)
    setSession(null)
    return result
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