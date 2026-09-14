const ALLOWED_HOSTS = [
  'dewale-protocols-portfolio.vercel.app',
  'localhost',
  '127.0.0.1',
]

export function isAllowedOrigin(origin) {
  if (!origin) return false
  try {
    const host = new URL(origin).hostname
    return ALLOWED_HOSTS.includes(host)
  } catch {
    return false
  }
}

export function rejectBlockedOrigin(req) {
  const origin = req.headers.get('origin')
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ ok: false, reason: 'forbidden-origin' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }
  return null
}
