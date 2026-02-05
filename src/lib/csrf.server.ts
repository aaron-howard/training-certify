/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Generate a CSRF token
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  const secret = process.env.CSRF_SECRET || 'dev-secret'
  const random = randomBytes(16).toString('hex')
  const hmac = createHmac('sha256', secret).update(random).digest('hex')
  return `${random}.${hmac}`
}

/**
 * Validate a CSRF token
 * @param token Token to validate
 * @param secret CSRF secret from environment
 * @returns true if valid, false otherwise
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
 */
export function requireCSRFToken(token: string | null): void {
  const secret = process.env.CSRF_SECRET

  if (!secret) {
    console.warn('⚠️  CSRF_SECRET not configured - CSRF protection disabled')
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
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  return (
    request.headers.get('X-CSRF-Token') ||
    request.headers.get('x-csrf-token') ||
    null
  )
}
