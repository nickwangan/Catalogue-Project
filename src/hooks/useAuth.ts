import { useAuth as useAuthContext } from '../context/AuthContext'
import { supabase, getRoleFromPin } from '../lib/supabase'

export function useAuth() {
  const auth = useAuthContext()

  const login = async (identifier: string, password: string) => {
    let email = identifier.trim()

    // If the identifier doesn't look like an email, treat it as a username
    // and resolve it to an email via the RPC.
    if (!email.includes('@')) {
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
        'get_email_by_username',
        { p_username: email.toLowerCase() },
      )
      if (rpcError) throw rpcError
      if (!resolvedEmail) {
        throw new Error('No account found for that username.')
      }
      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Wait briefly for session to settle
    await new Promise(resolve => setTimeout(resolve, 300))
    return data
  }

  const signup = async (
    email: string,
    password: string,
    username: string,
    pin: string,
  ) => {
    // 1. Validate PIN -> role
    const role = getRoleFromPin(pin)
    if (!role) {
      throw new Error('Invalid PIN. Signup cannot continue.')
    }

    // 2. Validate username (lowercase, no spaces, min 2 chars)
    const cleanUsername = username.trim()
    if (!/^[a-z0-9_]{2,}$/.test(cleanUsername)) {
      throw new Error(
        'Username must be lowercase letters, numbers, or underscore (no spaces).',
      )
    }

    // 3. Check username availability before creating auth user
    const { data: existing, error: lookupError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is what we want
      throw lookupError
    }
    if (existing) {
      throw new Error('Username is already taken.')
    }

    // 4. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error

    if (!data.user) {
      throw new Error('Account creation failed. Please try again.')
    }

    // 5. Create user profile (username + role) via SECURITY DEFINER function
    // (bypasses RLS so the newly-created user's session doesn't need to be
    //  fully established before the INSERT is allowed)
    const { error: profileError } = await supabase.rpc('create_user_profile', {
      p_user_id: data.user.id,
      p_username: cleanUsername,
      p_role: role,
    })

    if (profileError) {
      throw new Error(
        'Account was created but profile failed. Contact admin. Error: ' +
          profileError.message,
      )
    }

    return { user: data.user, role, username: cleanUsername }
  }

  return {
    ...auth,
    login,
    signup,
  }
}
