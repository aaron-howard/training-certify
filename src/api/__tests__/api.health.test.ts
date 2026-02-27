/**
 * Integration tests for /api/health
 * Tests health check endpoint
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockDb } from './helpers'

// Mock dependencies
vi.mock('../../db/db.server', async () => {
  const actual = await vi.importActual('../../db/db.server')
  return {
    ...actual,
    getDb: vi.fn(),
  }
})
vi.mock('../../lib/rateLimit.server', () => ({
  requireRateLimit: vi.fn(),
}))

describe('/api/health Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      const { getDb } = await import('../../db/db.server')
      const mockDb: any = createMockDb()
      // Mock execute method for health check query (sql template literal)
      mockDb.execute = vi.fn().mockResolvedValue([{ '?column?': 1 }])
      vi.mocked(getDb).mockResolvedValue(mockDb)

      // Set environment variables
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.CLERK_SECRET_KEY = 'test-secret'
      process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-publishable'

      const { Route } = await import('../../routes/api.health')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/health'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('checks')
      expect(data.checks.database.status).toBe('connected')
      expect(data.checks.environment.healthy).toBe(true)
      expect(data).toHaveProperty('metrics')
      expect(data.metrics).toMatchObject({
        uptime_seconds: expect.any(Number),
        http_requests_total: expect.any(Number),
        http_errors_total: expect.any(Number),
      })
    })

    it('should return unhealthy status when database is disconnected', async () => {
      const { getDb } = await import('../../db/db.server')
      vi.mocked(getDb).mockResolvedValue(null)

      const { Route } = await import('../../routes/api.health')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/health'),
      } as any)

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('unhealthy')
      expect(data.checks.database.status).toBe('disconnected')
    })

    it('should return unhealthy status when environment variables are missing', async () => {
      const { getDb } = await import('../../db/db.server')
      const mockDb = createMockDb()
      mockDb.execute = vi.fn().mockResolvedValue({})
      vi.mocked(getDb).mockResolvedValue(mockDb)

      // Remove environment variables
      delete process.env.DATABASE_URL
      delete process.env.CLERK_SECRET_KEY
      delete process.env.VITE_CLERK_PUBLISHABLE_KEY

      const { Route } = await import('../../routes/api.health')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/health'),
      } as any)

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('unhealthy')
      expect(data.checks.environment.healthy).toBe(false)
    })

    it('should handle database query errors gracefully', async () => {
      const { getDb } = await import('../../db/db.server')
      const mockDb: any = createMockDb()
      mockDb.execute = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'))
      vi.mocked(getDb).mockResolvedValue(mockDb)

      process.env.DATABASE_URL = 'postgresql://test'
      process.env.CLERK_SECRET_KEY = 'test-secret'
      process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test-publishable'

      const { Route } = await import('../../routes/api.health')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/health'),
      } as any)

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('unhealthy')
      expect(data.checks.database.status).toBe('error')
      expect(data.checks.database.error).toBeDefined()
    })
  })
})
