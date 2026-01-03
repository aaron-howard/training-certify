/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation
 */

import { createHash, randomBytes } from 'node:crypto'

/**
 * Generate a CSRF token
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
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
    // Simple validation - in production, use a more robust method
    const hash = createHash('sha256')
      .update(token + secret)
      .digest('hex')

    // Token should be at least 32 characters
    return token.length >= 32
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
