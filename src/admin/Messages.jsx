import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import Icon from '../components/Icon'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function MessagesView() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setMessages(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (supabaseConfigured) load()
  }, [])

  const remove = async (id) => {
    const { error: deleteError } = await supabase.from('contact_messages').delete().eq('id', id)
    if (!deleteError) load()
  }

  if (!supabaseConfigured) {
    return (
      <div className="admin-block">
        <p className="admin-note">
          Supabase isn't configured yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> and ensure the{' '}
          <code>contact_messages</code> table exists (run <code>supabase/schema.sql</code>) to start receiving
          form messages here.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-block">
        <p className="admin-error">
          {error} — if the table doesn't exist yet, run <code>supabase/schema.sql</code> in your SQL editor.
        </p>
        <button className="admin-btn admin-btn-ghost" onClick={load}>Retry</button>
      </div>
    )
  }

  return (
    <div className="admin-block">
      <div className="admin-block-head">
        <h4>Inbox ({messages.length})</h4>
        <button type="button" className="admin-btn admin-btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && <p className="admin-note">Loading messages…</p>}

      {!loading && messages.length === 0 && (
        <p className="admin-note">No messages yet. Messages from your contact form will appear here.</p>
      )}

      <div className="admin-message-list">
        {messages.map((m) => (
          <div className="admin-msg-card" key={m.id}>
            <div className="admin-msg-head">
              <div className="admin-msg-meta">
                <strong>{m.name}</strong>
                <a href={`mailto:${m.email}`} className="admin-msg-email">
                  {m.email}
                </a>
              </div>
              <div className="admin-msg-tools">
                <span className="admin-msg-date">{formatDate(m.created_at)}</span>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-danger"
                  onClick={() => remove(m.id)}
                  aria-label="Delete message"
                  title="Delete"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
            <p className="admin-msg-body">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}