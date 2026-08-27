import { checkRateLimit, isAllowedOrigin, sanitizeInput, validateEmail, getClientIp, createErrorResponse } from '../lib/security.js'
import { getSupabase } from '../lib/db.js'

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method !== 'POST') return createErrorResponse(res, 405, 'method-not-allowed')

  const ip = getClientIp(req)
  if (!checkRateLimit(ip, 5, 60000)) return createErrorResponse(res, 429, 'rate-limited')

  const origin = req.headers.origin
  if (!isAllowedOrigin(origin)) return createErrorResponse(res, 403, 'forbidden-origin')

  let body
  try {
    const cl = Number(req.headers['content-length'] || 0)
    if (cl > 32 * 1024) return createErrorResponse(res, 413, 'payload-too-large')
    body = await req.json()
  } catch {
    return createErrorResponse(res, 400, 'bad-request')
  }

  const businessId = sanitizeInput(body.businessId, 100)
  const name = sanitizeInput(body.name, 160)
  const email = sanitizeInput(body.email, 254)
  const phone = sanitizeInput(body.phone, 30)
  const service = sanitizeInput(body.service, 200)
  const message = sanitizeInput(body.message, 2000)

  if (!businessId || !name || !email) return createErrorResponse(res, 422, 'missing-required-fields')
  if (!validateEmail(email)) return createErrorResponse(res, 422, 'invalid-email')
  if (name.length < 2) return createErrorResponse(res, 422, 'name-too-short')

  const spamPatterns = [/viagra/i, /casino/i, /crypto.*profit/i, /click.*here/i, /free.*money/i, /bit\.ly/i]
  if (spamPatterns.some(p => p.test(message) || p.test(name))) {
    return createErrorResponse(res, 422, 'spam-detected')
  }

  const db = getSupabase()
  if (!db) return createErrorResponse(res, 503, 'service-unavailable')

  try {
    const { data: business, error: bizErr } = await db
      .from('businesses')
      .select('id, name, email')
      .or(`slug.eq.${businessId},id.eq.${businessId}`)
      .single()

    if (bizErr || !business) return createErrorResponse(res, 404, 'business-not-found')

    const { error: leadErr } = await db.from('leads').insert([{
      business_id: business.id,
      name, email, phone, service, message,
      source: 'chatbot',
      ip_address: ip.slice(0, 45),
      user_agent: sanitizeInput(req.headers['user-agent'] || '', 200),
    }])

    if (leadErr) {
      console.error('Lead insert error:', leadErr)
      return createErrorResponse(res, 500, 'database-error')
    }

    const apiKey = process.env.RESEND_API_KEY
    const notifyEmail = business.email || process.env.NOTIFY_EMAIL
    if (apiKey && notifyEmail && validateEmail(notifyEmail)) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'ChatBot Pro <onboarding@resend.dev>',
          to: [notifyEmail],
          replyTo: email,
          subject: `New lead: ${name} — ${service || 'General enquiry'}`.slice(0, 150),
          html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f5f6f8;border-radius:12px">
            <div style="background:#6366f1;color:#fff;padding:20px;border-radius:10px;text-align:center">
              <strong style="font-size:18px">New Lead from ${business.name}</strong>
            </div>
            <div style="background:#fff;padding:20px;border-radius:10px;margin-top:10px;color:#111">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
              <p><strong>Service:</strong> ${service || 'General'}</p>
              <p><strong>Message:</strong> ${message || 'N/A'}</p>
            </div>
          </div>`,
        }),
      }).catch(() => {})
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Leads API error:', e)
    return createErrorResponse(res, 500, 'internal-error')
  }
}
