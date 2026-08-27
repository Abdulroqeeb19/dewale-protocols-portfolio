import { checkRateLimit, getClientIp, createErrorResponse } from '../lib/security.js'
import { getSupabase } from '../lib/db.js'

const pageCache = new Map()
const CACHE_TTL = 60 * 1000

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 30, 60000)) return createErrorResponse(res, 429, 'rate-limited')

  const { slug } = req.query
  if (!slug || typeof slug !== 'string') return createErrorResponse(res, 400, 'missing-slug')
  if (slug.length > 50 || !/^[a-zA-Z0-9\-]+$/.test(slug)) return createErrorResponse(res, 400, 'invalid-slug')

  const cached = pageCache.get(slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ ok: true, business: cached.data })
  }

  const db = getSupabase()
  if (!db) return createErrorResponse(res, 503, 'service-unavailable')

  try {
    const { data, error } = await db
      .from('businesses')
      .select('id, name, slug, description, location, phone, email, chatbot_config')
      .eq('slug', slug)
      .single()

    if (error || !data) return createErrorResponse(res, 404, 'not-found')

    const safeData = {
      id: data.id,
      name: String(data.name || '').slice(0, 200),
      slug: String(data.slug || '').slice(0, 50),
      description: String(data.description || '').slice(0, 2000),
      location: String(data.location || '').slice(0, 200),
      phone: String(data.phone || '').slice(0, 30),
      email: String(data.email || '').slice(0, 254),
      chatbot_config: {
        greeting: String(data.chatbot_config?.greeting || '').slice(0, 500),
        primaryColor: data.chatbot_config?.primaryColor || '#6366f1',
        position: data.chatbot_config?.position || 'bottom-right',
        services: Array.isArray(data.chatbot_config?.services)
          ? data.chatbot_config.services.slice(0, 50)
          : [],
      },
    }

    pageCache.set(slug, { data: safeData, ts: Date.now() })

    if (pageCache.size > 5000) {
      const oldest = pageCache.keys().next().value
      pageCache.delete(oldest)
    }

    return res.status(200).json({ ok: true, business: safeData })
  } catch (e) {
    console.error('Business API error:', e)
    return createErrorResponse(res, 500, 'internal-error')
  }
}
