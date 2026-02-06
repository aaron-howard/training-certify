# Database Schema Documentation

## Overview

Training Certify uses PostgreSQL as its database engine with Drizzle ORM for type-safe database interactions. The schema is defined in `src/db/schema.ts`.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│    Users    │         │  UserTeams       │         │       Teams         │
├─────────────┤         ├──────────────────┤         ├─────────────────────┤
│ id (PK)     │◄──┐     │ userId (FK)      │     ┌──│ id (PK)             │
│ name        │   │     │ teamId (FK)      │     │  │ name                │
│ email       │   │     └──────────────────┘     │  │ description          │
│ role        │   │                              │  │ managerId (FK)       │
│ avatarUrl   │   │                              │  └─────────────────────┘
│ createdAt   │   │                              │           │
│ updatedAt   │   │                              │           │
└─────────────┘   │                              │           │
      │           │                              │           │
      │           │                              │           │
      │           │         ┌─────────────────────┐         │
      │           │         │ TeamRequirements    │         │
      │           │         ├─────────────────────┤         │
      │           │         │ id (PK)             │         │
      │           │         │ teamId (FK)         │─────────┘
      │           │         │ certificationId (FK) │
      │           │         │ targetCount         │
      │           │         └─────────────────────┘
      │           │                    │
      │           │                    │
      │           │         ┌─────────────────────┐
      │           │         │ Certifications      │
      │           │         │ (Catalog)           │
      │           │         ├─────────────────────┤
      │           │         │ id (PK)             │
      │           │         │ name                │
      │           │         │ vendorName          │
      │           │         │ category            │
      │           │         │ difficulty          │
      │           │         │ price               │
      │           │         │ description         │
      │           │         └─────────────────────┘
      │           │                    │
      │           │                    │
      │           │         ┌─────────────────────┐
      │           │         │ UserCertifications   │
      │           └─────────│ userId (FK)         │
      │                     │ certificationId (FK)│
      │                     │ status               │
      │                     │ issueDate           │
      │                     │ expirationDate      │
      │                     │ certificationNumber  │
      │                     │ documentUrl          │
      │                     │ verifiedAt           │
      │                     └─────────────────────┘
      │                               │
      │                               │
      │                     ┌─────────────────────┐
      │                     │ UserCertProofs       │
      │                     ├─────────────────────┤
      │                     │ id (PK)             │
      │                     │ certificationId (FK)│
      │                     │ proofUrl            │
      │                     │ uploadedAt          │
      │                     └─────────────────────┘
      │
      │
      │         ┌─────────────────────┐
      │         │ Notifications       │
      │         ├─────────────────────┤
      │         │ id (PK)             │
      │         │ userId (FK)        │
      │         │ title              │
      │         │ description        │
      │         │ type               │
      │         │ severity           │
      │         │ isRead             │
      │         │ isDismissed       │
      │         │ timestamp          │
      │         └─────────────────────┘
      │
      │
      │         ┌─────────────────────┐
      │         │ AuditLogs           │
      │         ├─────────────────────┤
      │         │ id (PK)             │
      │         │ userId (FK)         │
      │         │ action              │
      │         │ resourceType        │
      │         │ resourceId         │
      │         │ details            │
      │         │ timestamp          │
      │         └─────────────────────┘
      └─────────┘
```

## Tables

### users

Stores user account information synced from Clerk.

| Column    | Type         | Constraints              | Description                                          |
| --------- | ------------ | ------------------------ | ---------------------------------------------------- |
| id        | string(255)  | PRIMARY KEY              | Clerk user ID                                        |
| name      | string(255)  | NOT NULL                 | User's full name                                     |
| email     | string(255)  | NOT NULL, UNIQUE         | User's email address                                 |
| role      | enum         | NOT NULL, DEFAULT 'User' | User role (Admin, Manager, Executive, Auditor, User) |
| avatarUrl | string(2048) | NULLABLE                 | URL to user's avatar image                           |
| createdAt | timestamp    | NOT NULL, DEFAULT now()  | Account creation timestamp                           |
| updatedAt | timestamp    | NOT NULL, DEFAULT now()  | Last update timestamp                                |

**Indexes:**

- Primary key on `id`
- Unique index on `email`

### teams

Stores team/organizational unit information.

| Column      | Type        | Constraints                            | Description           |
| ----------- | ----------- | -------------------------------------- | --------------------- |
| id          | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Team ID               |
| name        | string(255) | NOT NULL                               | Team name             |
| description | text        | NULLABLE                               | Team description      |
| managerId   | string(255) | NULLABLE, FK → users.id                | Manager user ID       |
| createdAt   | timestamp   | NOT NULL, DEFAULT now()                | Creation timestamp    |
| updatedAt   | timestamp   | NOT NULL, DEFAULT now()                | Last update timestamp |

**Indexes:**

- Primary key on `id`
- Index on `managerId` (for manager queries)

### userTeams

Junction table linking users to teams (many-to-many relationship).

| Column | Type        | Constraints             | Description |
| ------ | ----------- | ----------------------- | ----------- |
| userId | string(255) | NOT NULL, FK → users.id | User ID     |
| teamId | uuid        | NOT NULL, FK → teams.id | Team ID     |

**Indexes:**

- Composite primary key on `(userId, teamId)`
- Index on `teamId` (for team member queries)
- Index on `userId` (for user team queries)

### certifications (Catalog)

Stores available certifications in the catalog.

| Column         | Type          | Constraints             | Description                                                 |
| -------------- | ------------- | ----------------------- | ----------------------------------------------------------- |
| id             | string(255)   | PRIMARY KEY             | Certification ID (e.g., 'ms-az-104')                        |
| name           | string(255)   | NOT NULL                | Certification name                                          |
| vendorId       | string(255)   | NULLABLE                | Vendor ID                                                   |
| vendorName     | string(255)   | NOT NULL                | Vendor name                                                 |
| category       | string(255)   | NULLABLE                | Category (e.g., 'Cloud', 'Security')                        |
| difficulty     | enum          | NULLABLE                | Difficulty level (Beginner, Intermediate, Advanced, Expert) |
| price          | decimal(10,2) | NULLABLE                | Certification price                                         |
| description    | text          | NULLABLE                | Certification description                                   |
| validityPeriod | string(255)   | NULLABLE                | Validity period (e.g., '3 years')                           |
| renewalCycle   | integer       | NULLABLE                | Renewal cycle in months                                     |
| createdAt      | timestamp     | NOT NULL, DEFAULT now() | Creation timestamp                                          |
| updatedAt      | timestamp     | NOT NULL, DEFAULT now() | Last update timestamp                                       |

**Indexes:**

- Primary key on `id`
- Index on `vendorName` (for vendor filtering)
- Index on `category` (for category filtering)

### userCertifications

Stores user's certification records.

| Column              | Type         | Constraints                            | Description                                                 |
| ------------------- | ------------ | -------------------------------------- | ----------------------------------------------------------- |
| id                  | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | Certification record ID                                     |
| userId              | string(255)  | NOT NULL, FK → users.id                | User ID                                                     |
| certificationId     | string(255)  | NOT NULL, FK → certifications.id       | Certification ID from catalog                               |
| certificationName   | string(255)  | NULLABLE                               | Certification name (denormalized)                           |
| vendorName          | string(255)  | NULLABLE                               | Vendor name (denormalized)                                  |
| status              | enum         | NOT NULL, DEFAULT 'active'             | Status (active, expiring, expiring-soon, expired, assigned) |
| issueDate           | date         | NULLABLE                               | Issue date                                                  |
| expirationDate      | date         | NULLABLE                               | Expiration date                                             |
| certificationNumber | string(255)  | NULLABLE                               | Certification number/license                                |
| daysUntilExpiration | integer      | NULLABLE                               | Calculated days until expiration                            |
| documentUrl         | string(2048) | NULLABLE                               | URL to proof document                                       |
| verifiedAt          | timestamp    | NULLABLE                               | Verification timestamp                                      |
| createdAt           | timestamp    | NOT NULL, DEFAULT now()                | Creation timestamp                                          |
| updatedAt           | timestamp    | NOT NULL, DEFAULT now()                | Last update timestamp                                       |

**Indexes:**

- Primary key on `id`
- Index on `userId` (for user certification queries)
- Index on `certificationId` (for certification queries)
- Index on `status` (for status filtering)
- Index on `expirationDate` (for expiration queries)
- Composite index on `(userId, status)` (for user dashboard queries)

### userCertificationProofs

Stores proof documents for certifications.

| Column          | Type         | Constraints                            | Description             |
| --------------- | ------------ | -------------------------------------- | ----------------------- |
| id              | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | Proof ID                |
| certificationId | uuid         | NOT NULL, FK → userCertifications.id   | Certification record ID |
| proofUrl        | string(2048) | NOT NULL                               | URL to proof document   |
| uploadedAt      | timestamp    | NOT NULL, DEFAULT now()                | Upload timestamp        |

**Indexes:**

- Primary key on `id`
- Index on `certificationId` (for certification proof queries)

### teamRequirements

Stores certification requirements for teams.

| Column          | Type        | Constraints                            | Description                                           |
| --------------- | ----------- | -------------------------------------- | ----------------------------------------------------- |
| id              | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Requirement ID                                        |
| teamId          | uuid        | NOT NULL, FK → teams.id                | Team ID                                               |
| certificationId | string(255) | NOT NULL, FK → certifications.id       | Certification ID                                      |
| targetCount     | integer     | NOT NULL, DEFAULT 1                    | Target number of team members with this certification |

**Indexes:**

- Primary key on `id`
- Composite unique index on `(teamId, certificationId)` (prevents duplicates)
- Index on `teamId` (for team requirement queries)
- Index on `certificationId` (for certification requirement queries)

### notifications

Stores user notifications.

| Column      | Type        | Constraints                            | Description                        |
| ----------- | ----------- | -------------------------------------- | ---------------------------------- |
| id          | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Notification ID                    |
| userId      | string(255) | NOT NULL, FK → users.id                | User ID                            |
| title       | string(255) | NOT NULL                               | Notification title                 |
| description | text        | NULLABLE                               | Notification description           |
| type        | enum        | NOT NULL, DEFAULT 'info'               | Type (info, warning, alert)        |
| severity    | enum        | NOT NULL, DEFAULT 'info'               | Severity (info, warning, critical) |
| isRead      | boolean     | NOT NULL, DEFAULT false                | Read status                        |
| isDismissed | boolean     | NOT NULL, DEFAULT false                | Dismissed status                   |
| timestamp   | timestamp   | NOT NULL, DEFAULT now()                | Notification timestamp             |

**Indexes:**

- Primary key on `id`
- Index on `userId` (for user notification queries)
- Composite index on `(userId, isDismissed)` (for active notification queries)
- Index on `timestamp` (for sorting)

### auditLogs

Stores audit trail for compliance tracking.

| Column       | Type        | Constraints                            | Description                                           |
| ------------ | ----------- | -------------------------------------- | ----------------------------------------------------- |
| id           | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Audit log ID                                          |
| userId       | string(255) | NULLABLE, FK → users.id                | User ID (nullable for system actions)                 |
| action       | string(255) | NOT NULL                               | Action performed                                      |
| resourceType | string(255) | NULLABLE                               | Resource type (e.g., 'user', 'certification', 'team') |
| resourceId   | string(255) | NULLABLE                               | Resource ID                                           |
| details      | jsonb       | NULLABLE                               | Additional details                                    |
| timestamp    | timestamp   | NOT NULL, DEFAULT now()                | Action timestamp                                      |

**Indexes:**

- Primary key on `id`
- Index on `userId` (for user audit queries)
- Index on `resourceType` (for resource filtering)
- Composite index on `(resourceType, resourceId)` (for resource audit queries)
- Index on `timestamp` (for time-based queries)

## Enums

### User Roles

- `Admin` - Full system access
- `Manager` - Team management access
- `Executive` - Executive dashboard access
- `Auditor` - Read-only audit access
- `User` - Standard user access

### Certification Status

- `active` - Certification is current and valid
- `expiring` - Certification is expiring soon
- `expiring-soon` - Certification will expire in the near future
- `expired` - Certification has expired
- `assigned` - Certification has been assigned but not yet completed

### Notification Types

- `info` - Informational notification
- `warning` - Warning notification
- `alert` - Alert notification

### Notification Severity

- `info` - Informational severity
- `warning` - Warning severity
- `critical` - Critical severity

## Relationships

1. **Users ↔ Teams**: Many-to-many via `userTeams` junction table
2. **Teams → Users**: One-to-many (manager relationship via `teams.managerId`)
3. **Users → UserCertifications**: One-to-many
4. **Certifications → UserCertifications**: One-to-many
5. **UserCertifications → UserCertProofs**: One-to-many
6. **Teams → TeamRequirements**: One-to-many
7. **Certifications → TeamRequirements**: One-to-many
8. **Users → Notifications**: One-to-many
9. **Users → AuditLogs**: One-to-many (nullable)

## Data Integrity

- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate entries
- NOT NULL constraints ensure required data
- Default values provide sensible defaults
- Enums restrict values to valid options

## Performance Considerations

- Indexes on foreign keys for join performance
- Composite indexes for common query patterns
- Indexes on frequently filtered columns (status, timestamp)
- Denormalized fields (certificationName, vendorName) for read performance

## Migration Strategy

Database migrations are managed using Drizzle Kit:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push
```

Migrations are stored in `drizzle/` directory.
