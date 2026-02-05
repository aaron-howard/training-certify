/**
 * Integration tests for /api/teams
 * Tests team management endpoints with caching and rate limiting
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import { createMockDb, mockAuthForRole, setupAuthAndDataMock } from './helpers'

// Mock dependencies
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}))
vi.mock('../../db/db.server')
vi.mock('../../lib/rateLimit.server', () => ({
  requireRateLimit: vi.fn(),
  RateLimitPresets: {
    READ: { windowMs: 60000, maxRequests: 100 },
    MUTATION: { windowMs: 60000, maxRequests: 30 },
    AUTH: { windowMs: 60000, maxRequests: 5 },
    ADMIN: { windowMs: 60000, maxRequests: 50 },
  },
}))
vi.mock('../../lib/cache.server', () => ({
  getOrCompute: vi.fn((_key, _ttl, compute) => compute()),
  cache: {
    invalidate: vi.fn(),
  },
  CacheTTL: {
    MEDIUM: 300000,
  },
}))

describe('/api/teams Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/teams', () => {
    it('should return teams with metrics for all roles', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { getDb } = await import('../../db/db.server')

      const mockTeams = [factories.team()]
      const mockDb = setupAuthAndDataMock(user, mockTeams)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/teams'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('teams')
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: null } as any)
      vi.mocked(getDb).mockResolvedValue(createMockDb())

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.GET

      const response = await handler({
        request: new Request('http://localhost/api/teams'),
      } as any)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/teams', () => {
    it('should create team for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const { getDb } = await import('../../db/db.server')

      const newTeam = factories.team()
      const mockDb = setupAuthAndDataMock(admin, newTeam)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
    })

    it('should return 403 for non-Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { getDb } = await import('../../db/db.server')

      const mockDb = setupAuthAndDataMock(user, user)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.POST

      const request = new Request('http://localhost/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Team' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })
  })
})
