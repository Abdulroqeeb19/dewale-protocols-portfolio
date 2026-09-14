import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'
import Brand from '../components/Brand'
import { useContent } from '../context/ContentContext'

export default function PasswordReset({ onDone }) {
  const { content } = useContent()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Failed to update password. The link may have expired — please request a new one.')
      setLoading(false)
      return
    }
    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="admin-login">
        <motion.div className="admin-login-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <Brand brand={content.brand} href="#/admin" />
          <div className="admin-login-ok">
            <Icon name="check" size={18} />
            <h2>Password updated</h2>
          </div>
          <p className="admin-login-sub">Your admin password has been changed. Sign in with your new password to continue.</p>
          <button className="admin-btn admin-btn-primary admin-login-btn" onClick={onDone}>
            Go to sign in <Icon name="lock" size={16} />
          </button>
          <a href="#/" className="admin-btn admin-btn-ghost admin-login-back">← Back to site</a>
        </motion.div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="admin-login">
        <div className="admin-login-card glass">
          <h2>Reset password</h2>
          <p className="admin-login-sub">Supabase is not configured — set <code>VITE_SUPABASE_URL</code> to use this page.</p>
          <a href="#/" className="admin-btn admin-btn-ghost admin-login-back">← Back to site</a>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login">
      <motion.div className="admin-login-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <Brand brand={content.brand} href="#/" />
        <h2>Set a new password</h2>
        <p className="admin-login-sub">Choose a new password to secure your admin account.</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="reset-pass">New password</label>
            <input id="reset-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
          </div>
          <div className="admin-field">
            <label htmlFor="reset-pass-confirm">Confirm new password</label>
            <input id="reset-pass-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" minLength={8} />
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="admin-btn admin-btn-primary admin-login-btn" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'} <Icon name="check" size={16} />
          </button>
        </form>
        <a href="#/" className="admin-btn admin-btn-ghost admin-login-back">← Back to site</a>
      </motion.div>
    </div>
  )
}