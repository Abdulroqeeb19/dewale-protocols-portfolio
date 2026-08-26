export default async function handler(req, res) {
  const { slug } = req.query
  if (!slug) return res.status(400).json({ ok: false, reason: 'missing slug' })

  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return res.status(500).json({ ok: false, reason: 'not-configured' })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, slug, description, location, phone, email, chatbot_config')
      .eq('slug', slug)
      .single()

    if (error || !data) return res.status(404).json({ ok: false, reason: 'not-found' })

    return res.status(200).json({ ok: true, business: data })
  } catch (e) {
    return res.status(500).json({ ok: false })
  }
}
