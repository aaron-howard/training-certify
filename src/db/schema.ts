import { pgTable, text, integer, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';

// Enums for various statuses and types
export const roleEnum = pgEnum('role', ['Admin', 'User', 'Manager', 'Executive', 'Auditor']);
export const certificationStatusEnum = pgEnum('certification_status', ['active', 'expiring', 'expiring-soon', 'expired']);
export const certificationCategoryEnum = pgEnum('certification_category', ['Cloud', 'Security', 'Networking', 'Data', 'Project Management']);
export const certificationDifficultyEnum = pgEnum('certification_difficulty', ['Beginner', 'Intermediate', 'Advanced', 'Expert']);
export const notificationSeverityEnum = pgEnum('notification_severity', ['critical', 'warning', 'info']);
export const notificationTypeEnum = pgEnum('notification_type', ['expiration-alert', 'renewal-reminder', 'team-member-alert', 'compliance-warning']);

// Users table (Mirroring Clerk users or extending them)
export const users = pgTable('users', {
    id: text('id').primaryKey(), // Clerk ID
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: text('role').notNull().default('User'), // Use text for storage, but we'll enforce the values in code/enum
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    managerId: text('manager_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Join table for Users and Teams
export const userTeams = pgTable('user_teams', {
    userId: text('user_id').notNull().references(() => users.id),
    teamId: uuid('team_id').notNull().references(() => teams.id),
}, (t) => ({
    pk: [t.userId, t.teamId],
}));

// Certifications Catalog
export const certifications = pgTable('certifications', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    vendorId: text('vendor_id').notNull(),
    vendorName: text('vendor_name').notNull(),
    vendorLogo: text('vendor_logo'),
    category: text('category'),
    difficulty: text('difficulty'),
    validityPeriod: text('validity_period'),
    renewalCycle: integer('renewal_cycle'), // in months
    price: text('price'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Certifications (The actual instances owned by users)
export const userCertifications = pgTable('user_certifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    certificationId: text('certification_id').notNull().references(() => certifications.id),
    certificationName: text('certification_name').notNull(),
    vendorName: text('vendor_name').notNull(),
    certificationNumber: text('certification_number'),
    issueDate: text('issue_date'), // ISO string or date
    expirationDate: text('expiration_date'), // ISO string or date
    status: text('status').notNull().default('active'),
    daysUntilExpiration: integer('days_until_expiration'),
    documentUrl: text('document_url'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    type: text('type').notNull(),
    severity: text('severity').notNull().default('info'),
    title: text('title').notNull(),
    description: text('description'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    isDismissed: boolean('is_dismissed').default(false).notNull(),
    certificationId: text('certification_id'),
    userCertificationId: uuid('user_certification_id'),
});

// User Certification Proofs (Evidence documents)
export const userCertificationProofs = pgTable('user_certification_proofs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userCertificationId: uuid('user_certification_id').notNull().references(() => userCertifications.id),
    fileName: text('file_name').notNull(),
    fileUrl: text('file_url').notNull(),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    details: text('details'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});
