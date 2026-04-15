/**
 * Security Headers Middleware
 *
 * Provides security headers for HTTP responses to protect against common
 * web vulnerabilities including XSS, clickjacking, MIME sniffing, and more.
 */

/**
 * Build Content-Security-Policy (roadmap P7 / #22).
 * - Production: omit `unsafe-eval`; allow Swagger UI CDN (`unpkg.com`); add `object-src`, `base-uri`, `upgrade-insecure-requests`.
 * - Development: keep `unsafe-eval` for Vite; widen `connect-src` for localhost WebSocket HMR.
 * - `script-src` / `style-src` still allow `unsafe-inline` for Clerk, `/api-docs` inline boot, and framework-injected tags; nonces are a follow-up.
 */
export function buildContentSecurityPolicy(isProduction: boolean): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://clerk.com',
    'https://*.clerk.accounts.dev',
    'https://unpkg.com',
  ]
  if (!isProduction) {
    scriptSrc.push("'unsafe-eval'")
  }

  const connectSrc = [
    "'self'",
    'https://clerk.com',
    'https://*.clerk.accounts.dev',
    'https://api.clerk.com',
    'https://*.ingest.sentry.io',
    'https://*.sentry.io',
  ]
  if (!isProduction) {
    connectSrc.push(
      'http://127.0.0.1:*',
      'http://localhost:*',
      'ws://127.0.0.1:*',
      'ws://localhost:*',
      'wss://127.0.0.1:*',
      'wss://localhost:*',
    )
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    "worker-src 'self' blob:",
  ]

  if (isProduction) {
    directives.push(
      "object-src 'none'",
      "base-uri 'self'",
      'upgrade-insecure-requests',
    )
  }

  return directives.join('; ')
}

/**
 * Get security headers for HTTP responses.
 *
 * Returns a comprehensive set of security headers including:
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-XSS-Protection: Enables XSS protection
 * - Strict-Transport-Security: Forces HTTPS in production
 * - Content-Security-Policy: Restricts resource loading
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 *
 * @returns Object mapping header names to header values
 *
 * @example
 * ```typescript
 * const headers = getSecurityHeaders()
 * response.headers.set('X-Frame-Options', headers['X-Frame-Options'])
 * ```
 */
export function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Force HTTPS in production
    ...(isProduction && {
      'Strict-Transport-Security':
        'max-age=31536000; includeSubDomains; preload',
    }),

    'Content-Security-Policy': buildContentSecurityPolicy(isProduction),

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * Apply security headers to an existing Response object.
 *
 * Modifies the response headers in-place by adding all security headers.
 *
 * @param response - The Response object to modify
 * @returns The same Response object with security headers applied
 *
 * @example
 * ```typescript
 * const response = json({ data: 'test' })
 * return applySecurityHeaders(response)
 * ```
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders()

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Create a new Response with security headers automatically applied.
 *
 * Convenience function that creates a Response and applies all security headers
 * in one step. Use this instead of `new Response()` for API responses.
 *
 * @param body - Response body (string, Blob, FormData, etc.)
 * @param init - Optional ResponseInit object (status, headers, etc.)
 * @returns New Response object with security headers applied
 *
 * @example
 * ```typescript
 * return createSecureResponse(JSON.stringify({ data: 'test' }), { status: 200 })
 * ```
 */
export function createSecureResponse(
  body: BodyInit | null,
  init?: ResponseInit,
): Response {
  const response = new Response(body, init)
  return applySecurityHeaders(response)
}
