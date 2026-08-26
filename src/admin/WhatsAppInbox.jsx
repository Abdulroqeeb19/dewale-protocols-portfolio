import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'

const SERVICE_LABELS = {
  'ai-automation': 'AI Automation', 'ai-chatbots': 'AI Chatbots',
  ecommerce: 'E-Commerce', fullstack: 'Full Stack', 'smart-campus': 'Smart Campus',
  'business-systems': 'Business Systems', consulting: 'Consulting',
}

const BUDGET_LABELS = {
  'under-500': 'Under $500', '500-1500': '$500-$1,500', '1500-5000': '$1,500-$5,000',
  '5000-10000': '$5,000-$10,000', '10000-plus': '$10,000+', flexible: 'Flexible',
}

export default function WhatsAppInbox() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    fetchConversations()
    const sub = supabase?.channel('whatsapp-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => { sub?.unsubscribe?.() }
  }, [])

  const fetchConversations = async () => {
    if (!supabase) return setLoading(false)
    try {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
      setConversations(data || [])
    } catch (e) {
      console.error('Fetch conversations error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, conversations])

  const handleSend = async () => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    const phone = selected.phone
    const msg = replyText.trim()
    setReplyText('')

    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, last_message: msg, updated_at: new Date().toISOString() } : c
    ))

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message: msg }),
      })
      const data = await res.json()
      if (!data.ok) console.error('Send failed:', data)
    } catch (e) {
      console.error('Send error:', e)
    } finally {
      setSending(false)
    }
  }

  const formatPhone = (p) => {
    if (!p) return ''
    return p.length > 10 ? `+${p.slice(0, 2)} ${p.slice(2, 6)} ${p.slice(6)}` : p
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <div className="admin-loading"><div className="admin-loading-spinner" /></div>
  }

  return (
    <div className="wa-inbox">
      <div className="wa-inbox-sidebar">
        <div className="wa-inbox-search">
          <Icon name="search" size={16} />
          <span>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
        </div>
        {conversations.length === 0 ? (
          <div className="wa-inbox-empty">
            <p>No WhatsApp conversations yet.</p>
            <p className="wa-inbox-empty-sub">Set up your WhatsApp Cloud API to start receiving messages here.</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`wa-inbox-item ${selected?.id === conv.id ? 'active' : ''}`}
              onClick={() => setSelected(conv)}
            >
              <div className="wa-inbox-item-avatar">
                {conv.name ? conv.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="wa-inbox-item-info">
                <div className="wa-inbox-item-head">
                  <strong>{conv.name || formatPhone(conv.phone)}</strong>
                  <span className="wa-inbox-item-time">{formatTime(conv.updated_at)}</span>
                </div>
                <p className="wa-inbox-item-preview">{conv.last_message || 'New conversation'}</p>
                {conv.flow_state !== 'complete' && (
                  <span className="wa-inbox-item-step">{conv.flow_state}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="wa-inbox-chat">
        {selected ? (
          <>
            <div className="wa-inbox-chat-header">
              <div className="wa-inbox-chat-avatar">
                {selected.name ? selected.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <strong>{selected.name || formatPhone(selected.phone)}</strong>
                <span>{formatPhone(selected.phone)}</span>
              </div>
            </div>

            <div className="wa-inbox-chat-body">
              <div className="wa-inbox-chat-details">
                <div className="wa-inbox-detail-grid">
                  <div className="wa-inbox-detail"><label>Type</label><span>{selected.collected_data?.type || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Service</label><span>{SERVICE_LABELS[selected.collected_data?.service] || selected.collected_data?.service || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Budget</label><span>{BUDGET_LABELS[selected.collected_data?.budget] || selected.collected_data?.budget || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Email</label><span>{selected.collected_data?.email || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Location</label><span>{selected.collected_data?.location || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Payment</label><span>{selected.collected_data?.paymentPreference || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Lead Source</label><span>{selected.collected_data?.leadSource || 'N/A'}</span></div>
                  <div className="wa-inbox-detail"><label>Refund</label><span>{selected.collected_data?.refundAccepted ? 'Accepted' : 'Pending'}</span></div>
                </div>
                {selected.collected_data?.description && (
                  <div className="wa-inbox-desc">
                    <label>Description</label>
                    <p>{selected.collected_data.description}</p>
                  </div>
                )}
              </div>

              <div className="wa-inbox-last">
                <label>Last Message</label>
                <p>{selected.last_message || 'No messages yet'}</p>
              </div>
              <div ref={chatEndRef} />
            </div>

            <div className="wa-inbox-chat-footer">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a reply..."
                disabled={sending}
              />
              <button onClick={handleSend} disabled={sending || !replyText.trim()}>
                <Icon name="send" size={16} /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="wa-inbox-no-select">
            <Icon name="mail" size={40} />
            <p>Select a conversation to view details and reply.</p>
          </div>
        )}
      </div>
    </div>
  )
}
