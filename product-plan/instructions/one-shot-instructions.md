# Training-Certify — Complete Implementation Guide

This document provides comprehensive instructions for implementing the entire Training-Certify platform in a single development session.

## Overview

Training-Certify is an enterprise certification tracking and compliance management platform with 5 main sections:

1. **Certification Management** — Individual certification tracking and lifecycle management
2. **Team & Workforce Management** — Manager views for competency analysis and gap identification
3. **Compliance & Audit** — Audit trails and regulatory reporting
4. **Certification Catalog** — Vendor certification directory
5. **Notifications & Alerts** — Automated renewal reminders and alert preferences

## Implementation Sequence

Follow these milestones in order:

1. Foundation — Project setup and design system
2. Application Shell — Navigation and layout
3. Certification Management
4. Team & Workforce Management
5. Compliance & Audit
6. Certification Catalog
7. Notifications & Alerts

---

# Milestone 1: Foundation

## Project Setup

Initialize a new React + TypeScript project:

```bash
# Using Vite (recommended)
npm create vite@latest training-certify -- --template react-ts
cd training-certify
npm install

# Install dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install date-fns lucide-react
```

## Configure Tailwind CSS

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Set Up Design Tokens

Import fonts in HTML:

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
/* src/index.css */
body {
  font-family: 'Inter', sans-serif;
}

code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

Design System:
- **Colors**: Blue (primary), Emerald (secondary), Slate (neutral)
- **Typography**: Inter (headings/body), JetBrains Mono (monospaced)

## Create Global Data Model Types

Copy `data-model/types.ts` into your project at `src/types/` or `src/lib/types.ts`.

---

# Milestone 2: Application Shell

## Components

Copy shell components from `shell/components/`:
- `AppShell.tsx` — Main layout container
- `MainNav.tsx` — Sidebar navigation
- `UserMenu.tsx` — User menu dropdown

Update import paths to reference your types location:

```typescript
// Change this:
import type { User } from '@/../product/data-model/types'

// To this:
import type { User } from '@/types'
```

## Set Up Routing

Example with React Router:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/shell/AppShell'

function App() {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'User'
  }

  return (
    <BrowserRouter>
      <AppShell user={mockUser}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/certification-management" element={<div>Cert Management</div>} />
          <Route path="/team-workforce" element={<div>Team Workforce</div>} />
          <Route path="/compliance-audit" element={<div>Compliance</div>} />
          <Route path="/catalog" element={<div>Catalog</div>} />
          <Route path="/notifications" element={<div>Notifications</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
```

---

# Milestone 3: Certification Management

## Components

Copy from `sections/certification-management/components/`:
- `CertificationTable.tsx`

Update imports:

```typescript
import type { UserCertification } from '@/types'
```

## Wire to Routing

```typescript
import { CertificationTable } from './components/certification-management/CertificationTable'
import mockData from './data/certification-management-data.json'

<Route
  path="/certification-management"
  element={<CertificationManagementPage />}
/>

function CertificationManagementPage() {
  const [certifications, setCertifications] = useState<UserCertification[]>(mockData)

  const handleAdd = (cert: UserCertification) => {
    setCertifications(prev => [...prev, { ...cert, id: crypto.randomUUID() }])
  }

  const handleEdit = (id: string, updates: Partial<UserCertification>) => {
    setCertifications(prev =>
      prev.map(cert => cert.id === id ? { ...cert, ...updates } : cert)
    )
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this certification?')) {
      setCertifications(prev => prev.filter(cert => cert.id !== id))
    }
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

---

# Milestone 4: Team & Workforce Management

## Components

Copy from `sections/team-and-workforce-management/components/`:
- `CompetencyDashboard.tsx`
- `CoverageMetrics.tsx`
- `TeamComparisonChart.tsx`
- `GapAnalysisHeatmap.tsx`

Update imports and wire to routing:

```typescript
import { CompetencyDashboard } from './components/team-workforce/CompetencyDashboard'
import mockData from './data/team-workforce-data.json'

<Route
  path="/team-workforce"
  element={<TeamWorkforcePage />}
/>

function TeamWorkforcePage() {
  const [data] = useState(mockData)

  return (
    <CompetencyDashboard
      teams={data.teams}
      certifications={data.certifications}
      coverageData={data.coverageData}
      gapAnalysis={data.gapAnalysis}
      onDrillDown={(teamId) => console.log('Drill down:', teamId)}
    />
  )
}
```

---

# Milestone 5: Compliance & Audit

## Components

Copy from `sections/compliance-and-audit/components/`:
- `ComplianceDashboard.tsx`
- `ComplianceMetrics.tsx`
- `RecentActivity.tsx`
- `UpcomingDeadlines.tsx`
- `AuditTrail.tsx`
- `AuditLogFilters.tsx`
- `ReportGenerator.tsx`

Update imports and wire to routing:

```typescript
import { ComplianceDashboard } from './components/compliance/ComplianceDashboard'
import mockData from './data/compliance-data.json'

<Route
  path="/compliance-audit"
  element={<CompliancePage />}
/>

function CompliancePage() {
  const [data] = useState(mockData)
  const [showAuditTrail, setShowAuditTrail] = useState(false)

  if (showAuditTrail) {
    return (
      <AuditTrail
        logs={data.auditLogs}
        onBack={() => setShowAuditTrail(false)}
      />
    )
  }

  return (
    <ComplianceDashboard
      metrics={data.metrics}
      recentActivity={data.recentActivity}
      upcomingDeadlines={data.upcomingDeadlines}
      onViewAuditTrail={() => setShowAuditTrail(true)}
    />
  )
}
```

---

# Milestone 6: Certification Catalog

## Components

Copy from `sections/certification-catalog/components/`:
- `CertificationBrowse.tsx`
- `CertificationCard.tsx`
- `FilterPanel.tsx`
- `CertificationDetail.tsx`

Update imports and wire to routing:

```typescript
import { CertificationBrowse } from './components/catalog/CertificationBrowse'
import { CertificationDetail } from './components/catalog/CertificationDetail'
import mockData from './data/catalog-data.json'

<Route path="/catalog" element={<CatalogBrowsePage />} />
<Route path="/catalog/:id" element={<CatalogDetailPage />} />

function CatalogBrowsePage() {
  const navigate = useNavigate()
  const [data] = useState(mockData)

  return (
    <CertificationBrowse
      certifications={data.certifications}
      vendors={data.vendors}
      onViewDetails={(id) => navigate(`/catalog/${id}`)}
      onAddToProfile={(id) => console.log('Add to profile:', id)}
      onMarkAsGoal={(id) => console.log('Mark as goal:', id)}
      onViewHolders={(id) => console.log('View holders:', id)}
    />
  )
}

function CatalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const certification = mockData.certifications.find(c => c.id === id)

  if (!certification) return <div>Not found</div>

  return (
    <CertificationDetail
      certification={certification}
      onBack={() => navigate('/catalog')}
      onAddToProfile={(id) => console.log('Add:', id)}
      onMarkAsGoal={(id) => console.log('Goal:', id)}
      onViewHolders={(id) => console.log('Holders:', id)}
    />
  )
}
```

---

# Milestone 7: Notifications & Alerts

## Components

Copy from `sections/notifications-and-alerts/components/`:
- `NotificationsDashboard.tsx`
- `NotificationCard.tsx`
- `NotificationSettings.tsx`

Update imports and wire to routing:

```typescript
import { NotificationsDashboard } from './components/notifications/NotificationsDashboard'
import mockData from './data/notifications-data.json'

<Route path="/notifications" element={<NotificationsPage />} />

function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockData.notifications)
  const [settings, setSettings] = useState(mockData.notificationSettings)

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const handleMarkAsUnread = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    )
  }

  const handleDismiss = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isDismissed: true } : n)
    )
  }

  return (
    <NotificationsDashboard
      notifications={notifications}
      settings={settings}
      onMarkAsRead={handleMarkAsRead}
      onMarkAsUnread={handleMarkAsUnread}
      onDismiss={handleDismiss}
      onUpdateFrequency={(freq) => setSettings(prev => ({ ...prev, frequency: freq }))}
      onUpdateChannels={(channels) => setSettings(prev => ({ ...prev, channels }))}
      onUpdatePreferences={(prefs) => setSettings(prev => ({ ...prev, preferences: prefs }))}
    />
  )
}
```

---

# Final Steps

## Add Theme Toggle

```typescript
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

## Testing Checklist

- [ ] All 5 sections render without errors
- [ ] Navigation works between sections
- [ ] Light and dark mode both work
- [ ] Responsive layout works on mobile
- [ ] All interactive features functional
- [ ] Search and filter capabilities work
- [ ] Forms submit correctly
- [ ] Data displays correctly in all components

## Backend Integration (Next Phase)

Once the frontend is complete, integrate with a backend:

1. Set up API endpoints for CRUD operations
2. Implement authentication (JWT, OAuth, etc.)
3. Connect components to real data sources
4. Add error handling and loading states
5. Implement file upload for certifications
6. Set up notification delivery system

## Deployment

1. Build for production: `npm run build`
2. Deploy to hosting platform (Vercel, Netlify, AWS, etc.)
3. Configure environment variables
4. Set up CI/CD pipeline
5. Monitor performance and errors

---

## Support

For questions or issues:
- Review section-specific test files in `sections/[section-name]/tests.md`
- Check component screenshots in `sections/[section-name]/*.png`
- Refer to `product-overview.md` for product context
- Review `data-model/README.md` for entity relationships
