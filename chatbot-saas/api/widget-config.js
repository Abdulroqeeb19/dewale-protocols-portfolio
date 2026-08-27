import { checkRateLimit, getClientIp, createErrorResponse } from '../lib/security.js'
import { getSupabase } from '../lib/db.js'

const configCache = new Map()
const CACHE_TTL = 60 * 1000

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60')

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 60, 60000)) return createErrorResponse(res, 429, 'rate-limited')

  const { id } = req.query
  if (!id || typeof id !== 'string') return createErrorResponse(res, 400, 'missing-id')
  if (id.length > 100 || !/^[a-zA-Z0-9\-]+$/.test(id)) return createErrorResponse(res, 400, 'invalid-id')

  const cached = configCache.get(id)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ ok: true, config: cached.data, cached: true })
  }

  const db = getSupabase()
  if (!db) return createErrorResponse(res, 503, 'service-unavailable')

  try {
    const { data, error } = await db
      .from('businesses')
      .select('id, name, slug, description, location, phone, email, chatbot_config')
      .or(`slug.eq.${id},id.eq.${id}`)
      .single()

    if (error || !data) return createErrorResponse(res, 404, 'not-found')

    const config = data.chatbot_config || {}
    const safeConfig = {
      greeting: String(config.greeting || 'Hello! How can we help you today?').slice(0, 500),
      primaryColor: /^#[0-9a-fA-F]{3,8}$/.test(config.primaryColor) ? config.primaryColor : '#6366f1',
      position: ['bottom-right', 'bottom-left'].includes(config.position) ? config.position : 'bottom-right',
      businessName: String(data.name || 'Business').slice(0, 100),
      services: Array.isArray(config.services)
        ? config.services.slice(0, 50).map(s => ({
            name: String(s.name || '').slice(0, 200),
            price: String(s.price || '').slice(0, 50),
            description: String(s.description || '').slice(0, 500),
          }))
        : [],
    }

    configCache.set(id, { data: safeConfig, ts: Date.now() })

    if (configCache.size > 10000) {
      const oldest = configCache.keys().next().value
      configCache.delete(oldest)
    }

    return res.status(200).json({ ok: true, config: safeConfig })
  } catch (e) {
    console.error('Widget config error:', e)
    return createErrorResponse(res, 500, 'internal-error')
  }
}
