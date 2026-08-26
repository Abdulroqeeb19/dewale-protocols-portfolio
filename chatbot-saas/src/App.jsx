import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Admin from './pages/Admin'
import BusinessPage from './pages/BusinessPage'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHashRoute()
  const path = window.location.pathname

  if (path.startsWith('/b/')) {
    const slug = path.split('/b/')[1]?.split('?')[0]
    return <BusinessPage slug={slug} />
  }

  if (hash.startsWith('#/admin')) return <Admin />

  return <Landing />
}
