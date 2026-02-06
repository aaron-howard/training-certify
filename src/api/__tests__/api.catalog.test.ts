/**
 * Integration tests for /api/catalog
 * Tests catalog certification management endpoints
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
vi.mock('../../lib/csrf.server', () => ({
  requireCSRFToken: vi.fn(),
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
}))

describe('/api/catalog Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/catalog', () => {
    it('should return certifications for authenticated users', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockCertifications = [
        factories.certification({ id: 'cert1', name: 'Azure Fundamentals' }),
        factories.certification({
          id: 'cert2',
          name: 'AWS Solutions Architect',
        }),
      ]

      await setupTestMocks(user, mockCertifications)

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/catalog'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('certifications')
      expect(Array.isArray(data.certifications)).toBe(true)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/catalog'),
      } as any)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/catalog', () => {
    it('should create certification for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const newCert = factories.certification({
        name: 'New Certification',
        vendorName: 'Microsoft',
      })

      await setupTestMocks(admin, newCert)

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/catalog', {
        method: 'POST',
        body: JSON.stringify({
          id: newCert.id || 'cert-new-123',
          name: 'New Certification',
          vendorName: newCert.vendorName || 'Microsoft',
          category: 'Cloud',
          difficulty: 'Intermediate',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)

      const data = await response.json()
      // Verify the response contains certification data
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name')
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

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/catalog', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Certification',
          vendorName: 'Test Vendor',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/catalog', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          name: '',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/catalog', () => {
    it('should delete certification for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/catalog?id=cert123')

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.deletedId).toBe('cert123')
    })

    it('should return 400 for missing id parameter', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/catalog')

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
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

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/catalog?id=cert123')

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })
  })
})
