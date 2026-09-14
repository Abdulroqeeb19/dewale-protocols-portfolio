import { verifyWebhook, verifyRequestSignature, markWhatsAppRead } from '../../src/lib/whatsapp.js'
import { BUDGET_MAP, SERVICE_LABELS, TYPE_LABELS } from '../_lib/constants.js'
import { escapeHtml } from '../_lib/sanitize.js'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 60
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

const FLOW_STEPS = {
  greeting: {
    response: "Hello! Welcome to Dewale Protocols. I'm here to help you place an order, book a service, or get a quote.\n\nReply with a number:\n1. Place an Order\n2. Book a Service\n3. General Enquiry",
    next: 'service',
    options: { '1': 'order', '2': 'booking', '3': 'enquiry' },
  },
  service: {
    response: "Which service are you interested in?\n\n1. AI Automation\n2. AI Chatbots\n3. E-Commerce Systems\n4. Full Stack Development\n5. Smart Campus\n6. Business Systems\n7. Tech Consulting",
    next: 'name',
    options: {
      '1': 'ai-automation', '2': 'ai-chatbots', '3': 'ecommerce',
      '4': 'fullstack', '5': 'smart-campus', '6': 'business-systems', '7': 'consulting',
    },
  },
  name: {
    response: 'What is your full name?',
    next: 'email',
    input: true,
  },
  email: {
    response: 'What is your email address?',
    next: 'phone',
    input: true,
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  phone: {
    response: 'What is your phone number?',
    next: 'description',
    input: true,
  },
  description: {
    response: 'Please describe what you need — your project goal, timeline, or any specific requirements.',
    next: 'budget',
    input: true,
    validate: (v) => v.length >= 10,
  },
  budget: {
    response: "What is your estimated budget range?\n\n1. Under $500\n2. $500 – $1,500\n3. $1,500 – $5,000\n4. $5,000 – $10,000\n5. $10,000+\n6. Discuss later",
    next: 'location',
    options: {
      '1': 'under-500', '2': '500-1500', '3': '1500-5000',
      '4': '5000-10000', '5': '10000-plus', '6': 'flexible',
    },
  },
  location: {
    response: 'Where are you located? (City & Country)',
    next: 'payment',
    input: true,
  },
  payment: {
    response: "To proceed, a deposit is required. Would you like to:\n\n1. Pay Now (Paystack link sent to you)\n2. Invoice Later\n3. Discuss Payment",
    next: 'refund',
    options: { '1': 'pay-now', '2': 'invoice-later', '3': 'discuss' },
  },
  refund: {
    response: "Refund Policy:\n• Full refund within 24 hours of payment (before work begins)\n• 50% refund if cancelled within 3 days of project start\n• No refund after deliverables have been provided\n• Disputes resolved within 7 business days\n\nReply ACCEPT to confirm you agree to the refund policy.",
    next: 'lead',
    validate: (v) => ['accept', 'agree', 'yes', 'y'].includes(v.toLowerCase()),
  },
  lead: {
    response: "How did you hear about us?\n\n1. Google Search\n2. Social Media\n3. Referral\n4. LinkedIn\n5. Twitter/X\n6. Portfolio Site",
    next: 'complete',
    options: {
      '1': 'google', '2': 'social-media', '3': 'referral',
      '4': 'linkedin', '5': 'twitter', '6': 'portfolio',
    },
  },
}

function normalizePhone(phone) {
  return phone?.replace(/\D/g, '') || ''
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query
    if (verifyWebhook(mode, token)) {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Verification failed' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['x-hub-signature-256']
  let rawBody
  try {
    rawBody = await new Promise((resolve, reject) => {
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      req.on('error', reject)
    })
  } catch {
    return res.status(400).json({ error: 'Failed to read body' })
  }

  if (!verifyRequestSignature(rawBody, signature)) {
    return res.status(403).json({ error: 'Invalid signature' })
  }

  let body
  try {
    body = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Rate limited' })
  }

  try {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const messages = changes?.value?.messages

    if (!messages?.length) {
      return res.status(200).json({ ok: true })
    }

    const msg = messages[0]
    const from = normalizePhone(msg.from)
    const msgType = msg.type
    let text = ''

    if (msgType === 'text') {
      text = msg.text?.body?.trim() || ''
    } else if (msgType === 'interactive') {
      text = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || ''
    } else {
      return res.status(200).json({ ok: true })
    }

    if (!from || !text) {
      return res.status(200).json({ ok: true })
    }

    await processIncomingMessage(from, text, msg.id)

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return res.status(200).json({ ok: true })
  }
}

async function processIncomingMessage(phone, text, messageId) {
  const { supabaseAdmin } = await import('../../src/lib/supabase-admin.js').catch(() => ({ supabaseAdmin: null }))
  if (!supabaseAdmin) return

  const { data: existing } = await supabaseAdmin
    .from('whatsapp_conversations')
    .select('*')
    .eq('phone', phone)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  let conversation = existing
  let flowState = conversation?.flow_state || 'greeting'
  let collected = conversation?.collected_data || {}

  if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'start') {
    flowState = 'greeting'
    collected = {}
  }

  const step = FLOW_STEPS[flowState]
  if (!step) return

  if (step.options) {
    const selected = step.options[text] || step.options[text.toLowerCase()]
    if (selected) {
      const fieldMap = {
        greeting: 'type', service: 'service', budget: 'budget',
        payment: 'paymentPreference', lead: 'leadSource',
      }
      const field = fieldMap[flowState]
      if (field) collected[field] = selected
    } else if (step.input) {
      collected[flowState === 'name' ? 'name' : flowState] = text
    }
  } else if (step.input) {
    if (step.validate && !step.validate(text)) return
    const fieldMap = {
      name: 'name', email: 'email', phone: 'phone',
      description: 'description', location: 'location',
    }
    collected[fieldMap[flowState] || flowState] = text
  } else if (flowState === 'refund') {
    if (!['accept', 'agree', 'yes', 'y'].includes(text.toLowerCase())) return
    collected.refundAccepted = true
  }

  const nextStep = step.next

  if (conversation) {
    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({
        flow_state: nextStep,
        collected_data: collected,
        last_message: text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)
  } else {
    await supabaseAdmin
      .from('whatsapp_conversations')
      .insert([{
        phone,
        flow_state: nextStep,
        collected_data: collected,
        last_message: text,
        name: collected.name || '',
      }])
  }

  if (nextStep === 'complete') {
    await submitEnquiry(phone, collected, supabaseAdmin)
    await sendReply(phone, `Thank you, ${collected.name || 'there'}! Your enquiry has been submitted. We'll get back to you within 24 hours at ${collected.email}. Need immediate help? Email hello@dewaleprotocols.io`)
  } else {
    const next = FLOW_STEPS[nextStep]
    if (next) await sendReply(phone, next.response)
  }

  if (messageId) await markWhatsAppRead(messageId)
}

async function submitEnquiry(phone, data, supabaseAdmin) {
  try {
    const budgetAmount = BUDGET_MAP[data.budget]?.amount || 0

    await supabaseAdmin.from('enquiries').insert([{
      name: data.name || '',
      email: data.email || '',
      phone,
      type: data.type || 'enquiry',
      service: data.service || '',
      description: data.description || '',
      budget: data.budget || '',
      location: data.location || '',
      paymentPreference: data.paymentPreference || 'discuss',
      refundAccepted: data.refundAccepted || false,
      leadSource: data.leadSource || '',
      budgetAmount,
    }])

    const apiKey = process.env.RESEND_API_KEY
    const notifyEmail = process.env.NOTIFY_EMAIL
    if (apiKey && notifyEmail) {
      const serviceLabel = SERVICE_LABELS[data.service] || data.service?.replace(/-/g, ' ') || 'N/A'
      const typeLabel = TYPE_LABELS[data.type] || 'New Enquiry'

      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f6f8;padding:24px;border-radius:12px">
        <div style="background:#0b0c10;color:#25d366;padding:24px;border-radius:10px;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">&#128241;</div>
          <strong style="font-size:20px;color:#fff">${escapeHtml(typeLabel)} via WhatsApp</strong>
          <p style="margin:6px 0 0;font-size:13px;color:#9aa3b2">A client just hired you through WhatsApp!</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:10px;margin-top:12px;color:#111">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;font-weight:700;width:120px">Name</td><td>${escapeHtml(data.name || 'Unknown')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700">Phone</td><td>${escapeHtml(phone)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700">Email</td><td>${escapeHtml(data.email || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700">Service</td><td>${escapeHtml(serviceLabel)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700">Budget</td><td>${escapeHtml(BUDGET_MAP[data.budget]?.label || 'N/A')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:700">Location</td><td>${escapeHtml(data.location || 'N/A')}</td></tr>
          </table>
          ${data.description ? `<div style="margin-top:14px;padding-top:14px;border-top:1px solid #eee"><strong style="font-size:12px;color:#666">DESCRIPTION</strong><p style="margin-top:6px;color:#333;line-height:1.6">${escapeHtml(data.description)}</p></div>` : ''}
          <p style="margin-top:20px;font-size:11px;color:#999;text-align:center">Auto-notified from WhatsApp AI assistant</p>
        </div>
      </div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Dewale Protocols <onboarding@resend.dev>',
          to: [notifyEmail],
          replyTo: data.email || undefined,
          subject: `${typeLabel} (WhatsApp): ${data.name || 'Unknown'} — ${serviceLabel}`.slice(0, 150),
          html,
        }),
      })
    }
  } catch (e) {
    console.error('Submit enquiry error:', e)
  }
}

async function sendReply(phone, text) {
  const { phoneNumberId, accessToken } = (await import('../../src/lib/whatsapp.js')).getWhatsAppConfig()
  if (!phoneNumberId || !accessToken) return

  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    })
  } catch (e) {
    console.error('Reply error:', e)
  }
}
