import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, signup, refreshSession } = useAuth()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signup(email, password, username, pin)
        // Auto-login: signUp returned an active session (email confirmation
        // is disabled), so refreshing the auth context drops us straight
        // into the app. Fall back to an explicit login if no session yet.
        try {
          await refreshSession()
        } catch {
          await login(email, password)
          await refreshSession()
        }
        showToast('Account created — welcome!')
      } else {
        await login(email, password)
        await refreshSession()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Fashion Catalog
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSignUp ? 'Email' : 'Email or Username'}
            </label>
            <input
              type={isSignUp ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete={isSignUp ? 'email' : 'username'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder={isSignUp ? 'you@example.com' : 'you@example.com or username'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
                  }
                  required
                  pattern="[a-z0-9_]{2,}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="lowercase, no spaces (e.g., nick)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, underscore only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  required
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none tracking-widest"
                  placeholder="••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  4-digit PIN that determines your role.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold ml-2"
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
