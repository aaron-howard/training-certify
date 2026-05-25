import { z } from 'zod'
import { USER_ROLES } from './roles'

const USER_ROLE_ZOD_VALUES = [
  USER_ROLES[0],
  USER_ROLES[1],
  USER_ROLES[2],
  USER_ROLES[3],
  USER_ROLES[4],
] as const

/**
 * Roles enum schema — values match `USER_ROLES` / Postgres `role` enum.
 */
export const RoleSchema = z.enum(USER_ROLE_ZOD_VALUES)

/**
 * Schema for updating user information.
 *
 * All fields are optional, allowing partial updates. Validates user ID, name,
 * email format, role, and avatar URL format/length.
 *
 * @example
 * ```typescript
 * const updates = UpdateUserSchema.parse({
 *   id: 'user_123',
 *   name: 'John Doe',
 *   role: 'Manager'
 * })
 * ```
 */
export const UpdateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required').max(255, 'User ID too long'),
  name: z
    .string()
    .min(1)
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  email: z
    .string()
    .email()
    .max(255, 'Email must be 255 characters or less')
    .optional(),
  role: RoleSchema.optional(),
  avatarUrl: z
    .string()
    .url()
    .max(2048, 'URL must be 2048 characters or less')
    .optional()
    .nullable(),
})

/**
 * Certification Status enum schema (must be kept in sync with schema.ts certificationStatusEnum).
 *
 * Validates certification status values. Valid statuses are:
 * - 'active': Certification is current and valid
 * - 'expiring': Certification is expiring soon
 * - 'expiring-soon': Certification will expire in the near future
 * - 'expired': Certification has expired
 * - 'assigned': Certification has been assigned but not yet completed
 *
 * @example
 * ```typescript
 * const status = CertificationStatusSchema.parse('active') // Returns 'active'
 * ```
 */
export const CertificationStatusSchema = z.enum([
  'active',
  'expiring',
  'expiring-soon',
  'expired',
  'assigned',
])

/**
 * Helper schema to validate date strings.
 * Accepts ISO 8601 and other valid date formats that can be parsed by JavaScript's Date constructor.
 * Returns optional nullable string to allow for missing dates.
 */
const dateString = z
  .string()
  .refine(
    (val) => {
      if (!val) return true // Allow null/empty
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: 'Must be a valid date string' },
  )
  .optional()
  .nullable()

/**
 * Schema for creating a new user certification record.
 *
 * Validates all required and optional fields for adding a certification to a user.
 * Required fields: userId, certificationId. Optional fields include dates,
 * certification number, and status (defaults to 'active').
 *
 * @example
 * ```typescript
 * const certData = CreateUserCertificationSchema.parse({
 *   userId: 'user_123',
 *   certificationId: 'ms-az-104',
 *   status: 'active',
 *   issueDate: '2024-01-01',
 *   expirationDate: '2027-01-01'
 * })
 * ```
 */
export const CreateUserCertificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(255, 'User ID too long'),
  certificationId: z
    .string()
    .min(1, 'Certification ID is required')
    .max(255, 'Certification ID too long'),
  status: CertificationStatusSchema.optional().default('active'),
  issueDate: dateString,
  expirationDate: dateString,
  certificationNumber: z
    .string()
    .max(255, 'Certification number must be 255 characters or less')
    .optional()
    .nullable(),
})

export const UpdateUserCertificationDetailsSchema = z.object({
  status: CertificationStatusSchema.optional(),
  issueDate: dateString,
  expirationDate: dateString,
  certificationNumber: z
    .string()
    .max(255, 'Certification number must be 255 characters or less')
    .optional()
    .nullable(),
})

// Extended schema for create operations with all fields
export const CreateCertificationInputSchema =
  CreateUserCertificationSchema.extend({
    documentUrl: z
      .string()
      .url()
      .max(2048, 'Document URL must be 2048 characters or less')
      .optional()
      .nullable(),
    verifiedAt: dateString,
  })

// Schema for update certification operations
export const UpdateCertificationInputSchema = z.object({
  id: z.string().uuid('Invalid certification ID'),
  updates: z.object({
    userId: z.string().min(1).max(255, 'User ID too long').optional(),
    certificationId: z
      .string()
      .min(1)
      .max(255, 'Certification ID too long')
      .optional(),
    certificationNumber: z
      .string()
      .max(255, 'Certification number must be 255 characters or less')
      .optional()
      .nullable(),
    issueDate: dateString,
    expirationDate: dateString,
    status: CertificationStatusSchema.optional(),
    documentUrl: z
      .string()
      .url()
      .max(2048, 'Document URL must be 2048 characters or less')
      .optional()
      .nullable(),
    verifiedAt: dateString,
  }),
})

export const AddCertificationProofSchema = z.object({
  id: z.string().uuid('Invalid certification ID'),
  action: z.literal('addProof'),
  proof: z.object({
    fileName: z
      .string()
      .min(1)
      .max(255, 'File name must be 255 characters or less'),
    fileUrl: z
      .string()
      .url('Proof file URL must be a valid HTTPS URL')
      .max(2048, 'File URL must be 2048 characters or less')
      .refine(
        (url) =>
          !url.startsWith('blob:') &&
          !url.startsWith('data:') &&
          url.startsWith('https://'),
        'Proof file URL must use HTTPS (upload via POST /api/certifications/proof)',
      ),
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
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(255, 'Team name must be 255 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  managerId: z.string().max(255, 'Manager ID too long').optional(),
})

/**
 * Schema for catalog certification entries.
 *
 * Validates certification data for the certification catalog. Required fields
 * are id, name, and vendorName. Used when adding certifications to the catalog.
 *
 * @example
 * ```typescript
 * const catalogCert = CatalogCertificationSchema.parse({
 *   id: 'ms-az-104',
 *   name: 'Azure Administrator',
 *   vendorName: 'Microsoft',
 *   category: 'Cloud',
 *   difficulty: 'Intermediate'
 * })
 * ```
 */
export const CatalogCertificationSchema = z.object({
  id: z.string().min(1, 'ID is required').max(255, 'ID too long'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  vendorId: z
    .string()
    .min(1, 'Vendor ID is required')
    .max(255, 'Vendor ID too long'),
  vendorName: z
    .string()
    .max(255, 'Vendor name must be 255 characters or less')
    .optional(),
  vendorLogo: z
    .string()
    .max(2048, 'Vendor logo URL too long')
    .optional()
    .nullable(),
  category: z
    .string()
    .max(255, 'Category must be 255 characters or less')
    .optional(),
  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .optional(),
  price: z.number().optional().nullable(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable(),
  officialSiteUrl: z
    .string()
    .max(2048, 'Official site URL must be 2048 characters or less')
    .optional()
    .nullable(),
})

// Schema for catalog certification updates (partial updates)
export const UpdateCatalogCertificationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  vendorId: z.string().max(255, 'Vendor ID too long').optional(),
  vendorName: z
    .string()
    .max(255, 'Vendor name must be 255 characters or less')
    .optional(),
  vendorLogo: z
    .string()
    .max(2048, 'Vendor logo URL too long')
    .optional()
    .nullable(),
  category: z
    .string()
    .max(255, 'Category must be 255 characters or less')
    .optional(),
  difficulty: z
    .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .optional(),
  price: z
    .union([z.number(), z.string().max(50)])
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable(),
  validityPeriod: z
    .string()
    .max(255, 'Validity period must be 255 characters or less')
    .optional(),
  renewalCycle: z.number().int().positive().optional(),
  officialSiteUrl: z
    .string()
    .max(2048, 'Official site URL must be 2048 characters or less')
    .optional()
    .nullable(),
})

// Notification schemas
export const NotificationPreferenceSchema = z.object({
  userId: z.string().max(255, 'User ID too long').optional(),
  preferences: z
    .record(z.boolean().or(z.string().max(255, 'Preference value too long')))
    .optional(),
})

export const NotificationActionSchema = z.object({
  action: z.enum(['markRead', 'markAllRead', 'dismiss']),
  notificationId: z.string().uuid().optional(),
  userId: z.string().max(255, 'User ID too long').optional(),
})

// Team Requirement schemas
export const TeamRequirementSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  certificationId: z
    .string()
    .min(1, 'Certification ID is required')
    .max(255, 'Certification ID too long'),
  targetCount: z.number().int().min(1).default(1),
})
