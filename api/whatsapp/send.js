import { rejectBlockedOrigin } from '../_lib/cors.js'
import { trim } from '../_lib/sanitize.js'
import { checkRate, rateLimitResponse, getClientIp } from '../_lib/rate-limit.js'

const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 10

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const blocked = rejectBlockedOrigin(req)
  if (blocked) return blocked

  const ip = getClientIp(req)
  if (!checkRate('whatsapp-send', ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return rateLimitResponse()
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'bad-request' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const to = trim(payload.to, 30)
  const message = trim(payload.message, 4000)

  if (!to || !message) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing-fields' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const phoneDigits = to.replace(/\D/g, '')
  if (phoneDigits.length < 8) {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid-phone' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      return new Response(JSON.stringify({ ok: false, reason: 'not-configured' }), {
        status: 501,
        headers: { 'content-type': 'application/json' },
      })
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneDigits,
      type: 'text',
      text: { preview_url: false, body: message },
    }

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, reason: 'api-error' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'send-failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
