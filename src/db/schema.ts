import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Enums for various statuses and types
export const roleEnum = pgEnum('role', [
  'Admin',
  'User',
  'Manager',
  'Executive',
  'Auditor',
])
export const certificationStatusEnum = pgEnum('certification_status', [
  'active',
  'expiring',
  'expiring-soon',
  'expired',
  'assigned',
])
export const certificationCategoryEnum = pgEnum('certification_category', [
  'AI',
  'AppDynamics',
  'Business Applications',
  'Channel/Partner',
  'Cloud',
  'Collaboration',
  'Cybersecurity',
  'Data',
  'Data Center',
  'Design',
  'DevNet',
  'DevOps',
  'Dynamics 365',
  'Enterprise',
  'Field Technician',
  'IT',
  'Meraki',
  'Modern Workplace',
  'Networking',
  'Power Platform',
  'Project Management',
  'Security',
  'Service Provider',
  'Support Technician',
])
export const certificationDifficultyEnum = pgEnum('certification_difficulty', [
  'Advanced',
  'Associate',
  'Beginner',
  'Cybersecurity',
  'Expert',
  'Financial App',
  'Information Technology',
  'Intermediate',
  'IT Finance',
  'Networking',
  'Professional',
  'Project Management',
  'ServiceNow',
  'ServiceNow*',
  'Software and Quality',
  'Virtualization',
])
export const notificationSeverityEnum = pgEnum('notification_severity', [
  'critical',
  'warning',
  'info',
])
export const notificationTypeEnum = pgEnum('notification_type', [
  'expiration-alert',
  'renewal-reminder',
  'team-member-alert',
  'compliance-warning',
])

// Users table (Mirroring Clerk users or extending them)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk ID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnum('role').notNull().default('User'),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Teams table
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'), // Can be longer, keep as text
    managerId: varchar('manager_id', { length: 255 }).references(
      () => users.id,
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    managerIdIdx: index('teams_manager_id_idx').on(t.managerId),
  }),
)

// Join table for Users and Teams
export const userTeams = pgTable(
  'user_teams',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id),
  },
  (t) => ({
    pk: [t.userId, t.teamId],
    userIdIdx: index('user_teams_user_id_idx').on(t.userId),
    teamIdIdx: index('user_teams_team_id_idx').on(t.teamId),
  }),
)

// Certifications Catalog
export const certifications = pgTable(
  'certifications',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    vendorId: varchar('vendor_id', { length: 255 }).notNull(),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    vendorLogo: varchar('vendor_logo', { length: 2048 }),
    category: certificationCategoryEnum('category'),
    difficulty: certificationDifficultyEnum('difficulty'),
    validityPeriod: varchar('validity_period', { length: 255 }),
    renewalCycle: integer('renewal_cycle'), // in months
    price: varchar('price', { length: 50 }), // Price as string, reasonable limit
    description: text('description'), // Can be longer, keep as text
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    renewalCycleCheck: check(
      'renewal_cycle_positive',
      sql`${t.renewalCycle} IS NULL OR ${t.renewalCycle} > 0`,
    ),
  }),
)

// User Certifications (The actual instances owned by users)
export const userCertifications = pgTable(
  'user_certifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    certificationId: varchar('certification_id', { length: 255 })
      .notNull()
      .references(() => certifications.id),
    certificationName: varchar('certification_name', { length: 255 }).notNull(),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    certificationNumber: varchar('certification_number', { length: 255 }),
    issueDate: varchar('issue_date', { length: 50 }), // ISO string or date
    expirationDate: varchar('expiration_date', { length: 50 }), // ISO string or date
    status: certificationStatusEnum('status').notNull().default('active'),
    daysUntilExpiration: integer('days_until_expiration'),
    documentUrl: varchar('document_url', { length: 2048 }),
    verifiedAt: timestamp('verified_at'),
    assignedById: varchar('assigned_by_id', { length: 255 }).references(
      () => users.id,
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index('user_certifications_user_id_idx').on(t.userId),
    certIdIdx: index('user_certifications_cert_id_idx').on(t.certificationId),
    statusIdx: index('user_certifications_status_idx').on(t.status),
    expirationDateIdx: index('user_certifications_expiration_date_idx').on(
      t.expirationDate,
    ),
    // Composite index for common query pattern: userId + status
    userIdStatusIdx: index('user_certifications_user_id_status_idx').on(
      t.userId,
      t.status,
    ),
  }),
)

// Team Requirements
export const teamRequirements = pgTable(
  'team_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id),
    certificationId: varchar('certification_id', { length: 255 })
      .notNull()
      .references(() => certifications.id),
    targetCount: integer('target_count').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    unq: unique().on(t.teamId, t.certificationId),
    teamIdIdx: index('team_requirements_team_id_idx').on(t.teamId),
    certIdIdx: index('team_requirements_cert_id_idx').on(t.certificationId),
    targetCountCheck: check('target_count_positive', sql`${t.targetCount} > 0`),
  }),
)

// Notifications
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum('type').notNull(),
    severity: notificationSeverityEnum('severity').notNull().default('info'),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'), // Can be longer, keep as text
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    isDismissed: boolean('is_dismissed').default(false).notNull(),
    certificationId: varchar('certification_id', { length: 255 }),
    userCertificationId: uuid('user_certification_id'),
  },
  (t) => ({
    userIdIdx: index('notifications_user_id_idx').on(t.userId),
    isDismissedIdx: index('notifications_is_dismissed_idx').on(t.isDismissed),
    timestampIdx: index('notifications_timestamp_idx').on(t.timestamp),
    // Composite index for common query pattern: userId + isDismissed (for active notifications)
    userIdIsDismissedIdx: index('notifications_user_id_is_dismissed_idx').on(
      t.userId,
      t.isDismissed,
    ),
    // Composite index for common query pattern: userId + isRead (for unread notifications)
    userIdIsReadIdx: index('notifications_user_id_is_read_idx').on(
      t.userId,
      t.isRead,
    ),
  }),
)

// User Certification Proofs (Evidence documents)
export const userCertificationProofs = pgTable(
  'user_certification_proofs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userCertificationId: uuid('user_certification_id')
      .notNull()
      .references(() => userCertifications.id),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: varchar('file_url', { length: 2048 }).notNull(),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  },
  (t) => ({
    userCertIdIdx: index('user_cert_proofs_user_cert_id_idx').on(
      t.userCertificationId,
    ),
  }),
)

// Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    action: varchar('action', { length: 255 }).notNull(),
    resourceType: varchar('resource_type', { length: 255 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }).notNull(),
    details: text('details'), // Can be longer, keep as text
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(t.userId),
    timestampIdx: index('audit_logs_timestamp_idx').on(t.timestamp),
    // Composite index for resource queries
    resourceTypeIdIdx: index('audit_logs_resource_type_id_idx').on(
      t.resourceType,
      t.resourceId,
    ),
  }),
)

// Rate Limit Logs (for distributed rate limiting)
export const rateLimitLogs = pgTable(
  'rate_limit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(), // User ID or IP address
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (t) => ({
    identifierIdx: index('rate_limit_logs_identifier_idx').on(t.identifier),
    timestampIdx: index('rate_limit_logs_timestamp_idx').on(t.timestamp),
    // Composite index for efficient queries
    identifierTimestampIdx: index(
      'rate_limit_logs_identifier_timestamp_idx',
    ).on(t.identifier, t.timestamp),
  }),
)
