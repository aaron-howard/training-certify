# Data Model

## Entities

### User

Individual employees who need certifications tracked; can have roles like User, Manager, Executive, or Auditor to determine their permissions and dashboard views.

### Certification

A specific certification from the catalog with metadata including name, vendor, renewal cycle, intended audience (Developer, Architect, SRE, PM, etc.), prerequisites, and difficulty level.

### UserCertification

A user's acquired certification with expiration date, upload proof, current status, renewal tracking, and verification timestamps.

### Team

Groups of users for competency tracking, workforce management, and gap analysis; users can belong to multiple teams.

### Vendor

Certification issuing bodies such as AWS, Microsoft, (ISC)², ITIL, CompTIA, PMI, GIAC, OffSec, Cisco, and others.

### AuditLog

Timestamped record of all actions including uploads, renewals, assignments, and verifications for compliance tracking and regulatory requirements.

### Notification

Renewal reminders and expiration alerts sent to users at configurable intervals (30/60/90 days) based on certification expiration dates.

## Relationships

- User can belong to multiple Teams
- User has many UserCertifications
- UserCertification belongs to a User and references a Certification
- Certification belongs to a Vendor
- Vendor has many Certifications
- Team has many Users (through membership)
- Notification belongs to a User and relates to a UserCertification
- AuditLog tracks actions on Users, UserCertifications, Teams, and Certifications
