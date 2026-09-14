const stores = new Map()

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)
}

export function checkRate(name, ip, windowMs, maxPerWindow) {
  const store = getStore(name)
  const now = Date.now()
  const key = ip
  const rec = store.get(key)

  if (!rec || now - rec.start > windowMs) {
    store.set(key, { start: now, count: 1 })
    return true
  }

  rec.count += 1
  return rec.count <= maxPerWindow
}

export function rateLimitResponse() {
  return new Response(JSON.stringify({ ok: false, reason: 'rate-limited' }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  })
}

export function getClientIp(req) {
  return (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
}
