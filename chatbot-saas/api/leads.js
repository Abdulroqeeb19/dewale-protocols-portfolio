export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const { businessId, name, email, phone, service, message } = req.body
  if (!businessId || !name || !email) {
    return res.status(422).json({ ok: false, reason: 'missing-fields' })
  }

  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return res.status(500).json({ ok: false, reason: 'not-configured' })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, email')
      .or(`slug.eq.${businessId},id.eq.${businessId}`)
      .single()

    if (!business) return res.status(404).json({ ok: false, reason: 'business-not-found' })

    await supabase.from('leads').insert([{
      business_id: business.id,
      name, email, phone: phone || '', service: service || '', message: message || '',
    }])

    const apiKey = process.env.RESEND_API_KEY
    const notifyEmail = business.email || process.env.NOTIFY_EMAIL
    if (apiKey && notifyEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'ChatBot Pro <onboarding@resend.dev>',
          to: [notifyEmail],
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
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false })
  }
}
