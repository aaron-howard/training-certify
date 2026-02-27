/**
 * Unit tests for API helper functions (handleApiError, withErrorHandling)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleApiError, withErrorHandling } from '../api-helpers.server'
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors'

vi.mock('../logging.server', () => ({
  logError: vi.fn(),
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

describe('api-helpers.server.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('returns correct status and body for AppError', async () => {
      const error = new ForbiddenError('Access denied')
      const response = handleApiError(error, 'GET /api/test')
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Access denied')
      expect(body.code).toBe('FORBIDDEN')
    })

    it('returns 401 for UnauthorizedError', async () => {
      const error = new UnauthorizedError('Not logged in')
      const response = handleApiError(error, 'GET /api/test')
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('returns 400 and details for ValidationError', async () => {
      const details = [{ path: ['name'], message: 'Required' }]
      const error = new ValidationError('Validation failed', details)
      const response = handleApiError(error, 'POST /api/test')
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
      expect(body.details).toEqual(details)
    })

    it('returns 404 for NotFoundError', async () => {
      const error = new NotFoundError('User not found')
      const response = handleApiError(error, 'GET /api/users/123')
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('returns 500 for generic Error', async () => {
      const error = new Error('Something broke')
      const response = handleApiError(error, 'GET /api/test')
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
      expect(body.requestId).toBeDefined()
      expect(response.headers.get('X-Request-Id')).toBe(body.requestId)
    })

    it('returns 500 for non-Error thrown value', async () => {
      const response = handleApiError('string error', 'GET /api/test')
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Internal server error')
    })

    it('sanitizes error message in production', async () => {
      const orig = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const error = new AppError('/path/to/file.ts at line 10', 500)
      const response = handleApiError(error, 'GET /api/test')
      const body = await response.json()
      expect(body.error).not.toContain('/path/')
      process.env.NODE_ENV = orig
    })
  })

  describe('withErrorHandling', () => {
    it('returns handler result when handler succeeds', async () => {
      const response = new Response(JSON.stringify({ ok: true }), {
        status: 200,
      })
      const result = await withErrorHandling(
        () => Promise.resolve(response),
        'GET /api/test',
      )
      expect(result).toBe(response)
      expect(result.status).toBe(200)
    })

    it('returns error response when handler throws', async () => {
      const error = new ForbiddenError('Forbidden')
      const result = await withErrorHandling(
        () => Promise.reject(error),
        'GET /api/test',
      )
      expect(result).toBeInstanceOf(Response)
      expect(result.status).toBe(403)
      const body = await result.json()
      expect(body.error).toBe('Forbidden')
    })
  })
})
