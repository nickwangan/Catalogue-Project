import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, UserRole } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  role: UserRole | null
  loading: boolean
  isManager: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshSession = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error refreshing session:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [refreshTrigger])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        setRole(null)
      } else {
        setRole(data?.role as UserRole)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUser(null)
    setRole(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, isManager: role === 'manager', logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
