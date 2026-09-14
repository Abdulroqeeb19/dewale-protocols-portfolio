import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, supabaseConfigured } from '../lib/supabase'
import Icon from '../components/Icon'
import Brand from '../components/Brand'
import { useContent } from '../context/ContentContext'

export default function Login() {
  const { content } = useContent()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="admin-login">
        <div className="admin-login-card glass">
          <Brand brand={content.brand} href="#/" />
          <div className="admin-setup">
            <h2>Almost there — configure Supabase</h2>
            <ol>
              <li>Open <code>.env</code> and set <code>VITE_SUPABASE_ANON_KEY</code> (Project Settings → API).</li>
              <li>Run <code>supabase/schema.sql</code> in your Supabase SQL editor.</li>
              <li>Create an admin user: Authentication → Users → Add user.</li>
              <li>Restart <code>npm run dev</code> and sign in.</li>
            </ol>
          </div>
          <a href="#/" className="admin-btn admin-btn-ghost">← Back to site</a>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError('Sign in failed. Please try again later.')
      }
    }
    setLoading(false)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetSent(false)
    const redirectTo = `${window.location.origin}/recovery`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (resetError) {
      setError('Unable to send reset link. Please try again later.')
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="admin-login">
      <motion.div className="admin-login-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <Brand brand={content.brand} href="#/" />
        {mode === 'signin' ? (
          <>
            <h2>Admin sign in</h2>
            <p className="admin-login-sub">Manage content and settings for the portfolio.</p>
            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-field">
                <label htmlFor="admin-email">Email</label>
                <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="admin-field">
                <label htmlFor="admin-pass">Password</label>
                <input id="admin-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="admin-login-row">
                <button type="button" className="admin-forgot" onClick={() => { setMode('reset'); setError(null); setResetSent(false) }}>
                  Forgot password?
                </button>
              </div>
              {error && <p className="admin-error">{error}</p>}
              <button type="submit" className="admin-btn admin-btn-primary admin-login-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'} <Icon name="lock" size={16} />
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Reset password</h2>
            <p className="admin-login-sub">
              {resetSent
                ? 'If an account exists for that email, a reset link is on its way. Click it and you will be asked to set a new password.'
                : 'Enter your admin email and we will send you a link to generate a new password.'}
            </p>
            {!resetSent && (
              <form onSubmit={handleReset} className="admin-login-form">
                <div className="admin-field">
                  <label htmlFor="admin-reset-email">Email</label>
                  <input id="admin-reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                {error && <p className="admin-error">{error}</p>}
                <button type="submit" className="admin-btn admin-btn-primary admin-login-btn" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'} <Icon name="mail" size={16} />
                </button>
                <button type="button" className="admin-btn admin-btn-ghost admin-login-btn" onClick={() => { setMode('signin'); setError(null); setResetSent(false) }}>
                  ← Back to sign in
                </button>
              </form>
            )}
            {resetSent && (
              <button className="admin-btn admin-btn-ghost admin-login-btn" onClick={() => { setMode('signin'); setResetSent(false) }}>
                ← Back to sign in
              </button>
            )}
          </>
        )}
        <a href="#/" className="admin-btn admin-btn-ghost admin-login-back">← Back to site</a>
      </motion.div>
    </div>
  )
}