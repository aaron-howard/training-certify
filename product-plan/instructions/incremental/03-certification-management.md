# Milestone 3: Certification Management

## Objective

Implement the Certification Management section, enabling users to track personal certifications with upload, status monitoring, search/filter, and lifecycle management.

## Overview

This section provides a table view of user certifications with:

- Status badges (active, expiring soon, expired)
- Expiration countdown timers
- Search and filter capabilities
- Add/edit/delete actions via modal forms
- Document upload for certification proof

## Tasks

### 1. Review Section Specification

Read `sections/certification-management/spec.md` and `sections/certification-management/README.md` to understand the requirements and user flows.

### 2. Review Sample Data and Types

- Check `sections/certification-management/sample-data.json` for example data structure
- Review `sections/certification-management/types.ts` for TypeScript interfaces

### 3. Implement Components

Copy the component from `sections/certification-management/components/` into your project:

- `CertificationTable.tsx` — Main table view with search, filters, and actions

Place in `src/components/certification-management/` or similar.

### 4. Update Import Paths

Update imports to reference your global data model:

```typescript
// Change this:
import type { UserCertification } from '@/../product/data-model/types'

// To this:
import type { UserCertification } from '@/types'
```

### 5. Wire Up to Routing

Add the component to your application routing:

```typescript
import { CertificationTable } from './components/certification-management/CertificationTable'

// In your routes:
<Route
  path="/certification-management"
  element={
    <CertificationTable
      certifications={mockCertifications}
      onAddCertification={(cert) => console.log('Add:', cert)}
      onEditCertification={(id, updates) => console.log('Edit:', id, updates)}
      onDeleteCertification={(id) => console.log('Delete:', id)}
    />
  }
/>
```

### 6. Implement State Management

The component is currently props-based. Wire up actual state management:

- Use React state (`useState`) for local state
- Use Context API, Redux, Zustand, or another solution for global state
- Connect to your backend API for persistence

Example with `useState`:

```typescript
function CertificationManagementPage() {
  const [certifications, setCertifications] = useState<UserCertification[]>(mockData)

  const handleAdd = (cert: UserCertification) => {
    setCertifications(prev => [...prev, cert])
  }

  const handleEdit = (id: string, updates: Partial<UserCertification>) => {
    setCertifications(prev =>
      prev.map(cert => cert.id === id ? { ...cert, ...updates } : cert)
    )
  }

  const handleDelete = (id: string) => {
    setCertifications(prev => prev.filter(cert => cert.id !== id))
  }

  return (
    <CertificationTable
      certifications={certifications}
      onAddCertification={handleAdd}
      onEditCertification={handleEdit}
      onDeleteCertification={handleDelete}
    />
  )
}
```

### 7. Implement File Upload (If Not Included)

If the component doesn't include file upload, add it to the add/edit modal:

```typescript
<input
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Handle file upload
      // You might upload to a server or convert to base64
    }
  }}
/>
```

### 8. Run Tests

Review `sections/certification-management/tests.md` for test scenarios. Manually test all user flows:

- Add a certification
- Edit an existing certification
- Delete a certification
- Search for certifications
- Filter by status (active, expiring, expired)
- Sort by expiration date

## Deliverables

- ✅ CertificationTable component integrated
- ✅ Add/edit/delete functionality working
- ✅ Search and filter working
- ✅ Status badges displaying correctly
- ✅ File upload functional (if applicable)

## Acceptance Criteria

- [ ] Table displays all certifications with correct data
- [ ] Status badges show correct colors (green/yellow/red)
- [ ] Expiration countdown shows days remaining
- [ ] Search filters certifications by name or vendor
- [ ] Filter dropdown shows only active, expiring, or expired certs
- [ ] Add button opens modal with form
- [ ] Edit button opens modal with existing data pre-filled
- [ ] Delete button shows confirmation and removes certification
- [ ] Table is responsive on mobile (cards or stacked rows)

## Next Steps

Proceed to Milestone 4: Team & Workforce Management.
