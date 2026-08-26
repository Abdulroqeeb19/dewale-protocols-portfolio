const API_VERSION = 'v21.0'
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

export function getWhatsAppConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'dewale-protocols-wa-verify',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    appId: process.env.WHATSAPP_APP_ID,
  }
}

export function isWhatsAppConfigured() {
  const { phoneNumberId, accessToken } = getWhatsAppConfig()
  return Boolean(phoneNumberId && accessToken)
}

export async function sendWhatsAppMessage(to, message) {
  const { phoneNumberId, accessToken } = getWhatsAppConfig()
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp API not configured')
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: message },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('WhatsApp send error:', data)
    throw new Error(data?.error?.message || 'Failed to send WhatsApp message')
  }
  return data
}

export async function sendWhatsAppTemplate(to, templateName, languageCode = 'en', components = []) {
  const { phoneNumberId, accessToken } = getWhatsAppConfig()
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp API not configured')
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('WhatsApp template error:', data)
    throw new Error(data?.error?.message || 'Failed to send WhatsApp template')
  }
  return data
}

export async function markWhatsAppRead(messageId) {
  const { phoneNumberId, accessToken } = getWhatsAppConfig()
  if (!phoneNumberId || !accessToken) return

  try {
    await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    })
  } catch (e) {
    console.error('WhatsApp mark read error:', e)
  }
}

export function verifyWebhook(mode, token) {
  const { verifyToken } = getWhatsAppConfig()
  return mode === 'subscribe' && token === verifyToken
}
