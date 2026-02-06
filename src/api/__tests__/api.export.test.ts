/**
 * Integration tests for /api/export
 * Tests export functionality with batching
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
vi.mock('../../lib/api-helpers.server', () => ({
  setupReadHandler: vi.fn(async (_request, options) => {
    // Mock the auth check
    const { requireRole } = await import('../../lib/auth.server')
    const session = await requireRole(options.allowedRoles)
    return session
  }),
}))
vi.mock('../../lib/rateLimit.server', () => ({
  requireRateLimit: vi.fn(),
  RateLimitPresets: {
    READ: { windowMs: 60000, maxRequests: 100 },
    MUTATION: { windowMs: 60000, maxRequests: 30 },
    AUTH: { windowMs: 60000, maxRequests: 5 },
    ADMIN: { windowMs: 60000, maxRequests: 50 },
    EXPORT: { windowMs: 60000, maxRequests: 10 },
  },
}))

describe('/api/export Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/export', () => {
    it('should export teams data for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockTeams = [factories.team()]
      const mockMembers = [
        {
          teamId: mockTeams[0].id,
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      ]
      const mockRequirements: Array<{
        id: string
        teamId: string
        certificationId: string
        targetCount: number
        createdAt: Date
      }> = []

      await setupTestMocks(admin, [mockTeams, mockMembers, mockRequirements])

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export?type=teams'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('reportType')
      expect(data).toHaveProperty('generatedAt')
      expect(data).toHaveProperty('teams')
      expect(data.reportType).toBe('Detailed Team Compliance Report')
    })

    it('should export certifications data', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockCertifications = [factories.certification({ userId: admin.id })]

      await setupTestMocks(admin, mockCertifications)

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export?type=certifications'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('reportType')
      expect(data).toHaveProperty('certifications')
      expect(data.reportType).toBe('Certification Status Report')
    })

    it('should export compliance data', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockUsers = [admin]
      const mockCertCounts = [{ userId: admin.id, count: 2 }]

      await setupTestMocks(admin, [mockUsers, mockCertCounts])

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export?type=compliance'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('reportType')
      expect(data).toHaveProperty('users')
      expect(data.reportType).toBe('Compliance Overview Report')
    })

    it('should default to teams export when type not specified', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockTeams = [factories.team()]
      await setupTestMocks(admin, [mockTeams, [], []])

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.reportType).toBe('Detailed Team Compliance Report')
    })

    it('should return 403 for User role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, {})

      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError(
          'Required one of [Admin, Manager, Auditor, Executive] but user has [User]',
        ),
      )

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export?type=teams'),
      } as any)

      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.export')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/export?type=teams'),
      } as any)

      expect(response.status).toBe(401)
    })
  })
})
