/**
 * Security Headers Middleware
 * Provides security headers for HTTP responses
 */

/**
 * Get security headers for production
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

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://api.clerk.com",
      "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev",
    ].join('; '),

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders()

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Create a response with security headers
 */
export function createSecureResponse(body: any, init?: ResponseInit): Response {
  const response = new Response(body, init)
  return applySecurityHeaders(response)
}
