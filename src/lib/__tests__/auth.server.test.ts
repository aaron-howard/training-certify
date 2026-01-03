/**
 * Unit tests for auth.server.ts
 * Tests authentication and authorization utilities
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAuthenticatedUser,
  getVerifiedAuth,
  requireRole,
} from '../auth.server'
import { factories, mockClerkAuth } from '../../test/factories'

// Mock Clerk auth
vi.mock('@clerk/tanstack-react-start/server')

// Mock database
vi.mock('../db/db.server', () => ({
  getDb: vi.fn(),
}))

describe('auth.server.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVerifiedAuth', () => {
    it('should return userId when auth is valid', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const userId = await getVerifiedAuth()

      expect(userId).toBe('user_test123')
      expect(auth).toHaveBeenCalled()
    })

    it('should throw error when userId is null', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      vi.mocked(auth).mockResolvedValue({ userId: null })

      await expect(getVerifiedAuth()).rejects.toThrow(
        'Unauthorized: No user session',
      )
    })

    it('should throw error when userId is undefined', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      vi.mocked(auth).mockResolvedValue({ userId: undefined })

      await expect(getVerifiedAuth()).rejects.toThrow(
        'Unauthorized: No user session',
      )
    })

    it('should throw error when auth fails', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      vi.mocked(auth).mockRejectedValue(new Error('Auth failed'))

      await expect(getVerifiedAuth()).rejects.toThrow('Auth failed')
    })
  })

  describe('getAuthenticatedUser', () => {
    it('should return user with role when found in database', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.user()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await getAuthenticatedUser()

      expect(session).toEqual({
        userId: 'user_test123',
        role: 'User',
      })
    })

    it('should throw error when user not found in database', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_notfound' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      await expect(getAuthenticatedUser()).rejects.toThrow(
        'Unauthorized: User not found',
      )
    })

    it('should throw error when database is not available', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })
      vi.mocked(getDb).mockResolvedValue(null)

      await expect(getAuthenticatedUser()).rejects.toThrow(
        'Database not available',
      )
    })

    it('should handle database errors gracefully', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Database error')),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      await expect(getAuthenticatedUser()).rejects.toThrow('Database error')
    })
  })

  describe('requireRole', () => {
    it('should allow access when user has required role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_admin123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.admin()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['Admin'])

      expect(session).toEqual({
        userId: 'user_admin123',
        role: 'Admin',
      })
    })

    it('should throw 403 when user lacks required role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.user()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      await expect(requireRole(['Admin'])).rejects.toThrow(
        'Forbidden: Insufficient permissions',
      )
    })

    it('should handle multiple allowed roles', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_manager123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.manager()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['Admin', 'Manager'])

      expect(session.role).toBe('Manager')
    })

    it('should work with Admin role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_admin123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.admin()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['Admin', 'Manager', 'User'])

      expect(session.role).toBe('Admin')
    })

    it('should work with User role when allowed', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.user()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['User'])

      expect(session.role).toBe('User')
    })

    it('should reject User role when not in allowed list', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([factories.user()]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      await expect(requireRole(['Admin', 'Manager'])).rejects.toThrow(
        'Forbidden',
      )
    })

    it('should handle Executive role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      const executive = factories.user({ role: 'Executive' })
      vi.mocked(auth).mockResolvedValue({ userId: executive.id })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([executive]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['Executive', 'Admin'])

      expect(session.role).toBe('Executive')
    })

    it('should handle Auditor role', async () => {
      const { auth } = await import('@clerk/tanstack-react-start/server')
      const { getDb } = await import('../db/db.server')

      const auditor = factories.user({ role: 'Auditor' })
      vi.mocked(auth).mockResolvedValue({ userId: auditor.id })

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([auditor]),
      }
      vi.mocked(getDb).mockResolvedValue(mockDb as any)

      const session = await requireRole(['Auditor'])

      expect(session.role).toBe('Auditor')
    })
  })
})
