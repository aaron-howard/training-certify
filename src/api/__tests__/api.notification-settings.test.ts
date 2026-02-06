/**
 * Integration tests for /api/notification-settings
 * Tests notification settings management endpoints
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
vi.mock('../../lib/csrf.server', () => ({
  requireCSRFToken: vi.fn(),
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
}))

describe('/api/notification-settings Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/notification-settings', () => {
    it('should return notification categories and preferences', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notification-settings'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('categories')
      expect(data).toHaveProperty('userPreferences')
      expect(Array.isArray(data.categories)).toBe(true)
      expect(data.categories.length).toBeGreaterThan(0)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notification-settings'),
      } as any)

      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/notification-settings', () => {
    it('should update user preferences', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            preferences: {
              'expiration-alert': false,
              emailEnabled: true,
            },
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('preferences')
    })

    it("should return 403 when trying to update another user's preferences", async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            userId: 'other-user-id',
            preferences: {
              'expiration-alert': false,
            },
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid preference data', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'PATCH',
          body: JSON.stringify({
            preferences: 'invalid',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/notification-settings', () => {
    it('should mark notification as read', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'markRead',
            notificationId: '123e4567-e89b-12d3-a456-426614174000',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should mark all notifications as read', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'markAllRead',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should dismiss notification', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'dismiss',
            notificationId: '123e4567-e89b-12d3-a456-426614174000',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it("should return 403 when trying to mark another user's notifications as read", async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'markAllRead',
            userId: 'other-user-id',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid action', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.notification-settings')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request(
        'http://localhost/api/notification-settings',
        {
          method: 'POST',
          body: JSON.stringify({
            action: 'invalidAction',
          }),
        },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
    })
  })
})
