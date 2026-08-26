import { useEffect, useState } from 'react'
import { useContent } from '../context/ContentContext'
import MessagesView from './Messages'
import Icon from '../components/Icon'
import EnquiriesView from './Enquiries'
import WhatsAppInbox from './WhatsAppInbox'
import {
  SettingsEditor,
  BrandEditor,
  ContactsEditor,
  FooterEditor,
  AboutEditor,
  ServicesEditor,
  SkillsEditor,
  ExperienceEditor,
  PortfolioEditor,
} from './sections'

const TABS = [
  { id: 'settings', label: 'Settings', icon: 'settings', Editor: SettingsEditor },
  { id: 'brand', label: 'Brand Images', icon: 'palette', Editor: BrandEditor },
  { id: 'contacts', label: 'Contacts & Email', icon: 'at', Editor: ContactsEditor },
  { id: 'footer', label: 'Footer', icon: 'book', Editor: FooterEditor },
  { id: 'about', label: 'About Me', icon: 'user', Editor: AboutEditor },
  { id: 'services', label: 'Services', icon: 'spark', Editor: ServicesEditor },
  { id: 'skills', label: 'Skills', icon: 'gauge', Editor: SkillsEditor },
  { id: 'experience', label: 'Experience', icon: 'briefcase', Editor: ExperienceEditor },
  { id: 'portfolio', label: 'Catalogue', icon: 'layout', Editor: PortfolioEditor },
  { id: 'messages', label: 'Messages', icon: 'mail', Editor: null },
  { id: 'enquiries', label: 'Enquiries', icon: 'spark', Editor: null },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'phone', Editor: null },
]

function EditorShell({ editor, draft, patch }) {
  const Editor = editor
  return (
    <div className="admin-editor">
      <Editor draft={draft} patch={patch} />
    </div>
  )
}

export default function AdminShell({ onLogout }) {
  const { content, saveContent } = useContent()
  const [active, setActive] = useState('settings')
  const [draft, setDraft] = useState(content)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState('idle')
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setDraft(content)
    setDirty(false)
  }, [content])

  const patch = (section, value) => {
    setDraft((prev) => ({ ...prev, [section]: value }))
    setDirty(true)
    setStatus('idle')
  }

  const handleSave = async () => {
    setStatus('saving')
    setSaveError(null)
    try {
      await saveContent(draft)
      setStatus('saved')
      setDirty(false)
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setStatus('error')
      setSaveError(e.message)
    }
  }

  const activeTab = TABS.find((t) => t.id === active)

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <span className="admin-sidebar-logo">DP</span>
          <div>
            <strong>Portfolio Admin</strong>
            <span className="admin-sidebar-sub">Dewale Protocols</span>
          </div>
        </div>
        <nav className="admin-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-nav-item ${active === tab.id ? 'active' : ''}`}
              onClick={() => setActive(tab.id)}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <a href="#/" className="admin-sidebar-link">
            <Icon name="eye" size={16} /> View site
          </a>
          <button className="admin-sidebar-link" onClick={onLogout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1>{activeTab.label}</h1>
          {activeTab.Editor && (
            <div className="admin-topbar-actions">
              <span className={`admin-save-state ${status}`}>
                {status === 'saving' && 'Saving…'}
                {status === 'saved' && <><Icon name="check" size={14} /> Saved</>}
                {status === 'error' && <><Icon name="alert" size={14} /> Save failed</>}
                {status === 'idle' && dirty && 'Unsaved changes'}
              </span>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={status === 'saving'}>
                <Icon name="save" size={16} /> Save changes
              </button>
            </div>
          )}
        </header>
        {saveError && <p className="admin-error admin-error-bar">{saveError}</p>}
        {activeTab.id === 'messages' ? (
          <MessagesView />
        ) : activeTab.id === 'enquiries' ? (
          <EnquiriesView />
        ) : activeTab.id === 'whatsapp' ? (
          <WhatsAppInbox />
        ) : (
          <EditorShell editor={activeTab.Editor} draft={draft} patch={patch} />
        )}
      </div>
    </div>
  )
}
