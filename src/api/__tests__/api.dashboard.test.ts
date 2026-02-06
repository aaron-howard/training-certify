/**
 * Integration tests for /api/dashboard
 * Tests dashboard statistics endpoints
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

describe('/api/dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/dashboard', () => {
    it('should return user dashboard for regular User', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockData = {
        users: [user],
        certifications: [factories.certification({ userId: user.id })],
        teams: [],
        requirements: [],
      }

      await setupTestMocks(user, mockData)

      const { Route } = await import('../../routes/api.dashboard')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/dashboard'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      // User dashboard returns stats directly
      expect(data).toHaveProperty('activeCerts')
      expect(data).toHaveProperty('expiringSoon')
      expect(data).toHaveProperty('complianceRate')
    })

    it('should return executive dashboard for Executive role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const executive = await mockAuthForRole('Executive', auth)

      const mockData = {
        users: [executive, factories.user()],
        certifications: [factories.certification({ userId: executive.id })],
        teams: [factories.team()],
        requirements: [],
      }

      await setupTestMocks(executive, mockData)

      const { Route } = await import('../../routes/api.dashboard')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/dashboard?role=Executive'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      // Executive view returns stats directly
      expect(data).toHaveProperty('totalUsers')
      expect(data).toHaveProperty('totalCerts')
    })

    it('should return 403 for User requesting Executive view', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.dashboard')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/dashboard?role=Executive'),
      } as any)

      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.dashboard')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/dashboard'),
      } as any)

      expect(response.status).toBe(401)
    })
  })
})
