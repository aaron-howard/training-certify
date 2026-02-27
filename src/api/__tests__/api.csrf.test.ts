/**
 * Integration tests for /api/csrf
 * Tests CSRF token endpoint (no auth required; rate limited)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/rateLimit.server', () => ({
  requireRateLimit: vi.fn(),
}))

describe('/api/csrf Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/csrf', () => {
    it('should return a CSRF token', async () => {
      const { Route } = await import('../../routes/api.csrf')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/csrf'),
      } as any)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('token')
      expect(typeof body.token).toBe('string')
      expect(body.token.length).toBeGreaterThan(0)
    })

    it('should return token with client identifier from headers', async () => {
      const { requireRateLimit } = await import('../../lib/rateLimit.server')
      const { Route } = await import('../../routes/api.csrf')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/csrf', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        }),
      } as any)

      expect(response.status).toBe(200)
      expect(requireRateLimit).toHaveBeenCalledWith(
        'csrf:192.168.1.1',
        expect.objectContaining({ windowMs: 60000, maxRequests: 30 }),
      )
    })

    it('should handle rate limit errors', async () => {
      const { requireRateLimit } = await import('../../lib/rateLimit.server')

      vi.mocked(requireRateLimit).mockRejectedValue(
        new Error(
          'Rate limit exceeded. Remaining: 0. Reset at: 2025-01-01T00:00:00.000Z',
        ),
      )

      const { Route } = await import('../../routes/api.csrf')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/csrf'),
      } as any)

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })
  })
})
