/**
 * Integration tests for /api/users
 * Tests user management endpoints with role-based access control
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { factories } from '../../test/factories'
import { createMockDb, mockAuthForRole } from './helpers'

// Mock dependencies
vi.mock('@clerk/tanstack-react-start/server')
vi.mock('../../db/db.server')
vi.mock('../../lib/rateLimit.server', () => ({
    requireRateLimit: vi.fn(),
    RateLimitPresets: {
        READ: { windowMs: 60000, maxRequests: 100 },
        MUTATION: { windowMs: 60000, maxRequests: 30 },
    },
}))

describe('/api/users Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/users', () => {
        it('should return users for Admin role', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockUsers = [
                factories.admin(),
                factories.user(),
                factories.manager(),
            ]

            const mockDb = createMockDb(mockUsers)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            // Import and call the route handler
            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/users') } as any)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(Array.isArray(data)).toBe(true)
            expect(data.length).toBe(3)
        })

        it('should return users for Auditor role', async () => {
            const auditor = mockAuthForRole('Auditor')
            const { getDb } = await import('../../db/db.server')

            const mockUsers = [factories.user()]
            const mockDb = createMockDb(mockUsers)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/users') } as any)

            expect(response.status).toBe(200)
        })

        it('should return 403 for regular User role', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(user)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/users') } as any)

            expect(response.status).toBe(403)
            const data = await response.json()
            expect(data.error).toContain('Forbidden')
        })

        it('should apply rate limiting', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')
            const { requireRateLimit } = await import('../../lib/rateLimit.server')

            const mockDb = createMockDb([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            await handler({ request: new Request('http://localhost/api/users') } as any)

            expect(requireRateLimit).toHaveBeenCalled()
        })
    })

    describe('POST /api/users', () => {
        it('should create user without authentication (signup)', async () => {
            const { auth } = await import('@clerk/tanstack-react-start/server')
            const { getDb } = await import('../../db/db.server')

            // No auth for signup
            vi.mocked(auth).mockResolvedValue({ userId: null })

            const newUser = factories.user()
            const mockDb = createMockDb(newUser)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.POST

            if (!handler) throw new Error('POST handler not found')

            const request = new Request('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should handle duplicate email gracefully', async () => {
            const { auth } = await import('@clerk/tanstack-react-start/server')
            const { getDb } = await import('../../db/db.server')

            vi.mocked(auth).mockResolvedValue({ userId: null })

            const existingUser = factories.user()
            const mockDb = createMockDb(existingUser)
            // Mock that user already exists
            mockDb.limit.mockResolvedValue([existingUser])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.POST

            if (!handler) throw new Error('POST handler not found')

            const request = new Request('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    id: 'new_id',
                    name: 'New User',
                    email: existingUser.email,
                }),
            })

            const response = await handler({ request } as any)

            // Should handle gracefully (either 200 or 409)
            expect([200, 409]).toContain(response.status)
        })
    })

    describe('PATCH /api/users', () => {
        it('should update user role for Admin', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const targetUser = factories.user()
            const mockDb = createMockDb(targetUser)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/users?userId=' + targetUser.id, {
                method: 'PATCH',
                body: JSON.stringify({ role: 'Manager' }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should return 403 for non-Admin', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(user)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/users?userId=other_user', {
                method: 'PATCH',
                body: JSON.stringify({ role: 'Admin' }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(403)
        })

        it('should validate role enum', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(admin)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../../routes/api.users')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/users?userId=user123', {
                method: 'PATCH',
                body: JSON.stringify({ role: 'InvalidRole' }),
            })

            const response = await handler({ request } as any)

            // Should reject invalid role (400 or 500)
            expect([400, 500]).toContain(response.status)
        })
    })

    describe('DELETE /api/users', () => {
        it('should delete user for Admin', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb({})
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.users')
            const handler = Route.options.server?.handlers?.DELETE

            if (!handler) throw new Error('DELETE handler not found')

            const request = new Request('http://localhost/api/users?userId=user_to_delete')

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should return 403 for non-Admin', async () => {
            const manager = mockAuthForRole('Manager')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(manager)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.users')
            const handler = Route.options.server?.handlers?.DELETE

            if (!handler) throw new Error('DELETE handler not found')

            const request = new Request('http://localhost/api/users?userId=user_to_delete')

            const response = await handler({ request } as any)

            expect(response.status).toBe(403)
        })
    })

    describe('Error Handling', () => {
        it('should handle database unavailable', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            vi.mocked(getDb).mockResolvedValue(null)

            const { Route } = await import('../api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/users') } as any)

            expect(response.status).toBe(500)
            const data = await response.json()
            expect(data.error).toContain('Database')
        })

        it('should handle rate limit exceeded', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')
            const { requireRateLimit } = await import('../../lib/rateLimit.server')

            const mockDb = createMockDb([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)
            vi.mocked(requireRateLimit).mockImplementation(() => {
                throw new Error('Rate limit exceeded')
            })

            const { Route } = await import('../api.users')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/users') } as any)

            expect(response.status).toBe(429)
        })
    })
})
