/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { logger } from './logging.server'

/**
 * Generate a CSRF token using HMAC-SHA256.
 *
 * Creates a cryptographically secure CSRF token by combining a random value
 * with an HMAC signature. The token format is "{random}.{hmac}".
 *
 * In production, requires CSRF_SECRET environment variable. In development,
 * generates a temporary secret if not configured (with a warning).
 *
 * @returns CSRF token string in format "random.hmac" (64-character random + 64-character HMAC)
 * @throws {Error} If CSRF_SECRET is not set in production environment
 *
 * @example
 * ```typescript
 * const token = generateCSRFToken()
 * // Returns: "a1b2c3d4e5f6...1234567890abcdef.abc123def456..."
 * ```
 */
export function generateCSRFToken(): string {
  const secret = process.env.CSRF_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'CSRF_SECRET is required in production. Cannot generate CSRF token without secret.',
      )
    }
    // In development, generate a random secret per session if not configured
    // This prevents using a weak default but allows development without config
    const devSecret = `dev-${randomBytes(16).toString('hex')}`
    logger.warn(
      { service: 'csrf' },
      'CSRF_SECRET not configured - using temporary dev secret (development only)',
    )
    const random = randomBytes(16).toString('hex')
    const hmac = createHmac('sha256', devSecret).update(random).digest('hex')
    return `${random}.${hmac}`
  }

  const random = randomBytes(16).toString('hex')
  const hmac = createHmac('sha256', secret).update(random).digest('hex')
  return `${random}.${hmac}`
}

/**
 * Validate a CSRF token using timing-safe comparison.
 *
 * Validates a CSRF token by recomputing the HMAC and comparing it with
 * the provided token using timing-safe comparison to prevent timing attacks.
 *
 * @param token - CSRF token to validate (format: "random.hmac")
 * @param secret - CSRF secret from environment variables (must match the secret used to generate the token)
 * @returns true if token is valid and matches the secret, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateCSRFToken(tokenFromClient, process.env.CSRF_SECRET!)
 * if (!isValid) {
 *   throw new Error('Invalid CSRF token')
 * }
 * ```
 */
function validateCSRFToken(token: string, secret: string): boolean {
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
 * CSRF protection middleware for state-changing operations.
 *
 * Validates that a CSRF token is present and valid. This function should be
 * called in POST, PATCH, DELETE, and other mutation endpoints to prevent
 * cross-site request forgery attacks.
 *
 * In production, throws an error if CSRF_SECRET is not configured.
 * In development, logs a warning and allows the request to proceed.
 *
 * @param token - CSRF token from the request (typically from X-CSRF-Token header)
 * @throws {Error} If token is missing or invalid, or if CSRF_SECRET is not configured in production
 *
 * @example
 * ```typescript
 * const token = getCSRFTokenFromRequest(request)
 * requireCSRFToken(token) // Throws if invalid
 * // Proceed with mutation
 * ```
 */
export function requireCSRFToken(token: string | null): void {
  const secret = process.env.CSRF_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'CSRF_SECRET is required in production. CSRF protection cannot be disabled.',
      )
    }
    logger.warn(
      { service: 'csrf' },
      'CSRF_SECRET not configured - CSRF protection disabled (development only)',
    )
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
 *
 * Checks both 'X-CSRF-Token' and 'x-csrf-token' headers (case-insensitive).
 * Returns null if no CSRF token header is present.
 *
 * @param request - The incoming HTTP request object
 * @returns CSRF token string if found in headers, null otherwise
 *
 * @example
 * ```typescript
 * const token = getCSRFTokenFromRequest(request)
 * if (!token) {
 *   throw new Error('CSRF token missing')
 * }
 * requireCSRFToken(token)
 * ```
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  return (
    request.headers.get('X-CSRF-Token') ||
    request.headers.get('x-csrf-token') ||
    null
  )
}
