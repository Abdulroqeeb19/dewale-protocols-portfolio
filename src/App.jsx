import { useEffect, useState, lazy, Suspense } from 'react'
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
import ResumeModal from './components/ResumeModal'
import { supabase, supabaseConfigured } from './lib/supabase'
import { ContentProvider, useContent } from './context/ContentContext'
import PasswordReset from './admin/PasswordReset'
import AdSlot from './components/AdSlot'
import { AD_SLOTS } from './config/ads'

const AdminApp = lazy(() => import('./admin/AdminApp'))

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
  const { status } = useContent()
  const [resumeOpen, setResumeOpen] = useState(false)

  if (status === 'loading') return <LoadingScreen />

  return (
    <>
      <Cursor />
      <Favicon />
      <div id="site-content">
        <Navbar />
        <main>
          <Hero onOpenResume={() => setResumeOpen(true)} />
          <AdSlot slot={AD_SLOTS.primary} className="ad-slot-primary" />
          <About />
          <Services />
          <Skills />
          <Timeline />
          <Portfolio />
          <AdSlot slot={AD_SLOTS.secondary} className="ad-slot-secondary" />
          <Contact />
        </main>
        <Footer />
      </div>
      {resumeOpen && <ResumeModal onClose={() => setResumeOpen(false)} />}
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
        <Suspense fallback={<LoadingScreen />}>
          <AdminApp />
        </Suspense>
      ) : (
        <PublicSite />
      )}
    </ContentProvider>
  )
}
