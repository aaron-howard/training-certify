/**
 * Optional bearer / header gate for internal-only HTTP routes (metrics, deep health).
 * Set INTERNAL_OPS_TOKEN (min 16 chars) to require Authorization: Bearer <token>
 * or X-Internal-Ops-Token: <token> on each request.
 */

import { timingSafeEqual } from 'node:crypto'

function safeEqualUtf8(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Bearer realm="internal"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

/**
 * When INTERNAL_OPS_TOKEN is configured, require a matching credential on the request.
 * @returns 401 Response if gated and auth fails; null if the request may proceed.
 */
export function requireInternalOpsAuth(request: Request): Response | null {
  const token = process.env.INTERNAL_OPS_TOKEN?.trim()
  if (!token) return null

  const auth = request.headers.get('authorization')?.trim() ?? ''
  const bearer =
    auth.length > 7 && auth.slice(0, 7).toLowerCase() === 'bearer '
      ? auth.slice(7).trim()
      : ''
  const headerToken = request.headers.get('x-internal-ops-token')?.trim() ?? ''

  const ok =
    (bearer.length > 0 && safeEqualUtf8(bearer, token)) ||
    (headerToken.length > 0 && safeEqualUtf8(headerToken, token))

  return ok ? null : unauthorized()
}
