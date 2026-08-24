let cachedToken: string | null = null

async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const res = await fetch('/api/csrf')
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const { token } = await res.json()
  if (!token) throw new Error('Invalid CSRF response')
  cachedToken = token
  return token
}

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
