import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import Login from './Login'
import AdminShell from './AdminShell'

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <AdminShell
      onLogout={() => supabase.auth.signOut().then(() => setSession(null))}
    />
  )
}
