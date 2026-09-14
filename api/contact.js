import { rejectBlockedOrigin } from './_lib/cors.js'
import { trim, escapeHtml } from './_lib/sanitize.js'
import { checkRate, rateLimitResponse, getClientIp } from './_lib/rate-limit.js'
import { isValidEmail } from './_lib/constants.js'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 4

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const blocked = rejectBlockedOrigin(req)
  if (blocked) return blocked

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

  const ip = getClientIp(req)
  if (!checkRate('contact', ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return rateLimitResponse()
  }

  const name = trim(payload.name, 160)
  const email = trim(payload.email, 254)
  const message = trim(payload.message, 20000)
  const notifyEmail = trim(payload.notifyEmail, 254)

  if (!name || !email || !message || !isValidEmail(email)) {
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
  if (!to || !isValidEmail(to)) {
    return new Response(JSON.stringify({ ok: false, reason: 'no-recipient' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    })
  }

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
    return new Response(JSON.stringify({ ok: false, reason: 'email-send-failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
