import { z } from 'zod'

// Roles enum (sync with schema.ts)
export const RoleSchema = z.enum(['Admin', 'Manager', 'Executive', 'Auditor', 'User'])

// User update schema
export const UpdateUserSchema = z.object({
    id: z.string().min(1, 'User ID is required'),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: RoleSchema.optional(),
    avatarUrl: z.string().url().optional().nullable(),
})

// Certification Status enum (sync with schema.ts)
export const CertificationStatusSchema = z.enum(['active', 'expiring', 'expiring-soon', 'expired', 'assigned'])

// User Certification schemas
export const CreateUserCertificationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    certificationId: z.string().min(1, 'Certification ID is required'),
    certificationName: z.string().optional(),
    vendorName: z.string().optional(),
    status: CertificationStatusSchema.optional().default('active'),
    issueDate: z.string().optional().nullable(), // ISO string
    expirationDate: z.string().optional().nullable(), // ISO string
    certificationNumber: z.string().optional().nullable(),
})

export const UpdateUserCertificationDetailsSchema = z.object({
    status: CertificationStatusSchema.optional(),
    issueDate: z.string().optional().nullable(),
    expirationDate: z.string().optional().nullable(),
    certificationNumber: z.string().optional().nullable(),
})

export const AddCertificationProofSchema = z.object({
    id: z.string().uuid('Invalid certification ID'),
    action: z.literal('addProof'),
    proof: z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().url().optional(),
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
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
    managerId: z.string().optional(),
})

// Catalog schemas
export const CatalogCertificationSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    vendorId: z.string().optional(),
    vendorName: z.string().min(1, 'Vendor name is required'),
    category: z.string().optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
    price: z.number().optional().nullable(),
    description: z.string().optional().nullable(),
})

// Notification schemas
export const NotificationPreferenceSchema = z.object({
    userId: z.string().optional(),
    preferences: z.record(z.boolean().or(z.string())).optional(),
})

export const NotificationActionSchema = z.object({
    action: z.enum(['markRead', 'markAllRead', 'dismiss']),
    notificationId: z.string().uuid().optional(),
    userId: z.string().optional(),
})

// Team Requirement schemas
export const TeamRequirementSchema = z.object({
    teamId: z.string().uuid('Invalid team ID'),
    certificationId: z.string().min(1, 'Certification ID is required'),
    targetCount: z.number().int().min(1).default(1),
})
