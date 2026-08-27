const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 30
const rate = new Map()

export function checkRateLimit(ip, max = RATE_LIMIT_MAX, window = RATE_LIMIT_WINDOW) {
  const now = Date.now()
  const rec = rate.get(ip)
  if (!rec || now - rec.start > window) {
    rate.set(ip, { start: now, count: 1 })
    return true
  }
  rec.count += 1
  return rec.count <= max
}

const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [ip, rec] of rate) {
    if (now - rec.start > CLEANUP_INTERVAL * 2) rate.delete(ip)
  }
}, CLEANUP_INTERVAL)

const ALLOWED_ORIGINS = [
  'https://chatbot-saas.vercel.app',
  'https://dewale-protocols-portfolio.vercel.app',
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
]

export function isAllowedOrigin(origin) {
  if (!origin) return false
  try {
    const host = new URL(origin).hostname
    return ALLOWED_ORIGINS.some(o => {
      try { return new URL(o).hostname === host } catch { return false }
    }) || host.endsWith('.vercel.app') || host === 'localhost'
  } catch {
    return false
  }
}

export function sanitizeInput(str, maxLen = 1000) {
  return String(str || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen)
}

export function validateEmail(email) {
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email)
}

export function validateSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 50
}

export function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown')
    .split(',')[0].trim().slice(0, 45)
}

export function createErrorResponse(res, status, reason) {
  return res.status(status).json({ ok: false, reason })
}
