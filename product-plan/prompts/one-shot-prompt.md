# Prompt: Implement Training-Certify Platform (Complete)

I have a complete export package for implementing Training-Certify, an enterprise certification tracking and compliance management platform. The package includes product specifications, React components, TypeScript types, sample data, and implementation instructions.

## Product Overview

Training-Certify helps organizations manage professional certifications across their workforce with:

- **Certification Management** — Track personal certifications with automated renewal reminders
- **Team & Workforce Management** — Competency dashboards and gap analysis for managers
- **Compliance & Audit** — Complete audit trails for regulatory requirements
- **Certification Catalog** — Vendor directory (AWS, Azure, (ISC)², CompTIA, etc.)
- **Notifications & Alerts** — Configurable notification preferences and delivery

The platform uses React + TypeScript + Tailwind CSS with a mobile-responsive design and full light/dark mode support.

## What I Need

Please implement the complete Training-Certify platform following the 7-milestone sequence:

1. **Foundation** — Project setup, design system, core types
2. **Application Shell** — Navigation and layout
3. **Certification Management** — Core tracking features
4. **Team & Workforce Management** — Competency dashboard
5. **Compliance & Audit** — Audit trail and reporting
6. **Certification Catalog** — Certification directory
7. **Notifications & Alerts** — Notification center

## Before You Start

Please ask me clarifying questions about:

1. **Project Setup**
   - Which build tool should we use? (Vite, Next.js, Create React App, other)
   - Do you want me to initialize the project, or do you have an existing one?

2. **Routing**
   - Which routing solution? (React Router, Next.js Router, other)
   - Should routes use `/certification-management` or shortened paths like `/certs`?

3. **State Management**
   - How should we manage state? (React Context, Redux, Zustand, local state only, other)
   - Should components connect to a backend API, or use local state with mock data for now?

4. **Authentication**
   - Should we implement authentication? If yes, which approach? (NextAuth, Auth0, Clerk, custom JWT, mock auth)
   - If not, should we use a hardcoded mock user?

5. **Backend Integration**
   - Do you have a backend API ready, or should we use mock data for development?
   - If using an API, what's the base URL and auth approach?

6. **Testing**
   - Should I write tests? If yes, which framework? (Vitest, Jest, React Testing Library)

7. **File Upload**
   - For certification document uploads, should I implement actual file handling or just UI placeholders?

## Available Resources

I have access to:

- `product-overview.md` — Product description and features
- `instructions/one-shot-instructions.md` — Complete implementation guide
- `instructions/incremental/01-07-*.md` — Milestone-specific guides
- `data-model/types.ts` — TypeScript interfaces for all entities
- `data-model/sample-data.json` — Mock data for development
- `design-system/` — Color tokens, typography, Tailwind config
- `shell/components/` — AppShell, MainNav, UserMenu components
- `sections/[section-name]/components/` — All section components
- `sections/[section-name]/types.ts` — Section-specific types
- `sections/[section-name]/sample-data.json` — Section mock data
- `sections/[section-name]/tests.md` — Test specifications
- `sections/[section-name]/*.png` — Screenshots for visual reference

## Implementation Approach

Once you've answered my questions:

1. Set up the project with the chosen build tool
2. Configure Tailwind CSS and design tokens (Blue/Emerald/Slate palette, Inter/JetBrains Mono fonts)
3. Copy types from `data-model/types.ts`
4. Implement the Application Shell (navigation, layout, responsive behavior)
5. Implement each section in sequence, copying components and updating import paths
6. Wire up routing and state management
7. Test all functionality
8. Provide a summary of what's complete and next steps

## Expected Outcome

A fully functional Training-Certify platform with:

- ✅ All 5 sections implemented and working
- ✅ Navigation between sections
- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Light and dark mode support
- ✅ Search and filter functionality
- ✅ Interactive forms and actions
- ✅ TypeScript type safety throughout
- ✅ Tailwind CSS styling matching the design system

## Let's Begin

Please start by asking me the clarifying questions above, then proceed with the implementation once you have the answers.
