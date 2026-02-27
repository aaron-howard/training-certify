/**
 * Integration tests for /api/team-requirements
 * Tests team requirement management endpoints
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
// import { factories } from '../../test/factories' // Unused for now
import {
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
vi.mock('../../lib/csrf.server', () => ({
  requireCSRFToken: vi.fn(),
  getCSRFTokenFromRequest: vi.fn(() => 'test-token'),
}))

describe('/api/team-requirements Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/team-requirements', () => {
    it('should return team requirements for valid teamId', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      const mockRequirements = [
        {
          id: 'req1',
          teamId: 'team123',
          certificationId: 'cert-azure-104',
          targetCount: 5,
          certificationName: 'Azure Administrator',
        },
        {
          id: 'req2',
          teamId: 'team123',
          certificationId: 'cert-aws-saa',
          targetCount: 3,
          certificationName: 'AWS Solutions Architect',
        },
      ]

      await setupTestMocks(user, mockRequirements)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/team-requirements?teamId=team123',
        ),
      } as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('teamId')
      expect(data[0]).toHaveProperty('certificationId')
      expect(data[0]).toHaveProperty('targetCount')
    })

    it('should return 400 for missing teamId parameter', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)

      await setupTestMocks(user, {})

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request('http://localhost/api/team-requirements'),
      } as any)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('teamId')
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { requireRole } = await import('../../lib/auth.server')
      const { UnauthorizedError } = await import('../../lib/errors')

      vi.mocked(requireRole).mockRejectedValue(
        new UnauthorizedError('Unauthorized'),
      )

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.GET

      if (!handler) throw new Error('GET handler not found')

      const response = await handler({
        request: new Request(
          'http://localhost/api/team-requirements?teamId=team123',
        ),
      } as any)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/team-requirements', () => {
    it('should create requirement for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      const newRequirement = {
        id: 'req-new',
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        certificationId: 'cert-azure-104',
        targetCount: 5,
      }

      await setupTestMocks(admin, newRequirement)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: '123e4567-e89b-12d3-a456-426614174000',
          certificationId: 'cert-azure-104',
          targetCount: 5,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
    })

    it('should create requirement when Manager manages the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      const teamId = '123e4567-e89b-12d3-a456-426614174001'
      const newReq = {
        id: 'req-new',
        teamId,
        certificationId: 'cert-azure-104',
        targetCount: 3,
      }
      const mockDb = createMockDbWithSequence([
        [{ managerId: manager.id }],
        [newReq],
      ])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          certificationId: newReq.certificationId,
          targetCount: newReq.targetCount,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(201)
    })

    it('should return 403 when Manager does not manage the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      const mockDb = createMockDbWithSequence([[{ managerId: 'other_id' }]])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.POST
      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: '123e4567-e89b-12d3-a456-426614174002',
          certificationId: 'cert-azure-104',
          targetCount: 5,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 403 for non-Admin/Manager', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const user = await mockAuthForRole('User', auth)
      const { requireRole } = await import('../../lib/auth.server')
      const { ForbiddenError } = await import('../../lib/errors')

      await setupTestMocks(user, {})

      vi.mocked(requireRole).mockRejectedValue(
        new ForbiddenError(
          'Required one of [Admin, Manager] but user has [User]',
        ),
      )

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: '123e4567-e89b-12d3-a456-426614174000',
          certificationId: 'cert-azure-104',
          targetCount: 5,
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)

      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.POST

      if (!handler) throw new Error('POST handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: 'invalid',
        }),
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })
  })

  describe('DELETE /api/team-requirements', () => {
    it('should delete requirement for Admin', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      const mockDb = createMockDbWithSequence([[{ teamId: 'team_1' }], []])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: admin.id,
        role: 'Admin',
      } as any)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/team-requirements?id=req_1',
        { method: 'DELETE' },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
    })

    it('should delete requirement when Manager manages the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      const mockDb = createMockDbWithSequence([
        [{ teamId: 'team_1' }],
        [{ managerId: manager.id }],
        [],
      ])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/team-requirements?id=req_1',
        { method: 'DELETE' },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(200)
    })

    it('should return 400 when id is missing', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, {})

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request('http://localhost/api/team-requirements', {
        method: 'DELETE',
      })

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })

    it('should return 400 when requirement not found', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const admin = await mockAuthForRole('Admin', auth)
      await setupTestMocks(admin, [])

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/team-requirements?id=req_nonexistent',
        { method: 'DELETE' },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.code).toBe('VALIDATION_FAILED')
    })

    it('should return 403 when Manager does not manage the team', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const manager = await mockAuthForRole('Manager', auth)
      const mockDb = createMockDbWithSequence([
        [{ teamId: 'team_1' }],
        [{ managerId: 'other_admin_id' }],
      ])
      const { getDbOrThrow } = await import('../../db/db.server')
      vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)
      const { requireRole } = await import('../../lib/auth.server')
      vi.mocked(requireRole).mockResolvedValue({
        userId: manager.id,
        role: 'Manager',
      } as any)

      const { Route } = await import('../../routes/api.team-requirements')
      const handler = (Route.options.server?.handlers as any)?.DELETE
      if (!handler) throw new Error('DELETE handler not found')

      const request = new Request(
        'http://localhost/api/team-requirements?id=req_1',
        { method: 'DELETE' },
      )

      const response = await handler({ request } as any)
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.code).toBe('FORBIDDEN')
    })
  })
})
