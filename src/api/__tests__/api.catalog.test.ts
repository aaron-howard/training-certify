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
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBe(true)
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

    it('GET ?format=csv should return 200 and CSV body for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const catalogRows = [
        {
          id: 'cert1',
          name: 'Azure Fundamentals',
          vendorName: 'Microsoft',
          level: 'Beginner',
          price: null,
          category: 'Cloud',
          description: null,
          officialSiteUrl: 'https://example.com/azure',
        },
      ]
      await setupTestMocks(admin, catalogRows, {
        dbSequence: [[{ count: 1 }], catalogRows],
      })

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.GET
      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/catalog?format=csv'),
      } as any)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/csv')
      const text = await response.text()
      expect(text).toContain(
        'id,name,vendor,level,category,price,description,officialSiteUrl',
      )
      expect(text).toContain('cert1')
      expect(text).toContain('Azure Fundamentals')
      expect(text).toContain('https://example.com/azure')
    })

    it('GET ?format=csv should return 403 for non-Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, [])

      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError('Required one of [Admin] but user has [User]'),
      )

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.GET
      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/catalog?format=csv'),
      } as any)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/catalog', () => {
    it('should create certification for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      // Catalog POST returns the inserted certification row (id, name, vendorId, ...)
      const insertedRow = {
        id: 'cert-new-123',
        name: 'New Certification',
        vendorId: 'microsoft',
        category: 'Cloud',
        difficulty: 'Intermediate',
        createdAt: new Date(),
      }
      await setupTestMocks(admin, insertedRow)

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/catalog', {
        method: 'POST',
        body: JSON.stringify({
          id: insertedRow.id,
          name: insertedRow.name,
          vendorId: insertedRow.vendorId,
          vendorName: 'Microsoft',
          category: 'Cloud',
          difficulty: 'Intermediate',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)

      const data = await response.json()
      // Verify the response contains certification data (insert returns row with id, name, vendorId, etc.)
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name')
      expect(data).toHaveProperty('vendorId')
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
          id: 'test-cert-1',
          name: 'Test Certification',
          vendorId: 'test-vendor',
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

    it('POST ?action=import with valid CSV returns updated/skipped', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const updatedRow = {
        id: 'cert1',
        name: 'Updated Name',
        vendorId: 'microsoft',
        category: 'Cloud',
        difficulty: 'Intermediate',
      }
      await setupTestMocks(admin, [updatedRow])

      const csv = `id,name,vendor,level,category,officialSiteUrl
cert1,Updated Name,Microsoft,Professional,Cloud,https://example.com/cert`

      const request = new Request(
        'http://localhost/api/catalog?action=import',
        {
          method: 'POST',
          body: csv,
          headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        },
      )

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.updated).toBe(1)
      expect(data.skipped).toBe(0)
    })

    it('POST ?action=import skips rows with missing id', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      // Mock must return a row for update().returning() so cert1 is "updated"
      const updatedRow = { id: 'cert1', name: 'Has Id', vendorId: 'vendor' }
      await setupTestMocks(admin, [updatedRow])

      const csv = `id,name,vendor
,No Id Row,Vendor
cert1,Has Id,Vendor`

      const request = new Request(
        'http://localhost/api/catalog?action=import',
        {
          method: 'POST',
          body: csv,
          headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        },
      )

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.updated).toBe(1)
      expect(data.skipped).toBe(1)
    })

    it('POST ?action=import returns 400 when CSV has no id column', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, [])

      const csv = `name,vendor
Cert A,Vendor A`

      const request = new Request(
        'http://localhost/api/catalog?action=import',
        {
          method: 'POST',
          body: csv,
          headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        },
      )

      const { Route } = await import('../../routes/api.catalog')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('id')
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
