# Milestone 2: Application Shell

## Objective

Implement the application shell with sidebar navigation, top bar with branding and user menu, and responsive layout. The shell provides the persistent chrome that wraps all section content.

## Overview

The shell uses a sidebar navigation pattern with:

- Fixed left sidebar (240px wide) with section links
- Top bar (64px tall) with logo and user menu
- Responsive behavior: sidebar collapses to hamburger menu on mobile (<768px)
- Content area fills remaining space

## Tasks

### 1. Review Shell Specification

Read `shell/spec.md` to understand the navigation structure, layout pattern, and responsive behavior.

### 2. Implement Shell Components

Copy the shell components from `shell/components/` into your project:

- `AppShell.tsx` — Main layout container with sidebar and content area
- `MainNav.tsx` — Sidebar navigation with section links
- `UserMenu.tsx` — User avatar and dropdown menu

Place these in `src/components/shell/` or `src/layout/`.

### 3. Update Import Paths

The components reference the global data model. Update imports to match your project structure:

```typescript
// Change this:
import type { User } from '@/../product/data-model/types'

// To this:
import type { User } from '@/types'
// or
import type { User } from '../types'
```

### 4. Set Up Routing

The shell navigation links to different sections. Set up your routing solution (React Router, Next.js App Router, etc.):

```typescript
// Example with React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/shell/AppShell'

function App() {
  return (
    <BrowserRouter>
      <AppShell user={mockUser}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/certification-management" element={<CertificationManagement />} />
          <Route path="/team-workforce" element={<TeamWorkforce />} />
          {/* Add routes for other sections */}
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
```

### 5. Test Responsive Behavior

- **Desktop (≥1024px)**: Sidebar should be visible on left, content on right
- **Tablet (768-1023px)**: Same as desktop
- **Mobile (<768px)**: Sidebar should collapse to hamburger menu; clicking opens overlay

Test by resizing your browser window or using responsive design mode.

### 6. Test Light and Dark Mode

The shell should support both light and dark modes. Add a theme toggle to verify:

```typescript
// Example theme toggle
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <button onClick={() => setIsDark(!isDark)}>
      Toggle Theme
    </button>
  )
}
```

## Deliverables

- ✅ Shell components implemented (AppShell, MainNav, UserMenu)
- ✅ Routing configured for section navigation
- ✅ Responsive layout working on mobile, tablet, desktop
- ✅ Light and dark modes both functional
- ✅ User menu dropdown working

## Acceptance Criteria

- [ ] Sidebar navigation displays all 5 sections
- [ ] Clicking navigation links changes the route/view
- [ ] User menu opens when clicked and shows Profile, Settings, Help, Logout
- [ ] On mobile, sidebar collapses to hamburger menu
- [ ] Layout looks correct in both light and dark modes

## Next Steps

Proceed to Milestone 3: Certification Management to implement the first feature section.
