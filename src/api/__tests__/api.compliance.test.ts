/**
 * Integration tests for /api/compliance
 * Tests compliance audit endpoints
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

describe('/api/compliance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/compliance', () => {
    it('should return compliance data for Admin with computed rate', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const mockAuditLogs = [
        factories.auditLog({ action: 'User created', userId: admin.id }),
        factories.auditLog({
          action: 'Certification verified',
          userId: admin.id,
        }),
      ]
      const mockUserCerts = [
        { status: 'active' },
        { status: 'active' },
        { status: 'expired' },
        { status: 'expiring-soon' },
      ]

      await setupTestMocks(admin, mockAuditLogs, {
        dbSequence: [mockAuditLogs, mockUserCerts],
      })

      const { Route } = await import('../../routes/api.compliance')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/compliance'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('auditLogs')
      expect(data).toHaveProperty('stats')
      expect(Array.isArray(data.auditLogs)).toBe(true)
      expect(data.stats).toHaveProperty('complianceRate')
      expect(data.stats.complianceRate).toBe(50) // 2 active / 4 total
      expect(data.stats).toHaveProperty('totalAudits')
      expect(data.stats.totalAudits).toBe(2)
      expect(data.stats).toHaveProperty('issuesFound')
    })

    it('should return 0 compliance rate when there are no certifications', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const mockAuditLogs = [factories.auditLog({ action: 'Audit completed' })]

      await setupTestMocks(admin, mockAuditLogs, {
        dbSequence: [mockAuditLogs, []],
      })

      const { Route } = await import('../../routes/api.compliance')
      const handler = (Route.options.server?.handlers as any)?.GET
      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/compliance'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats.complianceRate).toBe(0)
    })

    it('should return compliance data for Auditor', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const auditor = await mockAuthForRole('Auditor', auth)

      const mockAuditLogs = [factories.auditLog({ action: 'Audit completed' })]

      await setupTestMocks(auditor, mockAuditLogs, {
        dbSequence: [mockAuditLogs, [{ status: 'active' }]],
      })

      const { Route } = await import('../../routes/api.compliance')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/compliance'),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('auditLogs')
      expect(data.stats.complianceRate).toBe(100)
    })

    it('should return 403 for User role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, {})

      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError(
          'Required one of [Admin, Auditor, Executive] but user has [User]',
        ),
      )

      const { Route } = await import('../../routes/api.compliance')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/compliance'),
      } as any)

      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.compliance')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/compliance'),
      } as any)

      expect(response.status).toBe(401)
    })
  })
})

describe('computeComplianceRate', () => {
  it('computes percentage of active certifications', async () => {
    const { computeComplianceRate } =
      await import('../../routes/api.compliance')
    expect(computeComplianceRate([])).toBe(0)
    expect(
      computeComplianceRate([
        { status: 'active' },
        { status: 'expired' },
        { status: 'active' },
      ]),
    ).toBe(67)
    expect(computeComplianceRate([{ status: 'active' }])).toBe(100)
  })
})
