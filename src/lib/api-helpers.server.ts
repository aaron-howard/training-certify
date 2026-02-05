/**
 * Common utilities for API route handlers
 * Extracts duplicate patterns for error handling, authentication, and validation
 */

import { json } from '@tanstack/react-start'
import { AppError, ValidationError } from './errors'
import { requireRole } from './auth.server'
import { RateLimitPresets, requireRateLimit } from './rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from './csrf.server'
import type { AuthSession } from './auth.server';
// Request is a global type in modern environments

/**
 * Standard error handler for API routes.
 * Returns appropriate JSON response based on error type.
 * 
 * @param error - The error that occurred (can be AppError or unknown)
 * @param context - Context string for logging (e.g., 'API Users GET')
 * @returns JSON response with appropriate status code
 */
export function handleApiError(error: unknown, context: string): Response {
  if (error instanceof AppError) {
    return json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.errors }),
      },
      { status: error.statusCode }
    )
  }

  console.error(`❌ [${context}] Unexpected Error:`, error)
  return json({ error: 'Internal server error' }, { status: 500 })
}

/**
 * Wrapper for API handlers with standard error handling.
 * Catches all errors and converts them to appropriate HTTP responses.
 * 
 * @param handler - Async function that returns the handler result
 * @param context - Context string for error logging
 * @returns Promise that resolves to a Response
 */
export function withErrorHandling<T extends Response>(
  handler: () => Promise<T>,
  _context: string
): Promise<Response> {
  return handler().catch((error) => handleApiError(error, _context))
}

/**
 * Common setup for authenticated API handlers
 * Handles role checking, rate limiting, and CSRF protection
 */
export interface ApiHandlerOptions {
  allowedRoles?: Array<string>
  rateLimit?: typeof RateLimitPresets[keyof typeof RateLimitPresets]
  requireCSRF?: boolean
}

/**
 * Setup authentication, rate limiting, and CSRF protection for an API handler.
 * This is a convenience function that combines common middleware operations.
 * 
 * @param request - The incoming request object
 * @param options - Configuration options:
 *   - allowedRoles: Array of roles allowed to access (default: all roles)
 *   - rateLimit: Rate limit configuration (optional)
 *   - requireCSRF: Whether CSRF token is required (default: false)
 * @returns Authenticated session object
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user doesn't have required role
 * @throws {Error} If rate limit is exceeded or CSRF token is invalid
 */
export async function setupApiHandler(
  request: Request,
  options: ApiHandlerOptions = {}
): Promise<AuthSession> {
  const {
    allowedRoles = ['Admin', 'Manager', 'Auditor', 'Executive', 'User'],
    rateLimit,
    requireCSRF = false,
  } = options

  // Authenticate and check role
  const session = await requireRole(allowedRoles)

  // Apply rate limiting if specified
  if (rateLimit) {
    await requireRateLimit(session.userId, rateLimit)
  }

  // Require CSRF token for mutations
  if (requireCSRF) {
    requireCSRFToken(getCSRFTokenFromRequest(request))
  }

  return session
}

/**
 * Helper for mutation handlers (POST, PATCH, DELETE).
 * Includes CSRF protection and mutation rate limiting by default.
 * 
 * @param request - The incoming request object
 * @param options - Configuration options (CSRF defaults to true, rateLimit defaults to MUTATION)
 * @returns Authenticated session object
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user doesn't have required role
 * @throws {Error} If rate limit is exceeded or CSRF token is invalid
 */
export async function setupMutationHandler(
  request: Request,
  options: Omit<ApiHandlerOptions, 'requireCSRF'> & { requireCSRF?: boolean } = {}
): Promise<AuthSession> {
  return setupApiHandler(request, {
    ...options,
    requireCSRF: options.requireCSRF !== false, // Default to true for mutations
    rateLimit: options.rateLimit || RateLimitPresets.MUTATION,
  })
}

/**
 * Helper for read handlers (GET).
 * Includes read rate limiting by default (more lenient than mutations).
 * 
 * @param request - The incoming request object
 * @param options - Configuration options (rateLimit defaults to READ)
 * @returns Authenticated session object
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {ForbiddenError} If user doesn't have required role
 * @throws {Error} If rate limit is exceeded
 */
export async function setupReadHandler(
  request: Request,
  options: ApiHandlerOptions = {}
): Promise<AuthSession> {
  return setupApiHandler(request, {
    ...options,
    rateLimit: (options as any).rateLimit || RateLimitPresets.READ,
  })
}
