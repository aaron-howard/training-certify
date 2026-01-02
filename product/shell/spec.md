# Application Shell Specification

## Overview

The Training-Certify application shell provides a sidebar navigation pattern optimized for enterprise dashboard usage. The shell features a fixed left sidebar with section navigation, a top bar with branding and user menu, and a responsive layout that adapts gracefully to mobile devices.

## Navigation Structure

- **Certification Management** → Core certification tracking and lifecycle management
- **Team & Workforce Management** → Manager and executive views for team oversight
- **Compliance & Audit** → Enterprise audit trail and auditor-specific views
- **Certification Catalog** → Vendor certification directory and metadata
- **Notifications & Alerts** → Automated renewal reminder engine

## User Menu

The user menu appears in the top-right corner of the application, accessible via a user avatar and name. Clicking opens a dropdown menu with the following options:

- Profile / Account
- Help / Documentation
- Settings
- Logout

## Layout Pattern

**Sidebar Navigation** — A fixed vertical sidebar on the left side of the screen provides persistent access to all main sections. The content area fills the remaining horizontal space to the right of the sidebar.

**Dimensions:**

- Sidebar width: 240px (desktop/tablet)
- Top bar height: 64px
- Content area: Flexible, fills remaining space

## Responsive Behavior

- **Desktop (≥1024px):** Fixed sidebar on left, content area on right. User menu in top-right corner.
- **Tablet (768px-1023px):** Same as desktop layout.
- **Mobile (<768px):** Sidebar collapses to hamburger menu icon in top-left. Tapping opens an overlay with navigation. User menu remains in top-right. Content area uses full width.

## Design Notes

- The sidebar uses the product's primary color (blue) for active navigation items
- Icons accompany each navigation label for quick visual identification
- The shell maintains a clean, professional aesthetic appropriate for enterprise compliance software
- Light and dark mode support ensures usability in all environments
- The top bar includes the Training-Certify logo/wordmark on the left side
