import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from "@/supabaseClient"


export default function Reset() {
  const navigate = useNavigate()
  const [mode, setMode] = React.useState('request') // 'request' | 'update'
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  // If redirected back with a recovery token, show "update password" form
  React.useEffect(() => {
    const hash = window.location.hash // e.g. '#access_token=...&type=recovery'
    if (hash && /type=recovery/.test(hash)) {
      setMode('update')
    }
  }, [])

  const sendEmail = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset',
    })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage('Password reset email sent. Check your inbox.')
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage('Password updated. You can sign in now.')
    setTimeout(() => navigate('/auth/login'), 800)
  }

  return (
    <div className="min-h-[80vh] grid place-items-center">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold text-leaf mb-1">
          {mode === 'request' ? 'Reset your password' : 'Set a new password'}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {mode === 'request'
            ? 'Enter your email to receive a reset link.'
            : 'Enter a new password for your account.'}
        </p>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {message && <div className="mb-4 text-sm text-emerald-600">{message}</div>}

        {mode === 'request' ? (
          <form onSubmit={sendEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 ring-leaf"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-leaf hover:bg-leaf/90 text-white font-semibold py-2 transition disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 ring-leaf"
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-leaf hover:bg-leaf/90 text-white font-semibold py-2 transition disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link to="/auth/login" className="text-leaf hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
