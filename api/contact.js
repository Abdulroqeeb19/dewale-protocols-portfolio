const isAllowedOrigin = (origin) => {
  if (!origin) return false
  try {
    const host = new URL(origin).hostname
    return (
      host === 'dewale-protocols-portfolio.vercel.app' ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    )
  } catch {
    return false
  }
}

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 4
const rate = new Map()

function checkRate(ip) {
  const now = Date.now()
  const rec = rate.get(ip)
  if (!rec || now - rec.start > WINDOW_MS) {
    rate.set(ip, { start: now, count: 1 })
    return true
  }
  rec.count += 1
  return rec.count <= MAX_PER_WINDOW
}

function trim(s, max) {
  return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim().slice(0, max)
}

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const origin = req.headers.get('origin')
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ ok: false, reason: 'forbidden-origin' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  let payload
  try {
    const cl = Number(req.headers.get('content-length') || 0)
    if (cl > 64 * 1024) {
      return new Response(JSON.stringify({ ok: false, reason: 'payload-too-large' }), {
        status: 413,
        headers: { 'content-type': 'application/json' },
      })
    }
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'bad-request' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ ok: false, reason: 'rate-limited' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }

  const name = trim(payload.name, 160)
  const email = trim(payload.email, 254)
  const message = trim(payload.message, 20000)
  const notifyEmail = trim(payload.notifyEmail, 254)

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid-input' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, reason: 'not-configured' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    })
  }

  const to = notifyEmail || process.env.NOTIFY_EMAIL
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return new Response(JSON.stringify({ ok: false, reason: 'no-recipient' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    })
  }

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const subject = `New portfolio message from ${name}`.slice(0, 150)
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f5f6f8;padding:24px;border-radius:12px">
      <div style="background:#0b0c10;color:#66fcf1;padding:20px 24px;border-radius:10px">
        <strong style="font-size:18px">New portfolio message</strong>
      </div>
      <div style="background:#ffffff;padding:20px 24px;border-radius:10px;margin-top:12px;color:#111">
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p style="margin-top:16px"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;color:#333">${escapeHtml(message)}</p>
        <p style="margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888">
          Sent from the contact form on dewale-protocols-portfolio.vercel.app
        </p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Dewale Protocols Portfolio <onboarding@resend.dev>',
      to: [to],
      replyTo: email,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return new Response(JSON.stringify({ ok: false, reason: 'resend-error', detail: detail.slice(0, 500) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}