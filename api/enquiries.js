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
const MAX_PER_WINDOW = 10
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

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ ok: false, reason: 'rate-limited' }), {
      status: 429,
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

  const name = trim(payload.name, 160)
  const email = trim(payload.email, 254)
  const phone = trim(payload.phone, 30)
  const type = trim(payload.type, 30)
  const service = trim(payload.service, 80)
  const description = trim(payload.description, 5000)
  const budget = trim(payload.budget, 40)
  const location = trim(payload.location, 200)
  const paymentPreference = trim(payload.paymentPreference, 30)
  const paymentRef = trim(payload.paymentRef, 100)
  const leadSource = trim(payload.leadSource, 50)

  if (!name || !email || !type || !service) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing-required-fields' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid-email' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL

  if (!apiKey || !to) {
    return new Response(JSON.stringify({ ok: true, stored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const typeLabel = type === 'order' ? 'Order' : type === 'booking' ? 'Service Booking' : 'General Enquiry'
  const subject = `New ${typeLabel} from ${name} — ${service.replace(/-/g, ' ')}`.slice(0, 150)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f6f8;padding:24px;border-radius:12px">
      <div style="background:#0b0c10;color:#66fcf1;padding:20px 24px;border-radius:10px">
        <strong style="font-size:18px">New WhatsApp Enquiry</strong>
        <p style="margin:4px 0 0;font-size:13px;color:#9aa3b2">${typeLabel}</p>
      </div>
      <div style="background:#ffffff;padding:20px 24px;border-radius:10px;margin-top:12px;color:#111">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;font-weight:600;width:120px">Name</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Phone</td><td>${escapeHtml(phone || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Service</td><td>${escapeHtml(service.replace(/-/g, ' '))}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Budget</td><td>${escapeHtml(budget.replace(/-/g, ' ') || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Location</td><td>${escapeHtml(location || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Payment</td><td>${escapeHtml(paymentPreference || 'N/A')}</td></tr>
          ${paymentRef ? `<tr><td style="padding:8px 0;font-weight:600">Payment Ref</td><td>${escapeHtml(paymentRef)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;font-weight:600">Lead Source</td><td>${escapeHtml(leadSource || 'N/A')}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee">
          <strong style="font-size:13px">Project Description</strong>
          <p style="white-space:pre-wrap;color:#333;margin-top:8px;font-size:14px;line-height:1.6">${escapeHtml(description || 'No description provided')}</p>
        </div>
        <p style="margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888">
          Submitted via WhatsApp Agent on dewale-protocols-portfolio.vercel.app
        </p>
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Dewale Protocols <onboarding@resend.dev>',
        to: [to],
        replyTo: email,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Resend error:', detail)
    }
  } catch (e) {
    console.error('Email send failed:', e)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
