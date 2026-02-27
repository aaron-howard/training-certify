/**
 * Integration tests for /api/teams
 * Tests team management endpoints with caching and rate limiting
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import {
  createMockDbWithSequence,
  mockAuthForRole,
  setupTestMocks,
} from './helpers'

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
  getOrCompute: vi.fn(
    (_key: string, _ttl: number, compute: () => Promise<any>) => compute(),
  ),
  cache: {
    invalidate: vi.fn(),
  },
  CacheTTL: {
    MEDIUM: 300000,
  },
}))
vi.mock('../../lib/csrf.server', () => ({
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
  requireCSRFToken: vi.fn(),
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
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('pagination')
      expect(body).toHaveProperty('metrics')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(1)
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

    it('should return empty data and metrics when no teams exist', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, []) // empty teams list

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/teams'),
      } as any)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('metrics')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(0)
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

    it('should return 400 for invalid team data (missing name)', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, [])

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No name' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })
  })

  describe('DELETE /api/teams', () => {
    it('should delete team for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/teams?id=team_1', {
        method: 'DELETE',
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should return 400 when id is missing', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'DELETE',
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
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
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/teams?id=team_1', {
        method: 'DELETE',
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })
  })

  describe('PATCH /api/teams', () => {
    it('should add member for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          teamId: 'team_1',
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.action).toBe('added')
    })

    it('should remove member for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          teamId: 'team_1',
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.action).toBe('removed')
    })

    it('should add member when Manager manages the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      const teamId = 'team_managed'
      // PATCH as Manager: first select team to check managerId, then insert
      const mockDb = createMockDbWithSequence([[{ managerId: manager.id }], []])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          teamId,
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.action).toBe('added')
    })

    it('should return 403 when Manager does not manage the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      // Team has different managerId
      const mockDb = createMockDbWithSequence([
        [{ managerId: 'other_admin_id' }],
      ])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          teamId: 'team_other',
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 403 for User role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, user)
      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError(
          'Required one of [Admin, Manager] but user has [User]',
        ),
      )

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          teamId: 'team_1',
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })

    it('should return 400 when teamId or userId is missing', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })

    it('should return 400 for invalid action', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.teams')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invalid',
          teamId: 'team_1',
          userId: 'user_1',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })
  })
})
