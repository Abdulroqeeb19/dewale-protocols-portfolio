import { useState, useEffect, useRef } from 'react'

export default function BusinessPage({ slug }) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/business?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setBusiness(data.business)
        else setError(data.reason || 'not-found')
      })
      .catch(() => setError('network-error'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!business) return
    document.title = `${business.name} — AI Assistant`
  }, [business])

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-dim)' }}>Loading...</div>
  if (error) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--text-dim)' }}>Business not found.</div>

  const config = business.chatbot_config || {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--accent-grad)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            {business.name?.charAt(0) || 'B'}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>{business.name}</h1>
          <p style={{ color: 'var(--text-dim)' }}>{config.greeting || 'How can we help you today?'}</p>
        </div>

        {config.services?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Our Services</h2>
            {config.services.map((s, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{s.name}</strong>
                  {s.price && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.price}</span>}
                </div>
                {s.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginTop: 6 }}>{s.description}</p>}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: 32, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <p style={{ marginBottom: 16, color: 'var(--text-dim)' }}>Chat with our AI assistant</p>
          <button
            onClick={() => {
              const event = new CustomEvent('open-chatbot', { detail: { businessId: business.id } })
              window.dispatchEvent(event)
            }}
            className="btn btn-primary"
          >
            💬 Start Conversation
          </button>
        </div>
      </div>

      <script src="/widget.js" data-business-id={business.id} async />
    </div>
  )
}
