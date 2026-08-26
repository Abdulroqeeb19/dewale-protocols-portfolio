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
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'bad-request' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { to, message, type = 'text' } = payload
  if (!to || !message) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing-fields' }), {
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
      to: to.replace(/\D/g, ''),
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
      return new Response(JSON.stringify({ ok: false, reason: 'api-error', detail: data?.error?.message }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, reason: 'send-failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
