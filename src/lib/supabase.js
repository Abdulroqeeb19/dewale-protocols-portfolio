import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured =
  Boolean(url) &&
  anonKey &&
  !anonKey.includes('YOUR_ANON_KEY') &&
  anonKey !== 'paste-your-anon-public-key-here'

export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null

export const BUCKET = 'portfolio-images'

export async function uploadImage(file, onProgress) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const ext = file.name.split('.').pop().toLowerCase() || 'png'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
