import { useEffect, useState, lazy, Suspense, Component } from 'react'
import Cursor from './components/Cursor'
import Favicon from './components/Favicon'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import Skills from './components/Skills'
import Timeline from './components/Timeline'
import Portfolio from './components/Portfolio'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Testimonials from './components/Testimonials'
import Process from './components/Process'
import ResumeModal from './components/ResumeModal'
import WhatsAppAgent from './components/WhatsAppAgent'
import { supabase, supabaseConfigured } from './lib/supabase'
import { ContentProvider, useContent } from './context/ContentContext'
import PasswordReset from './admin/PasswordReset'
import AdSlot from './components/AdSlot'
import Icon from './components/Icon'
import { AD_SLOTS } from './config/ads'

const AdminApp = lazy(() => import('./admin/AdminApp'))

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-loading">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Something went wrong</h2>
            <p style={{ color: '#9aa3b2', marginTop: '0.5rem' }}>Please refresh the page or try again later.</p>
            <a href="#/" className="admin-btn admin-btn-ghost" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Back to site
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function LoadingScreen() {
  return (
    <div className="admin-loading">
      <div className="admin-loading-spinner" />
    </div>
  )
}

function PublicSite() {
  const { status, content } = useContent()
  const [resumeOpen, setResumeOpen] = useState(false)

  if (status === 'loading') return <LoadingScreen />

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Cursor />
      <Favicon />
      <div id="site-content">
        <Navbar />
        <main id="main-content">
          <Hero onOpenResume={() => setResumeOpen(true)} />
          <AdSlot slot={AD_SLOTS.primary} className="ad-slot-primary" />
          <About />
          <Services />
          <Skills />
          <Timeline />
          <Portfolio />
          <Process />
          <Testimonials />
          <AdSlot slot={AD_SLOTS.secondary} className="ad-slot-secondary" />
          <Contact />
        </main>
        <Footer />
      </div>
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
      <WhatsAppAgent />

      <div className="sticky-cta" aria-hidden="true">
        <a href="#contact" className="btn btn-primary">
          <Icon name="mail" size={18} /> Hire Me
        </a>
        <a href={`tel:${content?.profile?.phone?.replace(/\s/g, '') || ''}`} className="btn btn-ghost">
          <Icon name="phone" size={18} /> Call
        </a>
      </div>
    </>
  )
}

export default function App() {
  const hash = useHashRoute()
  const isAdmin = hash.startsWith('#/admin')
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return
    if (window.location.pathname.endsWith('/recovery')) setRecovering(true)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <ContentProvider>
      {recovering ? (
        <PasswordReset onDone={() => setRecovering(false)} />
      ) : isAdmin ? (
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <AdminApp />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <PublicSite />
      )}
    </ContentProvider>
  )
}
