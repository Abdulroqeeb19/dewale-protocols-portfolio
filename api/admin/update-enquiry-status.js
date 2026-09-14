import { createClient } from '@supabase/supabase-js'
import { trim } from '../_lib/sanitize.js'
import { VALID_STATUSES } from '../_lib/constants.js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdmin() {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ ok: false, reason: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const token = authHeader.slice(7)
  const admin = getAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ ok: false, reason: 'server-misconfigured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ ok: false, reason: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { data: isAdmin } = await admin.rpc('is_admin')
  if (!isAdmin) {
    return new Response(JSON.stringify({ ok: false, reason: 'forbidden' }), {
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

  const id = trim(payload.id, 100)
  const status = trim(payload.status, 30)

  if (!id) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing-id' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return new Response(JSON.stringify({ ok: false, reason: `invalid-status. Must be one of: ${VALID_STATUSES.join(', ')}` }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { error } = await admin
    .from('enquiries')
    .update({ status })
    .eq('id', id)

  if (error) {
    return new Response(JSON.stringify({ ok: false, reason: 'update-failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
