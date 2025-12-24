# Certification Management

Core certification tracking and lifecycle management for individual users.

## Overview

Table view of user certifications with status monitoring, search/filter, and add/edit/delete actions via modal forms.

## Components

- `CertificationTable.tsx` — Main table with all functionality

## Key Features

- Status badges (active, expiring soon, expired) with color coding
- Expiration countdown timers
- Search by name or vendor
- Filter by status
- Sort by expiration date
- Add/edit/delete via modal forms
- Document upload for certification proof
- Responsive: table on desktop, cards on mobile

## Data Types

See `types.ts` for complete TypeScript interfaces including:
- `UserCertification` — User's certification record
- `CertificationFormData` — Form data for add/edit
- `CertificationManagementProps` — Component props

## Sample Data

See `sample-data.json` for example certifications with various statuses and expiration dates.

## Screenshots

- `certification-table.png` — Table view with all features

## Tests

See `tests.md` for comprehensive test scenarios.
