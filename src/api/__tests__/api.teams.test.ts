/**
 * Integration tests for /api/teams
 * Tests team management endpoints with caching and rate limiting
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import { mockAuthForRole, setupTestMocks } from './helpers'

// Mock dependencies
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}))
vi.mock('../../db/db.server', async () => {
  const actual = await vi.importActual('../../db/db.server')
  return {
    ...actual,
    getDb: vi.fn(),
    getDbOrThrow: vi.fn(),
  }
})
vi.mock('../../lib/auth.server', async () => {
  const actual = await vi.importActual('../../lib/auth.server')
  return {
    ...actual,
    getAuthenticatedUser: vi.fn(),
    requireRole: vi.fn(),
    getVerifiedAuth: vi.fn(),
  }
})
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

      const mockTeams = [factories.team()]
      await setupTestMocks(user, mockTeams)

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
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

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

      const newTeam = factories.team()
      await setupTestMocks(admin, newTeam)

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
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, user)

      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError('Required one of [Admin] but user has [User]'),
      )

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
