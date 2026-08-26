import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'

const STATUS_COLORS = {
  new: '#25d366',
  contacted: '#7a5cff',
  qualified: '#fca311',
  converted: '#66fcf1',
  closed: '#9aa3b2',
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
]

export default function EnquiriesView() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setEnquiries(data || [])
    } catch (e) {
      console.error('Fetch error:', e)
      setError('Failed to load enquiries. Make sure the enquiries table exists in Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      )
    } catch (e) {
      console.error('Update error:', e)
    }
  }

  const deleteEnquiry = async (id) => {
    if (!confirm('Delete this enquiry?')) return
    try {
      const { error } = await supabase
        .from('enquiries')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEnquiries((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const filtered = filter === 'all'
    ? enquiries
    : enquiries.filter((e) => e.status === filter)

  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    contacted: enquiries.filter((e) => e.status === 'contacted').length,
    qualified: enquiries.filter((e) => e.status === 'qualified').length,
    converted: enquiries.filter((e) => e.status === 'converted').length,
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
      </div>
    )
  }

  return (
    <div className="enquiries-view">
      {error && <div className="admin-error admin-error-bar">{error}</div>}

      <div className="enq-stats">
        <div className="enq-stat-card">
          <span className="enq-stat-num">{stats.total}</span>
          <span className="enq-stat-label">Total</span>
        </div>
        <div className="enq-stat-card enq-stat-new">
          <span className="enq-stat-num">{stats.new}</span>
          <span className="enq-stat-label">New</span>
        </div>
        <div className="enq-stat-card enq-stat-contacted">
          <span className="enq-stat-num">{stats.contacted}</span>
          <span className="enq-stat-label">Contacted</span>
        </div>
        <div className="enq-stat-card enq-stat-qualified">
          <span className="enq-stat-num">{stats.qualified}</span>
          <span className="enq-stat-label">Qualified</span>
        </div>
        <div className="enq-stat-card enq-stat-converted">
          <span className="enq-stat-num">{stats.converted}</span>
          <span className="enq-stat-label">Converted</span>
        </div>
      </div>

      <div className="enq-filters">
        {['all', 'new', 'contacted', 'qualified', 'converted', 'closed'].map((s) => (
          <button
            key={s}
            className={`enq-filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="enq-filter-count">
                {enquiries.filter((e) => e.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="enq-empty">
          <Icon name="mail" size={40} />
          <p>No enquiries found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="enq-list">
          {filtered.map((enq) => (
            <div key={enq.id} className={`enq-card ${expanded === enq.id ? 'expanded' : ''}`}>
              <div className="enq-card-header" onClick={() => setExpanded(expanded === enq.id ? null : enq.id)}>
                <div className="enq-card-main">
                  <div className="enq-card-title">
                    <strong>{enq.name}</strong>
                    <span className="enq-card-type">{enq.type}</span>
                  </div>
                  <div className="enq-card-meta">
                    <span>{enq.email}</span>
                    <span>•</span>
                    <span>{enq.service?.replace(/-/g, ' ')}</span>
                    <span>•</span>
                    <span>{new Date(enq.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="enq-card-actions">
                  <span
                    className="enq-status-badge"
                    style={{ background: STATUS_COLORS[enq.status] + '22', color: STATUS_COLORS[enq.status] }}
                  >
                    {enq.status}
                  </span>
                  <Icon name={expanded === enq.id ? 'close' : 'eye'} size={16} />
                </div>
              </div>

              {expanded === enq.id && (
                <div className="enq-card-body">
                  <div className="enq-detail-grid">
                    <div className="enq-detail">
                      <label>Phone</label>
                      <span>{enq.phone || 'N/A'}</span>
                    </div>
                    <div className="enq-detail">
                      <label>Budget</label>
                      <span>{enq.budget?.replace(/-/g, ' ') || 'N/A'}</span>
                    </div>
                    <div className="enq-detail">
                      <label>Location</label>
                      <span>{enq.location || 'N/A'}</span>
                    </div>
                    <div className="enq-detail">
                      <label>Payment</label>
                      <span>{enq.payment_preference?.replace(/-/g, ' ') || 'N/A'}</span>
                    </div>
                    <div className="enq-detail">
                      <label>Lead Source</label>
                      <span>{enq.lead_source || 'N/A'}</span>
                    </div>
                    <div className="enq-detail">
                      <label>Refund Accepted</label>
                      <span>{enq.refund_accepted ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    {enq.payment_ref && (
                      <div className="enq-detail">
                        <label>Payment Ref</label>
                        <span>{enq.payment_ref}</span>
                      </div>
                    )}
                  </div>

                  <div className="enq-desc-section">
                    <label>Project Description</label>
                    <p>{enq.description || 'No description provided'}</p>
                  </div>

                  <div className="enq-card-footer">
                    <div className="enq-status-update">
                      <label>Update Status:</label>
                      <div className="enq-status-btns">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            className={`enq-status-btn ${enq.status === s.value ? 'current' : ''}`}
                            style={{
                              borderColor: STATUS_COLORS[s.value],
                              color: enq.status === s.value ? '#fff' : STATUS_COLORS[s.value],
                              background: enq.status === s.value ? STATUS_COLORS[s.value] : 'transparent',
                            }}
                            onClick={() => updateStatus(enq.id, s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="enq-delete-btn" onClick={() => deleteEnquiry(enq.id)}>
                      <Icon name="close" size={14} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
