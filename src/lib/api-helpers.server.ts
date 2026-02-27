/**
 * Common utilities for API route handlers
 * Extracts duplicate patterns for error handling, authentication, and validation
 */

import { randomBytes } from 'node:crypto'
import { json } from '@tanstack/react-start'
import { logError } from './logging.server'
import { AppError, ValidationError } from './errors'
import { requireRole } from './auth.server'
import { RateLimitPresets, requireRateLimit } from './rateLimit.server'
import { getCSRFTokenFromRequest, requireCSRFToken } from './csrf.server'
import { trackRequestMetrics } from './monitoring.server'
import type { AuthSession } from './auth.server'
// Request is a global type in modern environments

/**
 * Sanitize error message for client consumption.
 * In production, removes sensitive details like stack traces, file paths, etc.
 */
function sanitizeErrorMessage(message: string, isProduction: boolean): string {
  if (!isProduction) {
    return message
  }

  // Remove file paths
  let sanitized = message.replace(/\/[^\s]+/g, '[path]')

  // Remove stack trace indicators
  sanitized = sanitized.replace(/at\s+.*/g, '')

  // Remove sensitive patterns (database connection strings, etc.)
  sanitized = sanitized.replace(/postgresql:\/\/[^\s]+/g, '[database]')
  sanitized = sanitized.replace(/mongodb:\/\/[^\s]+/g, '[database]')

  // Remove common sensitive info
  sanitized = sanitized.replace(/password[=:]\S+/gi, 'password=[redacted]')
  sanitized = sanitized.replace(/secret[=:]\S+/gi, 'secret=[redacted]')
  sanitized = sanitized.replace(/key[=:]\S+/gi, 'key=[redacted]')

  return sanitized.trim() || 'An error occurred'
}

/**
 * Standard error handler for API routes.
 * Returns appropriate JSON response based on error type.
 *
 * @param error - The error that occurred (can be AppError or unknown)
 * @param context - Context string for logging (e.g., 'API Users GET')
 * @returns JSON response with appropriate status code
 */
export function handleApiError(error: unknown, context: string): Response {
  const isProduction = process.env.NODE_ENV === 'production'

  if (error instanceof AppError) {
    const sanitizedMessage = sanitizeErrorMessage(error.message, isProduction)
    return json(
      {
        error: sanitizedMessage,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.errors }),
      },
      { status: error.statusCode },
    )
  }

  const requestId = randomBytes(6).toString('hex')
  logError(error, { context, requestId }, `Unexpected error in ${context}`)
  const err = error instanceof Error ? error : new Error(String(error))
  // Single line with distinctive prefix so you can copy from browser and search in Vercel Logs
  console.error(
    `TRAINING_CERTIFY_500 requestId=${requestId} context=${context} message=${err.message}`,
  )
  console.error(`TRAINING_CERTIFY_500 requestId=${requestId} stack:`, err.stack)
  if (err.cause)
    console.error(
      `TRAINING_CERTIFY_500 requestId=${requestId} cause:`,
      err.cause,
    )

  // Return generic message to client; include requestId so you can search Vercel logs for it
  return json(
    { error: 'Internal server error', requestId },
    { status: 500, headers: { 'X-Request-Id': requestId } },
  )
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
  _context: string,
): Promise<Response> {
  return handler().catch((error) => handleApiError(error, _context))
}

/**
 * Wraps an API handler to record performance metrics (duration, status, request count).
 * Use for all API route handlers so /metrics and health expose consistent data.
 *
 * @param method - HTTP method (e.g. 'GET', 'POST')
 * @param path - Route path (e.g. '/api/users')
 * @param handler - Async function that returns the Response
 * @returns Promise that resolves to the same Response
 */
export async function withApiMetrics(
  method: string,
  path: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const start = Date.now()
  try {
    const response = await handler()
    const duration = Date.now() - start
    trackRequestMetrics(method, path, response.status, duration)
    return response
  } catch (error) {
    const duration = Date.now() - start
    trackRequestMetrics(method, path, 500, duration)
    throw error
  }
}

/**
 * Runs an async function and records its duration as a database query metric.
 * Use around key DB operations to populate db_query_duration_ms histograms.
 *
 * @param operation - Label for the operation (e.g. 'users_list', 'teams_with_metrics')
 * @param fn - Async function that performs the DB work
 * @returns Result of fn()
 */
export async function withDbTiming<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const { recordDbQueryDuration } = await import('./monitoring.server')
  const start = Date.now()
  try {
    const result = await fn()
    recordDbQueryDuration(operation, Date.now() - start)
    return result
  } catch (error) {
    recordDbQueryDuration(operation, Date.now() - start)
    throw error
  }
}

/**
 * Common setup for authenticated API handlers
 * Handles role checking, rate limiting, and CSRF protection
 */
export interface ApiHandlerOptions {
  allowedRoles?: Array<string>
  rateLimit?: (typeof RateLimitPresets)[keyof typeof RateLimitPresets]
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
  options: ApiHandlerOptions = {},
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
  options: Omit<ApiHandlerOptions, 'requireCSRF'> & {
    requireCSRF?: boolean
  } = {},
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
  options: ApiHandlerOptions = {},
): Promise<AuthSession> {
  return setupApiHandler(request, {
    ...options,
    rateLimit: options.rateLimit || RateLimitPresets.READ,
  })
}
