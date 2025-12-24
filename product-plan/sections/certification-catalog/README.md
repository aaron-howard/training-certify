# Certification Catalog

The Certification Catalog is a comprehensive directory of vendor certifications (AWS, Azure, Google Cloud, (ISC)², CompTIA, ITIL, etc.) that enables employees, managers, and administrators to discover, research, and track certifications.

## Overview

This section provides two main views:

1. **Browse Page** — Searchable/filterable grid of all certifications
2. **Detail Page** — Full information about a specific certification

## User Flows

- Browse all certifications in a grid or list view
- Search for certifications by name or keyword
- Filter by vendor, category, or difficulty level
- Click a certification to view its full detail page
- Add a certification to their profile for tracking
- Mark a certification as interested/goal for future pursuit
- View which team members currently hold a specific certification

## Components

### CertificationBrowse.tsx

Main browse page with search, filters, and certification grid.

**Props:**
- `certifications` — Array of certification objects
- `vendors` — Optional array of vendors for filtering
- `onViewDetails` — Callback when clicking a certification
- `onAddToProfile` — Callback to add cert to user's profile
- `onMarkAsGoal` — Callback to mark cert as a goal
- `onViewHolders` — Callback to see who holds this cert
- `onSearch` — Callback when search term changes
- `onFilter` — Callback when filters change

**Features:**
- Search bar for keyword search
- Filter panel (vendor, category, difficulty)
- Responsive grid layout
- Certification cards with quick actions

### CertificationCard.tsx

Individual certification card displayed in the browse grid.

**Props:**
- `certification` — Certification object
- `onViewDetails` — Callback for viewing details
- `onAddToProfile` — Callback to add to profile
- `onMarkAsGoal` — Callback to mark as goal
- `onViewHolders` — Callback to view holders

**Features:**
- Displays name, vendor, category, difficulty
- Shows validity period
- Quick action buttons
- Hover effects

### FilterPanel.tsx

Filter controls for browse page.

**Props:**
- `vendors` — List of available vendors
- `categories` — List of categories
- `selectedVendor` — Currently selected vendor
- `selectedCategory` — Currently selected category
- `selectedDifficulty` — Currently selected difficulty
- `onFilterChange` — Callback when filters change

**Features:**
- Vendor dropdown/checkboxes
- Category filter
- Difficulty level filter
- Clear filters option

### CertificationDetail.tsx

Full detail page for a certification.

**Props:**
- `certification` — Full certification object
- `onBack` — Callback to return to browse
- `onAddToProfile` — Callback to add to profile
- `onMarkAsGoal` — Callback to mark as goal
- `onViewHolders` — Callback to view holders

**Features:**
- Full description and overview
- Prerequisites (required and recommended)
- Exam information (format, duration, cost, passing score)
- Renewal/recertification requirements
- Action buttons (add to profile, mark as goal, view holders)
- Intended audience display
- Responsive layout

## Data Structure

### Certification

```typescript
interface Certification {
  id: string
  name: string
  vendorId: string
  vendorName: string
  vendorLogo: string
  category: 'Cloud' | 'Security' | 'Networking' | 'Data' | 'Project Management'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  validityPeriod: string
  intendedAudience: string[]
  description: string
  prerequisites: {
    required: string[]
    recommended: string[]
  }
  examInfo: {
    format: string
    duration: string
    numberOfQuestions: string
    passingScore: string
    cost: string
  }
  renewalRequirements: {
    cycle: string
    options: string[]
  }
  holderCount: number
}
```

### Vendor

```typescript
interface Vendor {
  id: string
  name: string
  logo: string
  certificationCount: number
}
```

## Implementation Notes

### Import Path Updates

Update imports to reference your project's type location:

```typescript
// Change from:
import type { Certification } from '@/../product/sections/certification-catalog/types'

// To:
import type { Certification } from '@/types'
// or wherever you place the global types
```

### Routing Integration

The catalog requires two routes:

```typescript
// Browse page
<Route path="/catalog" element={<CertificationBrowse ... />} />

// Detail page
<Route path="/catalog/:id" element={<CertificationDetail ... />} />
```

### State Management

The components are props-based. Wire up state management:

```typescript
const [certifications, setCertifications] = useState<Certification[]>(mockData)
const [searchTerm, setSearchTerm] = useState('')
const [filters, setFilters] = useState({})

const filteredCerts = certifications.filter(cert => {
  // Apply search and filter logic
})
```

### Action Handlers

Implement the callback functions:

```typescript
const handleAddToProfile = (certId: string) => {
  // Create a UserCertification record
  // Navigate to Certification Management or show success
}

const handleMarkAsGoal = (certId: string) => {
  // Save as user goal
  // Show confirmation
}

const handleViewHolders = (certId: string) => {
  // Navigate to team view or show modal
  // Display users who hold this certification
}
```

## Testing

See `tests.md` for comprehensive test scenarios including:
- Browse and search functionality
- Filter combinations
- Detail page navigation
- Add to profile action
- Mark as goal action
- View holders action
- Responsive layout
- Empty states
- Error handling

## Screenshots

- `certification-browse.png` — Browse page with search and filters
- `certification-detail.png` — Detail page with full certification information

## Out of Scope

- Admin catalog management (adding/editing certifications)
- Purchasing or registration workflows
- Integration with vendor APIs
- Certification recommendations based on role
