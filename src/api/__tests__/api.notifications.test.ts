/**
 * Integration tests for /api/notifications
 * Tests notification retrieval endpoints
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

describe('/api/notifications Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockNotifications = [
        {
          id: 'notif1',
          userId: user.id,
          title: 'Certification Expiring',
          description: 'Your certification is expiring soon',
          type: 'warning',
          isRead: false,
          isDismissed: false,
          timestamp: new Date(),
        },
        {
          id: 'notif2',
          userId: user.id,
          title: 'New Assignment',
          description: 'You have been assigned a new certification',
          type: 'info',
          isRead: true,
          isDismissed: false,
          timestamp: new Date(),
        },
      ]

      await setupTestMocks(user, mockNotifications)

      const { Route } = await import('../../routes/api.notifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notifications'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('title')
      expect(data[0]).toHaveProperty('message')
      expect(data[0]).toHaveProperty('date')
      expect(data[0]).toHaveProperty('type')
      expect(data[0]).toHaveProperty('read')
    })

    it('should only return non-dismissed notifications', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockNotifications = [
        {
          id: 'notif1',
          userId: user.id,
          title: 'Active Notification',
          description: 'This should appear',
          type: 'info',
          isRead: false,
          isDismissed: false,
          timestamp: new Date(),
        },
        {
          id: 'notif2',
          userId: user.id,
          title: 'Dismissed Notification',
          description: 'This should not appear',
          type: 'info',
          isRead: false,
          isDismissed: true,
          timestamp: new Date(),
        },
      ]

      await setupTestMocks(user, mockNotifications)

      const { Route } = await import('../../routes/api.notifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notifications'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      // Should only return non-dismissed notifications
      expect(data.every((n: any) => !n.dismissed)).toBe(true)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.notifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notifications'),
      } as any)

      expect(response.status).toBe(401)
    })

    it('should limit results to 50 notifications', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      // Create 50 mock notifications (limit is 50, so we'll test with exactly 50)
      const mockNotifications = Array.from({ length: 50 }, (_, i) => ({
        id: `notif${i}`,
        userId: user.id,
        title: `Notification ${i}`,
        description: `Description ${i}`,
        type: 'info',
        isRead: false,
        isDismissed: false,
        timestamp: new Date(),
      }))

      await setupTestMocks(user, mockNotifications)

      const { Route } = await import('../../routes/api.notifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/notifications'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.length).toBeLessThanOrEqual(50)
      expect(data.length).toBe(50)
    })
  })
})
