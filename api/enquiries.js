import { rejectBlockedOrigin } from './_lib/cors.js'
import { trim, escapeHtml } from './_lib/sanitize.js'
import { checkRate, rateLimitResponse, getClientIp } from './_lib/rate-limit.js'
import { SERVICE_LABELS, TYPE_LABELS, BUDGET_MAP, isValidEmail } from './_lib/constants.js'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 10

const VALID_TYPES = ['order', 'booking', 'enquiry']
const VALID_SERVICES = Object.keys(SERVICE_LABELS)
const VALID_BUDGETS = Object.keys(BUDGET_MAP)
const VALID_PAYMENT_PREFS = ['pay-now', 'invoice-later', 'discuss']
const VALID_LEAD_SOURCES = ['google', 'social-media', 'referral', 'linkedin', 'twitter', 'portfolio']

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const blocked = rejectBlockedOrigin(req)
  if (blocked) return blocked

  const ip = getClientIp(req)
  if (!checkRate('enquiries', ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return rateLimitResponse()
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
  const refundAccepted = payload.refundAccepted === true
  const leadSource = trim(payload.leadSource, 50)

  const errors = []

  if (!name || name.length < 2) errors.push('name must be at least 2 characters')
  if (!email || !isValidEmail(email)) errors.push('valid email is required')
  if (!type || !VALID_TYPES.includes(type)) errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`)
  if (!service || !VALID_SERVICES.includes(service)) errors.push(`service must be one of: ${VALID_SERVICES.join(', ')}`)
  if (!description || description.length < 10) errors.push('description must be at least 10 characters')
  if (phone && phone.replace(/\D/g, '').length < 8) errors.push('phone must have at least 8 digits')
  if (location && location.length < 2) errors.push('location must be at least 2 characters')
  if (budget && !VALID_BUDGETS.includes(budget)) errors.push(`budget must be one of: ${VALID_BUDGETS.join(', ')}`)
  if (paymentPreference && !VALID_PAYMENT_PREFS.includes(paymentPreference)) errors.push(`paymentPreference must be one of: ${VALID_PAYMENT_PREFS.join(', ')}`)
  if (leadSource && !VALID_LEAD_SOURCES.includes(leadSource)) errors.push(`leadSource must be one of: ${VALID_LEAD_SOURCES.join(', ')}`)
  if (paymentRef && paymentRef.length > 100) errors.push('paymentRef too long')

  if (errors.length > 0) {
    return new Response(JSON.stringify({ ok: false, reason: 'validation-failed', errors }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const serverBudgetAmount = budget ? (BUDGET_MAP[budget]?.amount || 0) : 0

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL

  if (!apiKey || !to) {
    return new Response(JSON.stringify({ ok: true, stored: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const typeLabel = TYPE_LABELS[type] || 'New Enquiry'
  const serviceLabel = SERVICE_LABELS[service] || service.replace(/-/g, ' ')
  const subject = `New ${typeLabel}: ${name} — ${serviceLabel}`.slice(0, 150)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f6f8;padding:24px;border-radius:12px">
      <div style="background:#0b0c10;color:#66fcf1;padding:20px 24px;border-radius:10px">
        <strong style="font-size:18px">New Enquiry</strong>
        <p style="margin:4px 0 0;font-size:13px;color:#9aa3b2">${typeLabel}</p>
      </div>
      <div style="background:#ffffff;padding:20px 24px;border-radius:10px;margin-top:12px;color:#111">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;font-weight:600;width:120px">Name</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Phone</td><td>${escapeHtml(phone || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Service</td><td>${escapeHtml(serviceLabel)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Budget</td><td>${escapeHtml(BUDGET_MAP[budget]?.label || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Location</td><td>${escapeHtml(location || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Payment</td><td>${escapeHtml(paymentPreference || 'N/A')}</td></tr>
          ${paymentRef ? `<tr><td style="padding:8px 0;font-weight:600">Payment Ref</td><td>${escapeHtml(paymentRef)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;font-weight:600">Lead Source</td><td>${escapeHtml(leadSource || 'N/A')}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600">Refund Accepted</td><td>${refundAccepted ? 'Yes' : 'No'}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee">
          <strong style="font-size:13px">Project Description</strong>
          <p style="white-space:pre-wrap;color:#333;margin-top:8px;font-size:14px;line-height:1.6">${escapeHtml(description || 'No description provided')}</p>
        </div>
        <p style="margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888">
          Submitted via portfolio site on dewale-protocols-portfolio.vercel.app
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
      console.error('Resend error:', await res.text())
    }
  } catch (e) {
    console.error('Email send failed:', e)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
