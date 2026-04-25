import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, UserRole } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  username: string | null
  role: UserRole | null
  loading: boolean
  isAdmin: boolean
  isManager: boolean
  isEmployee: boolean
  canEditBrands: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUsername(null)
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
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username, role')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUsername(null)
        setRole(null)
      } else {
        setUsername(data?.username ?? null)
        setRole((data?.role as UserRole) ?? null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setUsername(null)
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
    setUsername(null)
    setRole(null)
    setLoading(false)
  }

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isEmployee = role === 'employee'
  const canEditBrands = isAdmin || isManager

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        role,
        loading,
        isAdmin,
        isManager,
        isEmployee,
        canEditBrands,
        logout,
        refreshSession,
      }}
    >
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
