/**
 * Client-side CSRF token for mutation API requests (POST, PATCH, DELETE).
 * Use fetchWithCsrf() when calling API routes that require X-CSRF-Token.
 */

let cachedToken: string | null = null

/**
 * Fetches a CSRF token from GET /api/csrf and caches it.
 * Call this before mutation requests, or use fetchWithCsrf() which does it for you.
 */
export async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const res = await fetch('/api/csrf')
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const { token } = await res.json()
  if (!token) throw new Error('Invalid CSRF response')
  cachedToken = token
  return token
}

/**
 * Same as fetch(), but adds X-CSRF-Token header for mutation methods (POST, PATCH, DELETE).
 * Use for API routes that require CSRF (e.g. POST /api/users, PATCH /api/users).
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const headers = new Headers(init?.headers)
  if (needsCsrf) {
    const token = await getCsrfToken()
    headers.set('X-CSRF-Token', token)
  }
  return fetch(input, { ...init, headers })
}
