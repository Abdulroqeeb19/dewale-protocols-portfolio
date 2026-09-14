import { rejectBlockedOrigin } from './_lib/cors.js'
import { trim, escapeHtml } from './_lib/sanitize.js'
import { checkRate, rateLimitResponse, getClientIp } from './_lib/rate-limit.js'
import { SERVICE_LABELS, BUDGET_MAP } from './_lib/constants.js'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 10

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const blocked = rejectBlockedOrigin(req)
  if (blocked) return blocked

  const ip = getClientIp(req)
  if (!checkRate('notify-enquiry', ip, WINDOW_MS, MAX_PER_WINDOW)) {
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

  const apiKey = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!apiKey || !notifyEmail) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const name = trim(payload.name, 160) || 'Unknown'
  const email = trim(payload.email, 254) || ''
  const phone = trim(payload.phone, 30) || ''
  const type = trim(payload.type, 30) || 'enquiry'
  const service = trim(payload.service, 80) || ''
  const description = trim(payload.description, 5000) || ''
  const budget = trim(payload.budget, 40) || ''
  const location = trim(payload.location, 200) || ''
  const paymentPreference = trim(payload.paymentPreference, 30) || ''
  const paymentRef = trim(payload.paymentRef, 100) || ''
  const source = trim(payload.source, 30) || 'web'

  const typeLabel = type === 'order' ? 'New Order' : type === 'booking' ? 'New Booking' : 'New Enquiry'
  const serviceLabel = SERVICE_LABELS[service] || service.replace(/-/g, ' ') || 'Not specified'
  const budgetLabel = BUDGET_MAP[budget]?.label || budget.replace(/-/g, ' ') || 'Not specified'

  const subject = `${typeLabel}: ${name} — ${serviceLabel}`.slice(0, 150)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f6f8;padding:24px;border-radius:12px">
      <div style="background:#0b0c10;color:#25d366;padding:24px;border-radius:10px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">&#127881;</div>
        <strong style="font-size:20px;color:#fff">${escapeHtml(typeLabel)}</strong>
        <p style="margin:6px 0 0;font-size:13px;color:#9aa3b2">Someone just hired you through the AI assistant!</p>
      </div>
      <div style="background:#ffffff;padding:24px;border-radius:10px;margin-top:12px;color:#111">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:10px 0;font-weight:700;width:130px;color:#333">Client Name</td>
            <td style="color:#111">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Email</td>
            <td><a href="mailto:${escapeHtml(email)}" style="color:#25d366">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Phone</td>
            <td style="color:#111">${escapeHtml(phone || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Service</td>
            <td style="color:#111">${escapeHtml(serviceLabel)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Budget</td>
            <td style="color:#111">${escapeHtml(budgetLabel)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Location</td>
            <td style="color:#111">${escapeHtml(location || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Payment</td>
            <td style="color:#111">${escapeHtml(paymentPreference.replace(/-/g, ' ') || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;color:#333">Source</td>
            <td style="color:#111">${escapeHtml(source === 'web' ? 'WhatsApp Chat Widget' : 'WhatsApp DM')}</td>
          </tr>
          ${paymentRef ? `<tr><td style="padding:10px 0;font-weight:700;color:#333">Payment Ref</td><td style="color:#111">${escapeHtml(paymentRef)}</td></tr>` : ''}
        </table>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee">
          <strong style="font-size:13px;color:#333">Project Description</strong>
          <p style="white-space:pre-wrap;color:#444;margin-top:8px;font-size:14px;line-height:1.7;background:#f9fafb;padding:14px;border-radius:8px;border:1px solid #eee">${escapeHtml(description || 'No description provided')}</p>
        </div>

        <div style="margin-top:24px;text-align:center">
          <a href="mailto:${escapeHtml(email)}?subject=Re: Your ${escapeHtml(serviceLabel)} enquiry&body=Hi ${escapeHtml(name.split(' ')[0])},%0A%0AThank you for reaching out! I've received your enquiry about ${escapeHtml(serviceLabel)} and would love to discuss further.%0A%0ABest regards,%0AAbdulroqeeb Olapade" style="display:inline-block;padding:14px 32px;background:#25d366;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Reply to ${escapeHtml(name.split(' ')[0])}</a>
        </div>

        <p style="margin-top:24px;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">
          Auto-notified from dewale-protocols-portfolio.vercel.app AI assistant
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
        to: [notifyEmail],
        replyTo: email || undefined,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      console.error('Resend notification error:', await res.text())
    }
  } catch (e) {
    console.error('Email notification failed:', e)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
