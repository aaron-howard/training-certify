/**
 * Integration tests for /api/team-members
 * Tests team member retrieval endpoints
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
// import { factories } from '../../test/factories' // Unused for now
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

describe('/api/team-members Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/team-members', () => {
    it('should return team members for valid teamId', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockMembers = [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        {
          id: 'user2',
          name: 'Team Member 2',
          email: 'member2@example.com',
          role: 'User',
          avatarUrl: null,
        },
      ]

      await setupTestMocks(user, mockMembers)

      const { Route } = await import('../../routes/api.team-members')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/team-members?teamId=team123',
        ),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('email')
      expect(data[0]).toHaveProperty('role')
    })

    it('should return 400 for missing teamId parameter', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.team-members')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/team-members'),
      } as any)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('teamId')
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.team-members')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/team-members?teamId=team123',
        ),
      } as any)

      expect(response.status).toBe(401)
    })

    it('should return empty array for team with no members', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, [])

      const { Route } = await import('../../routes/api.team-members')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/team-members?teamId=empty-team',
        ),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })
  })
})
