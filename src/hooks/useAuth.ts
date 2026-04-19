import { useAuth as useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const auth = useAuthContext()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signup = async (email: string, password: string, role: 'manager' | 'employee') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    if (data.user) {
      // Add user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: data.user.id, role }])

      if (roleError) throw roleError
    }

    return data
  }

  return {
    ...auth,
    login,
    signup,
  }
}
