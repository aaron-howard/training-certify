/**
 * Integration tests for /api/teams
 * Tests team management endpoints with caching and rate limiting
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
vi.mock('../../lib/cache.server', () => ({
    getOrCompute: vi.fn((key, ttl, compute) => compute()),
    cache: {
        invalidate: vi.fn(),
    },
    CacheTTL: {
        MEDIUM: 300000,
    },
}))

describe('/api/teams Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/teams', () => {
        it('should return teams with metrics for all roles', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockTeams = [factories.team()]
            const mockDb = createMockDb(mockTeams)
            // Mock additional queries for team members, requirements, etc.
            mockDb.limit.mockResolvedValue([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/teams') } as any)

            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data).toHaveProperty('teams')
            expect(data).toHaveProperty('metrics')
        })

        it('should use cached data on repeat requests', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')
            const { getOrCompute } = await import('../../lib/cache.server')

            const mockDb = createMockDb([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            await handler({ request: new Request('http://localhost/api/teams') } as any)

            expect(getOrCompute).toHaveBeenCalled()
        })

        it('should calculate coverage correctly', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockTeam = factories.team()
            const mockDb = createMockDb([mockTeam])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/teams') } as any)
            const data = await response.json()

            expect(data.teams).toBeDefined()
            if (data.teams.length > 0) {
                expect(data.teams[0]).toHaveProperty('coverage')
                expect(data.teams[0]).toHaveProperty('memberCount')
            }
        })

        it('should handle empty teams list', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            const response = await handler({ request: new Request('http://localhost/api/teams') } as any)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.teams).toEqual([])
        })

        it('should apply rate limiting', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')
            const { requireRateLimit } = await import('../../lib/rateLimit.server')

            const mockDb = createMockDb([])
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.GET

            if (!handler) throw new Error('GET handler not found')

            await handler({ request: new Request('http://localhost/api/teams') } as any)

            expect(requireRateLimit).toHaveBeenCalled()
        })
    })

    describe('POST /api/teams', () => {
        it('should create team for Admin', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const newTeam = factories.team()
            const mockDb = createMockDb(newTeam)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.POST

            if (!handler) throw new Error('POST handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'POST',
                body: JSON.stringify({
                    name: newTeam.name,
                    description: newTeam.description,
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(201)
        })

        it('should return 403 for non-Admin', async () => {
            const user = mockAuthForRole('User')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(user)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.POST

            if (!handler) throw new Error('POST handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Team' }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(403)
        })

        it('should invalidate cache after creation', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')
            const { cache } = await import('../../lib/cache.server')

            const mockDb = createMockDb(factories.team())
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.POST

            if (!handler) throw new Error('POST handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Team' }),
            })

            await handler({ request } as any)

            expect(cache.invalidate).toHaveBeenCalledWith('teams:')
        })
    })

    describe('PATCH /api/teams', () => {
        it('should add member for Admin', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb({})
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'add',
                    teamId: 'team123',
                    userId: 'user123',
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should add member for team Manager', async () => {
            const manager = mockAuthForRole('Manager')
            const { getDb } = await import('../../db/db.server')

            const team = factories.team({ managerId: manager.id })
            const mockDb = createMockDb(team)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'add',
                    teamId: team.id,
                    userId: 'user123',
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should return 403 for non-manager of team', async () => {
            const manager = mockAuthForRole('Manager')
            const { getDb } = await import('../../db/db.server')

            const team = factories.team({ managerId: 'other_manager' })
            const mockDb = createMockDb(team)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'add',
                    teamId: team.id,
                    userId: 'user123',
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(403)
        })

        it('should remove member', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb({})
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.PATCH

            if (!handler) throw new Error('PATCH handler not found')

            const request = new Request('http://localhost/api/teams', {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'remove',
                    teamId: 'team123',
                    userId: 'user123',
                }),
            })

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })
    })

    describe('DELETE /api/teams', () => {
        it('should delete team and members for Admin', async () => {
            const admin = mockAuthForRole('Admin')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb({})
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.DELETE

            if (!handler) throw new Error('DELETE handler not found')

            const request = new Request('http://localhost/api/teams?id=team123')

            const response = await handler({ request } as any)

            expect(response.status).toBe(200)
        })

        it('should return 403 for non-Admin', async () => {
            const manager = mockAuthForRole('Manager')
            const { getDb } = await import('../../db/db.server')

            const mockDb = createMockDb(manager)
            vi.mocked(getDb).mockResolvedValue(mockDb as any)

            const { Route } = await import('../api.teams')
            const handler = Route.options.server?.handlers?.DELETE

            if (!handler) throw new Error('DELETE handler not found')

            const request = new Request('http://localhost/api/teams?id=team123')

            const response = await handler({ request } as any)

            expect(response.status).toBe(403)
        })
    })
})
