/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Generate a CSRF token using HMAC-SHA256.
 * Token format: {random}.{hmac}
 * 
 * @returns CSRF token string in format "random.hmac"
 */
export function generateCSRFToken(): string {
  const secret = process.env.CSRF_SECRET || 'dev-secret'
  const random = randomBytes(16).toString('hex')
  const hmac = createHmac('sha256', secret).update(random).digest('hex')
  return `${random}.${hmac}`
}

/**
 * Validate a CSRF token using timing-safe comparison.
 * Prevents timing attacks by using crypto.timingSafeEqual.
 * 
 * @param token - CSRF token to validate (format: "random.hmac")
 * @param secret - CSRF secret from environment variables
 * @returns true if token is valid, false otherwise
 */
export function validateCSRFToken(token: string, secret: string): boolean {
  if (!token || !secret) {
    return false
  }

  try {
    const [random, hmac] = token.split('.')
    if (!random || !hmac) return false

    const expectedHmac = createHmac('sha256', secret)
      .update(random)
      .digest('hex')

    // Use timingSafeEqual to prevent timing attacks
    const hmacBuffer = Buffer.from(hmac)
    const expectedBuffer = Buffer.from(expectedHmac)

    if (hmacBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(hmacBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations
 * In production, fails fast if CSRF_SECRET is not configured
 */
export function requireCSRFToken(token: string | null): void {
  const secret = process.env.CSRF_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'CSRF_SECRET is required in production. CSRF protection cannot be disabled.'
      )
    }
    console.warn('⚠️  CSRF_SECRET not configured - CSRF protection disabled (development only)')
    return
  }

  if (!token) {
    throw new Error('CSRF token missing')
  }

  if (!validateCSRFToken(token, secret)) {
    throw new Error('Invalid CSRF token')
  }
}

/**
 * Extract CSRF token from request headers.
 * Checks both 'X-CSRF-Token' and 'x-csrf-token' headers (case-insensitive).
 * 
 * @param request - The incoming request object
 * @returns CSRF token string or null if not found
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  return (
    request.headers.get('X-CSRF-Token') ||
    request.headers.get('x-csrf-token') ||
    null
  )
}
