import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loginWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' })
  }

  const loginWithLinkedIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' })
  }

  const loginAsGuest = async () => {
    // Mock user for testing without Auth configuration
    setUser({ id: 'guest-123', email: 'guest@cybervett.local', user_metadata: { name: 'Guest Candidate' } })
    setIsLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGithub, loginWithLinkedIn, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
