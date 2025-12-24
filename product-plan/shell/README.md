# Application Shell

The Training-Certify application shell provides the persistent navigation and layout that wraps all section content.

## Overview

The shell uses a sidebar navigation pattern optimized for enterprise dashboard usage:

- **Fixed left sidebar** (240px wide) with section links
- **Top bar** (64px tall) with branding and user menu
- **Responsive layout** that adapts to mobile, tablet, and desktop
- **Dark mode support** throughout

## Components

### AppShell.tsx

Main layout container that provides the overall shell structure.

**Props:**
- `user` — Current logged-in user
- `children` — Section content to display

**Features:**
- Manages mobile navigation state (hamburger menu)
- Provides responsive layout grid
- Wraps content with MainNav and UserMenu

### MainNav.tsx

Sidebar navigation with links to all main sections.

**Props:**
- `items` — Navigation items (label, path, icon)
- `currentPath` — Active route for highlighting
- `onNavigate` — Navigation callback

**Features:**
- Displays all 5 main sections
- Highlights active section with primary color
- Shows icons alongside labels
- Responsive: collapses to overlay on mobile

### UserMenu.tsx

User avatar and dropdown menu in the top-right corner.

**Props:**
- `user` — Current user (name, email, avatar)
- `onProfileClick` — Navigate to profile
- `onSettingsClick` — Navigate to settings
- `onHelpClick` — Navigate to help
- `onLogoutClick` — Handle logout

**Features:**
- Displays user avatar and name
- Dropdown menu with Profile, Settings, Help, Logout
- Keyboard accessible
- Dark mode support

## Navigation Structure

1. **Certification Management** → Core certification tracking
2. **Team & Workforce Management** → Manager and executive views
3. **Compliance & Audit** → Audit trail and reporting
4. **Certification Catalog** → Vendor directory
5. **Notifications & Alerts** → Notification center

## Layout Pattern

```
┌─────────────────────────────────────────────────┐
│ Top Bar (64px)                                  │
│ [Logo]                            [User Menu]   │
├─────────────┬───────────────────────────────────┤
│             │                                   │
│  Sidebar    │  Content Area                     │
│  (240px)    │  (Flexible width)                 │
│             │                                   │
│  Nav Links  │  [Section content renders here]   │
│             │                                   │
│             │                                   │
└─────────────┴───────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥1024px)
- Fixed sidebar on left
- Content area on right
- User menu in top-right

### Tablet (768px-1023px)
- Same as desktop

### Mobile (<768px)
- Sidebar collapses to hamburger menu
- Tapping opens sidebar overlay
- Content uses full width
- User menu remains in top-right

## Styling

The shell uses the product's design tokens:

- **Active nav items**: Blue primary color
- **Hover states**: Subtle slate background
- **Borders**: Light slate in light mode, dark slate in dark mode
- **Typography**: Inter font throughout

## Implementation

### Update Import Paths

When integrating into your project, update imports:

```typescript
// Change this:
import type { User } from '@/../product/data-model/types'

// To this:
import type { User } from '@/types'
```

### Wire Up Routing

The shell works with any routing solution:

```typescript
// React Router example
import { useNavigate, useLocation } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AppShell user={currentUser}>
      <Routes>
        <Route path="/certification-management" element={<CertificationManagement />} />
        <Route path="/team-workforce" element={<TeamWorkforce />} />
        {/* ... other routes */}
      </Routes>
    </AppShell>
  )
}
```

### Dark Mode

Enable dark mode by adding the `dark` class to the HTML element:

```typescript
// Toggle function
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark')
}
```

## Screenshots

See `shell-preview.png` for a visual reference of the shell layout.
