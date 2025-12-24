# Data Model

This directory contains the global data model for Training-Certify, including TypeScript type definitions and sample data for all core entities.

## Core Entities

### User
Individual employees who need certifications tracked. Users can have different roles that determine their permissions and dashboard views.

**Fields:**
- `id` — Unique identifier
- `name` — Full name
- `email` — Email address
- `role` — User role (Developer, Manager, Architect, SRE, Security Engineer, PM, Executive, Auditor)
- `teamIds` — Array of team IDs the user belongs to
- `avatarUrl` — URL to user's profile picture (nullable)

**Relationships:**
- User has many UserCertifications
- User belongs to many Teams (through teamIds)
- User can perform AuditLog actions
- User receives Notifications

### Certification
A specific certification from the catalog with metadata including name, vendor, renewal cycle, intended audience, prerequisites, and difficulty level.

**Fields:**
- `id` — Unique identifier
- `name` — Certification name (e.g., "AWS Certified Solutions Architect - Associate")
- `vendorId` — Reference to Vendor
- `vendorName` — Vendor display name
- `vendorLogo` — URL to vendor logo
- `category` — Certification category (Cloud, Security, Networking, Data, Project Management)
- `difficulty` — Difficulty level (Beginner, Intermediate, Advanced, Expert)
- `validityPeriod` — How long the certification is valid (e.g., "3 years")
- `renewalCycle` — Renewal cycle in months
- `intendedAudience` — Target roles (e.g., ["Cloud Architects", "DevOps Engineers"])
- `description` — Full description of the certification
- `prerequisites` — Required and recommended prerequisites
- `examInfo` — Exam details (format, duration, questions, passing score, cost)
- `renewalRequirements` — Renewal options and cycle
- `holderCount` — Number of users who hold this certification

**Relationships:**
- Certification belongs to a Vendor
- Certification has many UserCertifications
- Certification can be part of CertificationRequirements

### UserCertification
A user's acquired certification with expiration date, upload proof, current status, renewal tracking, and verification timestamps.

**Fields:**
- `id` — Unique identifier
- `userId` — Reference to User
- `certificationId` — Reference to Certification
- `certificationName` — Display name
- `vendorName` — Vendor display name
- `certificationNumber` — User's unique certification number from the vendor
- `issueDate` — When the certification was issued (ISO 8601)
- `expirationDate` — When it expires (ISO 8601, nullable for lifetime certs)
- `status` — Current status (active, expiring, expiring-soon, expired)
- `daysUntilExpiration` — Calculated days until expiration (nullable)
- `documentUrl` — URL to uploaded certification document
- `verifiedAt` — Timestamp of verification (ISO 8601)

**Relationships:**
- UserCertification belongs to a User
- UserCertification references a Certification
- UserCertification generates Notifications
- UserCertification creates AuditLog entries

### Team
Groups of users for competency tracking, workforce management, and gap analysis. Users can belong to multiple teams.

**Fields:**
- `id` — Unique identifier
- `name` — Team name
- `description` — Team description
- `memberCount` — Number of team members
- `managerId` — Reference to User who manages this team

**Relationships:**
- Team has many Users (through membership)
- Team has TeamMetrics
- Team can have CertificationRequirements
- Team has WorkforcePlanningInsights

### Vendor
Certification issuing bodies such as AWS, Microsoft, (ISC)², ITIL, CompTIA, PMI, GIAC, OffSec, Cisco, and others.

**Fields:**
- `id` — Unique identifier
- `name` — Vendor name (e.g., "Amazon Web Services")
- `logo` — URL to vendor logo
- `certificationCount` — Number of certifications offered

**Relationships:**
- Vendor has many Certifications

### AuditLog
Timestamped record of all actions including uploads, renewals, assignments, and verifications for compliance tracking and regulatory requirements.

**Fields:**
- `id` — Unique identifier
- `timestamp` — When the action occurred (ISO 8601)
- `action` — Type of action (upload, renewal, deletion, verification, assignment, expiration, update)
- `performedBy` — Who performed the action (userId, name, email, role)
- `affectedResource` — What was affected (type, id, name, userId, teamId)
- `details` — Human-readable description of the action

**Relationships:**
- AuditLog references Users (performer and affected)
- AuditLog references UserCertifications, Teams, or CertificationRequirements

### Notification
Renewal reminders and expiration alerts sent to users at configurable intervals (30/60/90 days) based on certification expiration dates.

**Fields:**
- `id` — Unique identifier
- `userId` — Reference to User
- `userName` — Display name of user
- `type` — Notification type (expiration-alert, renewal-reminder, team-member-alert, compliance-warning)
- `severity` — Severity level (critical, warning, info)
- `title` — Notification title
- `description` — Detailed message
- `timestamp` — When the notification was created (ISO 8601)
- `isRead` — Whether user has read it
- `isDismissed` — Whether user has dismissed it
- Optional certification-related fields: `certificationName`, `certificationId`, `userCertificationId`, `expirationDate`, `daysUntilExpiration`
- Optional team-related fields: `teamMemberName`, `teamName`, `expiringCount`, `complianceRate`

**Relationships:**
- Notification belongs to a User
- Notification may relate to a UserCertification

## Supporting Types

### TeamMetrics
Team-level metrics for dashboard views, showing coverage percentages, expiring certifications, and gaps.

### CertificationRequirement
Defines which certifications are required or recommended for specific roles within teams.

### ComplianceMetrics
Organization-wide compliance status including overall percentage, trending, and team-by-team breakdown.

### NotificationSettings
User preferences for notification frequency (30/60/90-day intervals), channels (email, in-app, SMS), and additional preferences.

### WorkforcePlanningInsight
Workforce planning data including projected gaps, hiring recommendations, and training priorities for teams.

### ComplianceReport
Generated reports for audit trails, certification status, and compliance summaries with download links.

### PendingVerification
Certifications uploaded by users that are awaiting verification by managers or administrators.

## Relationships Summary

```
User
├── has many → UserCertifications
├── belongs to many → Teams
├── receives many → Notifications
├── performs → AuditLog actions
└── has one → NotificationSettings

Certification
├── belongs to → Vendor
├── has many → UserCertifications
└── referenced in → CertificationRequirements

UserCertification
├── belongs to → User
├── references → Certification
├── generates → Notifications
└── creates → AuditLog entries

Team
├── has many → Users
├── has → TeamMetrics
├── has many → CertificationRequirements
└── has → WorkforcePlanningInsights

Vendor
└── has many → Certifications

AuditLog
├── performed by → User
└── affects → UserCertification, Team, or CertificationRequirement

Notification
├── belongs to → User
└── may relate to → UserCertification
```

## Usage

### Import Types

```typescript
import type {
  User,
  Certification,
  UserCertification,
  Team,
  Vendor,
  AuditLog,
  Notification,
  // Supporting types
  TeamMetrics,
  CertificationRequirement,
  ComplianceMetrics,
  NotificationSettings,
  WorkforcePlanningInsight,
  ComplianceReport,
  PendingVerification,
  // Type aliases
  CertificationStatus,
  NotificationType,
  UserRole,
  CertificationCategory,
} from './types'
```

### Sample Data

Sample data for all entities is available in `sample-data.json`. This data can be used for:
- Development and testing
- UI prototyping
- Example data for documentation
- Seeding development databases

## Notes

- All dates use ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- IDs are strings to support UUIDs or other ID formats
- Nullable fields are marked with `| null` type annotation
- Optional fields use `?:` TypeScript syntax
- Relationships are represented by ID references, not nested objects
