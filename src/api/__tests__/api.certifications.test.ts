/**
 * Integration tests for /api/certifications
 * Tests certification management endpoints with authority checks
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

describe('/api/certifications Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/certifications', () => {
    it('should return certifications for specific user', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockCertifications = [
        factories.certification({ userId: user.id }),
        factories.certification({ userId: user.id }),
      ]

      await setupTestMocks(user, mockCertifications)

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          `http://localhost/api/certifications?userId=${user.id}`,
        ),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return specific certification by id', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const certId = '123e4567-e89b-12d3-a456-426614174000'
      const mockCert = factories.certification({ id: certId, userId: user.id })
      const mockProofs: Array<{
        id: string
        userCertificationId: string
        fileName: string
        fileUrl: string
        uploadedAt: Date
      }> = []

      await setupTestMocks(user, [mockCert, mockProofs])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          `http://localhost/api/certifications?id=${certId}`,
        ),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.id).toBe(certId)
    })

    it('should return 403 for User requesting global list', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/certifications'),
      } as any)

      expect(response.status).toBe(403)
    })

    it('should return global list for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockCertifications = [
        factories.certification({ userId: 'user1' }),
        factories.certification({ userId: 'user2' }),
      ]

      await setupTestMocks(admin, mockCertifications)

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/certifications'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return 404 for non-existent certification', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, [])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/certifications?id=non-existent',
        ),
      } as any)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/certifications', () => {
    it('should create certification for own user', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const catalogCert = factories.certification({ id: 'cert-azure-104' })
      const newUserCert = factories.certification({ userId: user.id })

      await setupTestMocks(user, [catalogCert, newUserCert])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/certifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          certificationId: 'cert-azure-104',
          status: 'active',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
    })

    it('should return 400 for invalid input', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/certifications', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          userId: user.id,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/certifications', () => {
    it('should update certification details', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const certId = '123e4567-e89b-12d3-a456-426614174000'
      const existingCert = factories.certification({
        id: certId,
        userId: user.id,
      })
      const updatedCert = { ...existingCert, status: 'expired' }

      await setupTestMocks(user, [existingCert, updatedCert])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/certifications', {
        method: 'PATCH',
        body: JSON.stringify({
          id: certId,
          action: 'updateDetails',
          updates: {
            status: 'expired',
          },
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should add proof to certification', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const certId = '123e4567-e89b-12d3-a456-426614174000'
      const existingCert = factories.certification({
        id: certId,
        userId: user.id,
      })
      const newProof = {
        id: 'proof-123',
        userCertificationId: certId,
        fileName: 'certificate.pdf',
        fileUrl: 'https://example.com/certificate.pdf',
      }

      await setupTestMocks(user, [existingCert, newProof])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.PATCH

      if (!handler) throw new Error('PATCH handler not found')

      const request = new Request('http://localhost/api/certifications', {
        method: 'PATCH',
        body: JSON.stringify({
          id: certId,
          action: 'addProof',
          proof: {
            fileName: 'certificate.pdf',
            fileUrl: 'https://example.com/certificate.pdf',
          },
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('proof')
    })
  })

  describe('DELETE /api/certifications', () => {
    it('should delete own certification', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const certId = '123e4567-e89b-12d3-a456-426614174000'
      const existingCert = factories.certification({
        id: certId,
        userId: user.id,
      })

      await setupTestMocks(user, existingCert)

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        `http://localhost/api/certifications?id=${certId}`,
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return 404 for non-existent certification', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, [])

      const { Route } = await import('../../routes/api.certifications')
      const handler = (Route.options.server?.handlers as any)?.DELETE

      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/certifications?id=non-existent',
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(404)
    })
  })
})
