import { z } from 'zod'

/**
 * Roles enum schema (must be kept in sync with schema.ts roleEnum).
 * Validates that a role is one of the allowed values.
 */
export const RoleSchema = z.enum(['Admin', 'Manager', 'Executive', 'Auditor', 'User'])

// User update schema
export const UpdateUserSchema = z.object({
    id: z.string().min(1, 'User ID is required').max(255, 'User ID too long'),
    name: z.string().min(1).max(255, 'Name must be 255 characters or less').optional(),
    email: z.string().email().max(255, 'Email must be 255 characters or less').optional(),
    role: RoleSchema.optional(),
    avatarUrl: z.string().url().max(2048, 'URL must be 2048 characters or less').optional().nullable(),
})

/**
 * Certification Status enum schema (must be kept in sync with schema.ts certificationStatusEnum).
 * Validates certification status values.
 */
export const CertificationStatusSchema = z.enum(['active', 'expiring', 'expiring-soon', 'expired', 'assigned'])

/**
 * Helper schema to validate date strings.
 * Accepts ISO 8601 and other valid date formats that can be parsed by JavaScript's Date constructor.
 * Returns optional nullable string to allow for missing dates.
 */
const dateString = z.string().refine(
    (val) => {
        if (!val) return true // Allow null/empty
        const date = new Date(val)
        return !isNaN(date.getTime())
    },
    { message: 'Must be a valid date string' }
).optional().nullable()

// User Certification schemas
export const CreateUserCertificationSchema = z.object({
    userId: z.string().min(1, 'User ID is required').max(255, 'User ID too long'),
    certificationId: z.string().min(1, 'Certification ID is required').max(255, 'Certification ID too long'),
    certificationName: z.string().max(255, 'Certification name must be 255 characters or less').optional(),
    vendorName: z.string().max(255, 'Vendor name must be 255 characters or less').optional(),
    status: CertificationStatusSchema.optional().default('active'),
    issueDate: dateString,
    expirationDate: dateString,
    certificationNumber: z.string().max(255, 'Certification number must be 255 characters or less').optional().nullable(),
})

export const UpdateUserCertificationDetailsSchema = z.object({
    status: CertificationStatusSchema.optional(),
    issueDate: dateString,
    expirationDate: dateString,
    certificationNumber: z.string().max(255, 'Certification number must be 255 characters or less').optional().nullable(),
})

// Extended schema for create operations with all fields
export const CreateCertificationInputSchema = CreateUserCertificationSchema.extend({
    daysUntilExpiration: z.number().int().optional(),
    documentUrl: z.string().url().max(2048, 'Document URL must be 2048 characters or less').optional().nullable(),
    verifiedAt: dateString,
})

// Schema for update certification operations
export const UpdateCertificationInputSchema = z.object({
    id: z.string().uuid('Invalid certification ID'),
    updates: z.object({
        userId: z.string().min(1).max(255, 'User ID too long').optional(),
        certificationId: z.string().min(1).max(255, 'Certification ID too long').optional(),
        certificationName: z.string().max(255, 'Certification name must be 255 characters or less').optional(),
        vendorName: z.string().max(255, 'Vendor name must be 255 characters or less').optional(),
        certificationNumber: z.string().max(255, 'Certification number must be 255 characters or less').optional().nullable(),
        issueDate: dateString,
        expirationDate: dateString,
        status: CertificationStatusSchema.optional(),
        daysUntilExpiration: z.number().int().optional(),
        documentUrl: z.string().url().max(2048, 'Document URL must be 2048 characters or less').optional().nullable(),
        verifiedAt: dateString,
    }),
})

export const AddCertificationProofSchema = z.object({
    id: z.string().uuid('Invalid certification ID'),
    action: z.literal('addProof'),
    proof: z.object({
        fileName: z.string().min(1).max(255, 'File name must be 255 characters or less'),
        fileUrl: z.string().url().max(2048, 'File URL must be 2048 characters or less').optional(),
    }),
})

export const UpdateCertificationDetailsActionSchema = z.object({
    id: z.string().uuid('Invalid certification ID'),
    action: z.literal('updateDetails'),
    updates: UpdateUserCertificationDetailsSchema,
})

export const CertificationPatchSchema = z.discriminatedUnion('action', [
    AddCertificationProofSchema,
    UpdateCertificationDetailsActionSchema,
])

// Team schemas
export const TeamSchema = z.object({
    name: z.string().min(1, 'Team name is required').max(255, 'Team name must be 255 characters or less'),
    description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
    managerId: z.string().max(255, 'Manager ID too long').optional(),
})

// Catalog schemas
export const CatalogCertificationSchema = z.object({
    id: z.string().min(1, 'ID is required').max(255, 'ID too long'),
    name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
    vendorId: z.string().max(255, 'Vendor ID too long').optional(),
    vendorName: z.string().min(1, 'Vendor name is required').max(255, 'Vendor name must be 255 characters or less'),
    category: z.string().max(255, 'Category must be 255 characters or less').optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
    price: z.number().optional().nullable(),
    description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
})

// Notification schemas
export const NotificationPreferenceSchema = z.object({
    userId: z.string().max(255, 'User ID too long').optional(),
    preferences: z.record(z.boolean().or(z.string().max(255, 'Preference value too long'))).optional(),
})

export const NotificationActionSchema = z.object({
    action: z.enum(['markRead', 'markAllRead', 'dismiss']),
    notificationId: z.string().uuid().optional(),
    userId: z.string().max(255, 'User ID too long').optional(),
})

// Team Requirement schemas
export const TeamRequirementSchema = z.object({
    teamId: z.string().uuid('Invalid team ID'),
    certificationId: z.string().min(1, 'Certification ID is required').max(255, 'Certification ID too long'),
    targetCount: z.number().int().min(1).default(1),
})
