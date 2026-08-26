import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'

const TABS = [
  { id: 'business', label: 'Business Profile', icon: 'user' },
  { id: 'services', label: 'Services', icon: 'briefcase' },
  { id: 'chatbot', label: 'Chatbot Config', icon: 'bot' },
  { id: 'leads', label: 'Leads', icon: 'mail' },
  { id: 'embed', label: 'Embed & Share', icon: 'code' },
]

export default function Admin() {
  const [active, setActive] = useState('business')
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setIsAuthed(true); loadBusiness(data.session.user.id) }
      else setLoading(false)
    })
  }, [])

  const loadBusiness = async (userId) => {
    if (!supabase) return setLoading(false)
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', userId).single()
    if (data) { setBusiness(data); setSlug(data.slug || '') }
    setLoading(false)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError(null)
    if (!supabase) return setAuthError('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass })
    if (error) return setAuthError(error.message)
    setIsAuthed(true)
    loadBusiness(data.user.id)
  }

  const handleSignUp = async () => {
    setAuthError(null)
    if (!supabase) return setAuthError('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPass })
    if (error) return setAuthError(error.message)
    if (data.user) {
      await supabase.from('businesses').insert([{
        owner_id: data.user.id,
        name: authEmail.split('@')[0],
        slug: authEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        chatbot_config: {
          greeting: "Hello! How can we help you today?",
          services: [],
          faq: [],
          primaryColor: '#6366f1',
          position: 'bottom-right',
        },
      }])
      setIsAuthed(true)
      loadBusiness(data.user.id)
    }
  }

  const handleSave = async (updates) => {
    if (!supabase || !business) return
    setSaving(true)
    await supabase.from('businesses').update(updates).eq('id', business.id)
    setBusiness(prev => ({ ...prev, ...updates }))
    setSaving(false)
  }

  if (!isAuthed) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>ChatBot Pro</h2>
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: 28, fontSize: '0.9rem' }}>Sign in to manage your chatbot</p>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={authPass} onChange={e => setAuthPass(e.target.value)} required />
            </div>
            {authError && <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12 }}>{authError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>Sign In</button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSignUp}>Create Account</button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>Loading...</div>

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <strong>ChatBot Pro</strong>
          <span>{business?.name || 'My Business'}</span>
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button key={t.id} className={`admin-nav-item ${active === t.id ? 'active' : ''}`} onClick={() => setActive(t.id)}>
              <Icon name={t.icon} size={18} /> {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px' }}>
          <button className="admin-nav-item" onClick={() => supabase?.auth.signOut().then(() => window.location.reload())}>
            <Icon name="logout" size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1>{TABS.find(t => t.id === active)?.label}</h1>
          {saving && <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Saving...</span>}
        </header>

        {active === 'business' && <BusinessTab business={business} onSave={handleSave} />}
        {active === 'services' && <ServicesTab business={business} onSave={handleSave} />}
        {active === 'chatbot' && <ChatbotTab business={business} onSave={handleSave} />}
        {active === 'leads' && <LeadsTab businessId={business?.id} />}
        {active === 'embed' && <EmbedTab slug={slug} />}
      </main>
    </div>
  )
}

function BusinessTab({ business, onSave }) {
  const [name, setName] = useState(business?.name || '')
  const [email, setEmail] = useState(business?.email || '')
  const [phone, setPhone] = useState(business?.phone || '')
  const [location, setLocation] = useState(business?.location || '')
  const [description, setDescription] = useState(business?.description || '')

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={location} onChange={e => setLocation(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} /></div>
      <button className="btn btn-primary" onClick={() => onSave({ name, email, phone, location, description })}>Save Changes</button>
    </div>
  )
}

function ServicesTab({ business, onSave }) {
  const [services, setServices] = useState(business?.chatbot_config?.services || [])
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const add = () => {
    if (!newName.trim()) return
    setServices([...services, { name: newName, price: newPrice, description: newDesc }])
    setNewName(''); setNewPrice(''); setNewDesc('')
  }

  const remove = (i) => setServices(services.filter((_, idx) => idx !== i))

  return (
    <div style={{ maxWidth: 600 }}>
      {services.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', marginBottom: 8 }}>
          <div><strong>{s.name}</strong> {s.price && <span style={{ color: 'var(--accent)', marginLeft: 8 }}>{s.price}</span>}
            {s.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 2 }}>{s.description}</p>}
          </div>
          <button onClick={() => remove(i)} style={{ color: '#f87171', fontSize: '0.82rem' }}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>Add Service</h3>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Haircut" /></div>
          <div className="form-group"><label className="form-label">Price</label><input className="form-input" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. $25" /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description" /></div>
        <button className="btn btn-primary btn-sm" onClick={add}>Add Service</button>
      </div>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => {
        const config = { ...business.chatbot_config, services }
        onSave({ chatbot_config: config })
      }}>Save Services</button>
    </div>
  )
}

function ChatbotTab({ business, onSave }) {
  const config = business?.chatbot_config || {}
  const [greeting, setGreeting] = useState(config.greeting || '')
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor || '#6366f1')
  const [position, setPosition] = useState(config.position || 'bottom-right')

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="form-group"><label className="form-label">Greeting Message</label><textarea className="form-input" value={greeting} onChange={e => setGreeting(e.target.value)} placeholder="Hello! How can we help you today?" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Primary Color</label><input className="form-input" type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ height: 44 }} /></div>
        <div className="form-group">
          <label className="form-label">Widget Position</label>
          <select className="form-input" value={position} onChange={e => setPosition(e.target.value)}>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" onClick={() => onSave({ chatbot_config: { ...config, greeting, primaryColor, position } })}>Save Config</button>
    </div>
  )
}

function LeadsTab({ businessId }) {
  const [leads, setLeads] = useState([])
  useEffect(() => {
    if (!supabase || !businessId) return
    supabase.from('leads').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).then(({ data }) => setLeads(data || []))
  }, [businessId])

  return (
    <div>
      <p style={{ color: 'var(--text-dim)', marginBottom: 20 }}>{leads.length} lead{leads.length !== 1 ? 's' : ''} collected</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Service</th><th>Date</th></tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td>{l.name}</td><td>{l.email}</td><td>{l.phone}</td>
                <td>{l.service || '-'}</td>
                <td>{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmbedTab({ slug }) {
  const host = window.location.origin
  const pageUrl = `${host}/b/${slug}`
  const embedCode = `<script src="${host}/widget.js" data-business-id="${slug}" async></script>`

  const copy = (text) => navigator.clipboard.writeText(text)

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Standalone Page</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: 12 }}>Share this link anywhere — social media, Google Business, email, flyers.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="form-input" value={pageUrl} readOnly style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => copy(pageUrl)}>Copy</button>
        </div>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Embed on Your Website</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: 12 }}>Paste this before &lt;/body&gt; on any website.</p>
        <pre style={{ padding: 16, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', fontSize: '0.82rem', overflow: 'auto', color: 'var(--accent)' }}>{embedCode}</pre>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => copy(embedCode)}>Copy Code</button>
      </div>
    </div>
  )
}
