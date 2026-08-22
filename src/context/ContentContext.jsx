import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { defaultContent } from '../data/defaultContent'

const ContentContext = createContext(null)

function deepMerge(base, override) {
  if (override === undefined || override === null) return base
  if (typeof base !== 'object' || typeof override !== 'object') return override
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base
    return override.length > 0 ? override : base
  }
  const out = { ...base }
  for (const key of Object.keys(override)) {
    if (override[key] !== undefined && override[key] !== null) {
      out[key] = key in base ? deepMerge(base[key], override[key]) : override[key]
    }
  }
  return out
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => deepMerge(defaultContent, {}))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus('ready')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('site_content')
          .select('data')
          .eq('id', 1)
          .maybeSingle()
        if (cancelled) return
        if (fetchError) throw fetchError
        if (data?.data) setContent(deepMerge(defaultContent, data.data))
        setStatus('ready')
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setStatus('ready')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveContent = useCallback(async (next) => {
    setContent(next)
    if (!supabaseConfigured) throw new Error('Supabase is not configured.')
    const { error: saveError } = await supabase.from('site_content').upsert(
      { id: 1, data: next, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    if (saveError) throw saveError
  }, [])

  const value = useMemo(() => ({ content, status, error, saveContent }), [content, status, error, saveContent])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
