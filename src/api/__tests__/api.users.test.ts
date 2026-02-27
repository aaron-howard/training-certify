/**
 * Integration tests for /api/users
 * Tests user management endpoints with role-based access control
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import {
  REJECT,
  createMockDb,
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
vi.mock('../../lib/csrf.server', () => ({
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
  requireCSRFToken: vi.fn(),
}))
vi.mock('../../lib/cache.server', async (importOriginal) => {
  const actual = await (
    importOriginal as () => Promise<Record<string, unknown>>
  )()
  return {
    ...actual,
    invalidateCache: vi.fn(),
  }
})

describe('/api/users Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('should return users for Admin role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockUsers = [
        factories.admin({ id: admin.id }),
        factories.user({ id: 'user2' }),
        factories.user({ id: 'user3' }),
      ]
      // GET /api/users runs count() then select(); use dbSequence so pagination total is correct
      await setupTestMocks(admin, mockUsers, {
        dbSequence: [[{ count: 3 }], mockUsers],
      })

      // Import and call the route handler
      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toHaveProperty('data')
      expect(body).toHaveProperty('pagination')
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(3)
      expect(body.pagination.total).toBe(3)
    })

    it('should return users for Auditor role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const auditor = await mockAuthForRole('Auditor', auth)

      const mockUsers = [factories.user({ role: 'Auditor', id: auditor.id })]
      await setupTestMocks(auditor, mockUsers, {
        dbSequence: [[{ count: 1 }], mockUsers],
      })

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
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, user)

      // Mock requireRole to throw ForbiddenError for User role
      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError(
          'Required one of [Admin, Auditor, Executive] but user has [User]',
        ),
      )

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.code).toBe('FORBIDDEN')
    })
  })

  describe('POST /api/users', () => {
    it('should fail creation without authentication (signup unprotected)', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      // Mock getVerifiedAuth to throw UnauthorizedError
      vi.mocked(getVerifiedAuth).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )
      // Must also mock getDb even if it shouldn't be reached
      vi.mocked(getDbOrThrow).mockResolvedValue(createMockDb())

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

    it('should return 201 when user ensures own record (new user)', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')

      const newUser = factories.user({
        id: 'user_new',
        name: 'New User',
        email: 'new@example.com',
      })
      vi.mocked(getVerifiedAuth).mockResolvedValue(newUser.id)

      // Sequence: requesterRecord select -> [{ role: 'User' }]; existing select -> []; insert.returning() -> [newUser]
      const mockDb = createMockDbWithSequence([
        [{ role: 'User' }],
        [],
        [newUser],
      ])
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(newUser.id)
      expect(body.name).toBe(newUser.name)
    })

    it('should return 200 when user already exists (ensure self)', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')

      const existingUser = factories.user({ id: 'user_existing' })
      vi.mocked(getVerifiedAuth).mockResolvedValue(existingUser.id)
      vi.mocked(getDbOrThrow).mockResolvedValue(createMockDb([existingUser]))

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.id).toBe(existingUser.id)
    })

    it('should migrate on duplicate email (23505) and return 201', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')

      const oldUserId = 'user_old'
      const newUserId = 'user_new'
      const email = 'same@example.com'
      const existingUser = factories.user({
        id: oldUserId,
        name: 'Old Name',
        email,
        role: 'User',
      })
      const newUser = factories.user({
        id: newUserId,
        name: 'New Name',
        email,
        role: 'User',
      })
      vi.mocked(getVerifiedAuth).mockResolvedValue(newUserId)
      // requester, existing by id, insert throws 23505, select by email, then transaction (7 ops), select by id
      const mockDb = createMockDbWithSequence([
        [{ role: 'User' }],
        [],
        REJECT({
          code: '23505',
          detail:
            'duplicate key value violates unique constraint "users_email_key" (email)',
        }),
        [existingUser],
        [],
        [],
        [],
        [],
        [],
        [],
        [], // transaction: update users, insert, update x4, delete
        [newUser],
      ])
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.id).toBe(newUser.id)
      expect(body.email).toBe(email)
    })

    it('should strip non-User role when non-admin ensures own record', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')

      const newUser = factories.user({
        id: 'user_self',
        name: 'Self User',
        email: 'self@example.com',
        role: 'User',
      })
      vi.mocked(getVerifiedAuth).mockResolvedValue(newUser.id)
      // requesterRecord -> User; existing -> []; insert returns [newUser] (role forced to User)
      const mockDb = createMockDbWithSequence([
        [{ role: 'User' }],
        [],
        [newUser],
      ])
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: 'Manager',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
      const body = await response.json()
      expect(body.role).toBe('User')
    })

    it('should return 403 when non-admin ensures another user', async () => {
      const { getDbOrThrow } = await import('../../db/db.server')
      const { getVerifiedAuth } = await import('../../lib/auth.server')

      vi.mocked(getVerifiedAuth).mockResolvedValue('user_requester')
      // Requester select returns User role -> not allowed to ensure other user
      const mockDb = createMockDbWithSequence([[{ role: 'User' }]])
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'user_other',
          name: 'Other User',
          email: 'other@example.com',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')
    })
  })

  describe('PATCH /api/users', () => {
    it('should update user role for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const targetUser = factories.user({ id: 'user_target' })
      await setupTestMocks(admin, targetUser)

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
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, user)

      // Mock requireRole to throw ForbiddenError
      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError('Required one of [Admin] but user has [User]'),
      )

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

    it('should return 400 for invalid update data (missing id)', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, factories.user())

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Manager' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })

    it('should return 404 when user not found', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      // update().returning() resolves to [] so result.length === 0 -> NotFoundError
      await setupTestMocks(admin, [])

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.PATCH
      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'user_nonexistent', role: 'Manager' }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.code).toBe('NOT_FOUND')
    })
  })

  describe('DELETE /api/users', () => {
    it('should delete user for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/users?id=user_to_delete',
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
    })

    it('should return 400 when id is missing', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/users')

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

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/users?id=user_other')

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')
    })
  })

  describe('Error Handling', () => {
    it('should handle database unavailable', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, [])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockRejectedValue(
        new Error('Database unavailable'),
      )

      const { Route } = await import('../../routes/api.users')
      const handler = (Route.options.server?.handlers as any)?.GET

      const response = await handler({
        request: new Request('http://localhost/api/users'),
      } as any)

      expect(response.status).toBe(500)
    })
  })
})
