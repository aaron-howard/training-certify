# Milestone 6: Certification Catalog

## Objective

Implement the Certification Catalog section, enabling users to discover, research, and track vendor certifications from AWS, Azure, Google Cloud, (ISC)², CompTIA, ITIL, and other providers.

## Overview

This section provides:

- Browse page with searchable/filterable certification grid
- Certification detail page with full metadata
- Actions: add to profile, mark as goal, view holders

## Tasks

### 1. Review Section Specification

Read `sections/certification-catalog/spec.md` and `sections/certification-catalog/README.md` to understand requirements.

### 2. Review Sample Data and Types

- Check `sections/certification-catalog/sample-data.json` for example data
- Review `sections/certification-catalog/types.ts` for interfaces

### 3. Implement Components

Copy the components from `sections/certification-catalog/components/`:

- `CertificationBrowse.tsx` — Main browse page with search and filters
- `CertificationCard.tsx` — Individual certification cards
- `FilterPanel.tsx` — Filter controls (vendor, category, difficulty)
- `CertificationDetail.tsx` — Detail page with full information

Place in `src/components/certification-catalog/` or similar.

### 4. Update Import Paths

Update imports to reference your global data model:

```typescript
import type { Certification, Vendor } from '@/types'
```

### 5. Wire Up to Routing

Add both browse and detail routes:

```typescript
import { CertificationBrowse } from './components/catalog/CertificationBrowse'
import { CertificationDetail } from './components/catalog/CertificationDetail'

<Route path="/catalog" element={
  <CertificationBrowse
    certifications={mockCertifications}
    vendors={mockVendors}
    onViewDetails={(id) => navigate(`/catalog/${id}`)}
  />
} />

<Route path="/catalog/:id" element={
  <CertificationDetail
    certification={getCertificationById(id)}
    onBack={() => navigate('/catalog')}
  />
} />
```

### 6. Implement Search and Filtering

Add search and filter logic:

```typescript
const [searchTerm, setSearchTerm] = useState('')
const [filters, setFilters] = useState({
  vendors: [],
  categories: [],
  difficulty: null,
})

const filteredCertifications = certifications.filter((cert) => {
  // Search filter
  if (
    searchTerm &&
    !cert.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) {
    return false
  }

  // Vendor filter
  if (filters.vendors.length > 0 && !filters.vendors.includes(cert.vendorId)) {
    return false
  }

  // Category filter
  if (
    filters.categories.length > 0 &&
    !filters.categories.includes(cert.category)
  ) {
    return false
  }

  // Difficulty filter
  if (filters.difficulty && cert.difficulty !== filters.difficulty) {
    return false
  }

  return true
})
```

### 7. Implement User Actions

Wire up the action callbacks:

```typescript
const handleAddToProfile = (certificationId: string) => {
  // Create a new UserCertification record
  // Navigate to Certification Management or show success message
}

const handleMarkAsGoal = (certificationId: string) => {
  // Save certification as a goal for the user
  // Show confirmation message
}

const handleViewHolders = (certificationId: string) => {
  // Navigate to team view filtered by this certification
  // Or show a modal with team members who hold this cert
}
```

### 8. Run Tests

Review `sections/certification-catalog/tests.md`. Manually test:

- Browse all certifications
- Search for certifications by name
- Filter by vendor, category, difficulty
- View certification detail page
- Add certification to profile
- Mark certification as goal
- View team members who hold a certification
- Responsive layout on mobile/tablet

## Deliverables

- ✅ Browse page implemented with search and filters
- ✅ Detail page showing full certification information
- ✅ Add to profile action working
- ✅ Mark as goal action working
- ✅ View holders action working

## Acceptance Criteria

- [ ] Browse page displays all certifications as cards or grid items
- [ ] Search filters certifications by name or keyword
- [ ] Filter panel filters by vendor, category, and difficulty
- [ ] Clicking a card navigates to detail page
- [ ] Detail page shows description, prerequisites, exam info, renewal requirements
- [ ] Add to Profile button creates a UserCertification
- [ ] Mark as Goal saves the certification as a user goal
- [ ] View Holders shows team members with this certification
- [ ] Layout is responsive on all screen sizes

## Next Steps

Proceed to Milestone 7: Notifications & Alerts.
