/**
 * Unit tests for validation schemas (Zod)
 */

import { describe, expect, it } from 'vitest'
import {
  CatalogCertificationSchema,
  CertificationPatchSchema,
  CertificationStatusSchema,
  CreateCertificationInputSchema,
  CreateUserCertificationSchema,
  NotificationActionSchema,
  RoleSchema,
  TeamRequirementSchema,
  TeamSchema,
  UpdateCertificationInputSchema,
  UpdateUserSchema,
} from '../validation'

describe('validation.ts', () => {
  describe('RoleSchema', () => {
    it('accepts valid roles', () => {
      expect(RoleSchema.parse('Admin')).toBe('Admin')
      expect(RoleSchema.parse('User')).toBe('User')
      expect(RoleSchema.parse('Manager')).toBe('Manager')
      expect(RoleSchema.parse('Executive')).toBe('Executive')
      expect(RoleSchema.parse('Auditor')).toBe('Auditor')
    })

    it('rejects invalid roles', () => {
      expect(() => RoleSchema.parse('SuperAdmin')).toThrow()
      expect(() => RoleSchema.parse('')).toThrow()
      expect(() => RoleSchema.parse(123)).toThrow()
    })
  })

  describe('UpdateUserSchema', () => {
    it('accepts valid partial user update', () => {
      const result = UpdateUserSchema.parse({
        id: 'user_123',
        name: 'Jane',
        role: 'Manager',
      })
      expect(result.id).toBe('user_123')
      expect(result.name).toBe('Jane')
      expect(result.role).toBe('Manager')
    })

    it('accepts optional email and avatarUrl', () => {
      const result = UpdateUserSchema.parse({
        id: 'user_1',
        email: 'jane@example.com',
        avatarUrl: 'https://example.com/avatar.png',
      })
      expect(result.email).toBe('jane@example.com')
      expect(result.avatarUrl).toBe('https://example.com/avatar.png')
    })

    it('rejects empty id', () => {
      expect(() => UpdateUserSchema.parse({ id: '', name: 'Test' })).toThrow()
    })

    it('rejects invalid email', () => {
      expect(() =>
        UpdateUserSchema.parse({ id: 'user_1', email: 'not-an-email' }),
      ).toThrow()
    })
  })

  describe('CertificationStatusSchema', () => {
    it('accepts valid statuses', () => {
      expect(CertificationStatusSchema.parse('active')).toBe('active')
      expect(CertificationStatusSchema.parse('expired')).toBe('expired')
      expect(CertificationStatusSchema.parse('assigned')).toBe('assigned')
    })

    it('rejects invalid status', () => {
      expect(() => CertificationStatusSchema.parse('pending')).toThrow()
    })
  })

  describe('CreateUserCertificationSchema', () => {
    it('accepts minimal valid input and defaults status', () => {
      const result = CreateUserCertificationSchema.parse({
        userId: 'user_1',
        certificationId: 'cert-az-104',
      })
      expect(result.userId).toBe('user_1')
      expect(result.certificationId).toBe('cert-az-104')
      expect(result.status).toBe('active')
    })

    it('accepts full input with dates', () => {
      const result = CreateUserCertificationSchema.parse({
        userId: 'user_1',
        certificationId: 'cert-1',
        status: 'expiring',
        issueDate: '2024-01-01',
        expirationDate: '2027-01-01',
        certificationNumber: 'NUM-123',
      })
      expect(result.issueDate).toBe('2024-01-01')
      expect(result.expirationDate).toBe('2027-01-01')
      expect(result.certificationNumber).toBe('NUM-123')
    })

    it('rejects invalid date string', () => {
      expect(() =>
        CreateUserCertificationSchema.parse({
          userId: 'user_1',
          certificationId: 'cert-1',
          expirationDate: 'not-a-date',
        }),
      ).toThrow()
    })

    it('rejects missing userId', () => {
      expect(() =>
        CreateUserCertificationSchema.parse({
          certificationId: 'cert-1',
        }),
      ).toThrow()
    })
  })

  describe('TeamSchema', () => {
    it('accepts valid team', () => {
      const result = TeamSchema.parse({
        name: 'Engineering',
        description: 'Dev team',
        managerId: 'mgr_1',
      })
      expect(result.name).toBe('Engineering')
      expect(result.description).toBe('Dev team')
      expect(result.managerId).toBe('mgr_1')
    })

    it('accepts team with only required name', () => {
      const result = TeamSchema.parse({ name: 'Solo Team' })
      expect(result.name).toBe('Solo Team')
      expect(result.description).toBeUndefined()
    })

    it('rejects empty name', () => {
      expect(() => TeamSchema.parse({ name: '' })).toThrow()
    })

    it('rejects name over 255 chars', () => {
      expect(() => TeamSchema.parse({ name: 'a'.repeat(256) })).toThrow()
    })
  })

  describe('CatalogCertificationSchema', () => {
    it('accepts valid catalog certification', () => {
      const result = CatalogCertificationSchema.parse({
        id: 'ms-az-104',
        name: 'Azure Administrator',
        vendorId: 'microsoft',
        vendorName: 'Microsoft',
        category: 'Cloud',
        difficulty: 'Intermediate',
      })
      expect(result.id).toBe('ms-az-104')
      expect(result.name).toBe('Azure Administrator')
      expect(result.vendorId).toBe('microsoft')
    })

    it('rejects missing required id', () => {
      expect(() =>
        CatalogCertificationSchema.parse({
          name: 'Cert',
          vendorId: 'v1',
        }),
      ).toThrow()
    })

    it('accepts optional difficulty enum', () => {
      const result = CatalogCertificationSchema.parse({
        id: 'c1',
        name: 'Cert',
        vendorId: 'v1',
        difficulty: 'Expert',
      })
      expect(result.difficulty).toBe('Expert')
    })

    it('rejects invalid difficulty', () => {
      expect(() =>
        CatalogCertificationSchema.parse({
          id: 'c1',
          name: 'Cert',
          vendorId: 'v1',
          difficulty: 'SuperHard',
        }),
      ).toThrow()
    })
  })

  describe('NotificationActionSchema', () => {
    it('accepts markRead with notificationId', () => {
      const result = NotificationActionSchema.parse({
        action: 'markRead',
        notificationId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.action).toBe('markRead')
      expect(result.notificationId).toBeDefined()
    })

    it('accepts markAllRead without notificationId', () => {
      const result = NotificationActionSchema.parse({
        action: 'markAllRead',
      })
      expect(result.action).toBe('markAllRead')
    })

    it('rejects invalid action', () => {
      expect(() =>
        NotificationActionSchema.parse({ action: 'delete' }),
      ).toThrow()
    })
  })

  describe('TeamRequirementSchema', () => {
    it('accepts valid requirement and defaults targetCount', () => {
      const result = TeamRequirementSchema.parse({
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        certificationId: 'cert-1',
      })
      expect(result.teamId).toBeDefined()
      expect(result.certificationId).toBe('cert-1')
      expect(result.targetCount).toBe(1)
    })

    it('accepts explicit targetCount', () => {
      const result = TeamRequirementSchema.parse({
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        certificationId: 'cert-1',
        targetCount: 5,
      })
      expect(result.targetCount).toBe(5)
    })

    it('rejects invalid teamId uuid', () => {
      expect(() =>
        TeamRequirementSchema.parse({
          teamId: 'not-a-uuid',
          certificationId: 'cert-1',
        }),
      ).toThrow()
    })
  })

  describe('CertificationPatchSchema (discriminated union)', () => {
    it('accepts addProof action', () => {
      const result = CertificationPatchSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'addProof',
        proof: {
          fileName: 'doc.pdf',
          fileUrl: 'https://example.com/doc.pdf',
        },
      })
      expect(result.action).toBe('addProof')
      if (result.action === 'addProof') {
        expect(result.proof.fileName).toBe('doc.pdf')
      }
    })

    it('accepts updateDetails action', () => {
      const result = CertificationPatchSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'updateDetails',
        updates: { status: 'expired' },
      })
      expect(result.action).toBe('updateDetails')
      if (result.action === 'updateDetails') {
        expect(result.updates.status).toBe('expired')
      }
    })

    it('rejects unknown action', () => {
      expect(() =>
        CertificationPatchSchema.parse({
          id: '123e4567-e89b-12d3-a456-426614174000',
          action: 'delete',
        }),
      ).toThrow()
    })
  })

  describe('CreateCertificationInputSchema', () => {
    it('accepts with optional documentUrl and verifiedAt', () => {
      const result = CreateCertificationInputSchema.parse({
        userId: 'user_1',
        certificationId: 'cert-1',
        documentUrl: 'https://example.com/doc.pdf',
        verifiedAt: '2024-06-01',
      })
      expect(result.documentUrl).toBe('https://example.com/doc.pdf')
      expect(result.verifiedAt).toBe('2024-06-01')
    })
  })

  describe('UpdateCertificationInputSchema', () => {
    it('accepts valid update with uuid id', () => {
      const result = UpdateCertificationInputSchema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        updates: {
          status: 'active',
          expirationDate: '2028-01-01',
        },
      })
      expect(result.id).toBeDefined()
      expect(result.updates.status).toBe('active')
    })

    it('rejects invalid uuid for id', () => {
      expect(() =>
        UpdateCertificationInputSchema.parse({
          id: 'not-uuid',
          updates: {},
        }),
      ).toThrow()
    })
  })
})
