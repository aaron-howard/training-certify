/**
 * Integration tests for /api/users
 * Tests user management endpoints with role-based access control
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

describe('/api/users Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('should return users for Admin role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const { getDb } = await import('../../db/db.server')

      const mockUsers = [
        factories.admin({ id: admin.id }),
        factories.user({ id: 'user2' }),
        factories.user({ id: 'user3' }),
      ]

      const mockDb = setupAuthAndDataMock(admin, mockUsers)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      // Import and call the route handler
      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(3)
    })

    it('should return users for Auditor role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const auditor = await mockAuthForRole('Auditor', auth)
      const { getDb } = await import('../../db/db.server')

      const mockUsers = [factories.user({ role: 'Auditor', id: auditor.id })]
      const mockDb = setupAuthAndDataMock(auditor, mockUsers)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)

      expect(response.status).toBe(200)
    })

    it('should return 403 for regular User role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { getDb } = await import('../../db/db.server')

      const mockDb = setupAuthAndDataMock(user, user)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Forbidden')
    })
  })

  describe('POST /api/users', () => {
    it('should fail creation without authentication (signup unprotected)', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: null } as any)
      // Must also mock getDb even if it shouldn't be reached
      vi.mocked(getDb).mockResolvedValue(createMockDb())

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify({
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/users', () => {
    it('should update user role for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const { getDb } = await import('../../db/db.server')

      const targetUser = factories.user({ id: 'user_target' })
      const mockDb = setupAuthAndDataMock(admin, targetUser)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: targetUser.id, role: 'Manager' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
    })

    it('should return 403 for non-Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { getDb } = await import('../../db/db.server')

      const mockDb = setupAuthAndDataMock(user, user)
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'other_user', role: 'Admin' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/users', () => {
    it('should delete user for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const { getDb } = await import('../../db/db.server')

      const mockDb = setupAuthAndDataMock(admin, {})
      vi.mocked(getDb).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/users?id=user_to_delete',
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database unavailable', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      await mockAuthForRole('Admin', auth)
      const { getDb } = await import('../../db/db.server')

      vi.mocked(getDb).mockResolvedValue(null)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)

      expect(response.status).toBe(500)
    })
  })
})
