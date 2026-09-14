import { rejectBlockedOrigin } from './_lib/cors.js'
import { trim } from './_lib/sanitize.js'
import { checkRate, rateLimitResponse, getClientIp } from './_lib/rate-limit.js'
import { BUDGET_MAP, isValidEmail } from './_lib/constants.js'

const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 5

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const blocked = rejectBlockedOrigin(req)
  if (blocked) return blocked

  const ip = getClientIp(req)
  if (!checkRate('validate-payment', ip, WINDOW_MS, MAX_PER_WINDOW)) {
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

  const budget = trim(payload.budget, 40)
  const email = trim(payload.email, 254)

  if (!budget || !BUDGET_MAP[budget]) {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid-budget' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({ ok: false, reason: 'invalid-email' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const budgetInfo = BUDGET_MAP[budget]

  return new Response(JSON.stringify({
    ok: true,
    amount: budgetInfo.amount,
    currency: 'NGN',
    label: budgetInfo.label,
    reference: `DP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
