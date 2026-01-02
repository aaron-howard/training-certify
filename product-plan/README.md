# Training-Certify — Export Package

This export package contains everything needed to implement the Training-Certify platform: product specifications, implementation instructions, ready-to-use React components, TypeScript types, sample data, and screenshots.

## What's Included

- **Product Overview** — Product description, problems solved, key features
- **Implementation Instructions** — Step-by-step guides for all 7 milestones
- **Ready-to-Use Prompts** — Copy/paste prompts for AI coding agents
- **React Components** — Props-based, TypeScript-enabled, Tailwind-styled components
- **Type Definitions** — Complete TypeScript interfaces for all entities
- **Sample Data** — Realistic mock data for development and testing
- **Design System** — Color tokens, typography, Tailwind configuration
- **Test Specifications** — User flows and acceptance criteria for each section
- **Screenshots** — Visual reference for all screen designs

## Quick Start

### Option 1: One-Shot Implementation

Use this approach to implement the entire platform in a single coding session:

1. Open `prompts/one-shot-prompt.md`
2. Copy the entire prompt
3. Paste into your AI coding agent (Claude Code, Cursor, etc.)
4. Follow the conversation to implement all milestones

The prompt guides the agent to:

- Ask clarifying questions about your tech stack
- Set up the project foundation
- Implement all components in sequence
- Connect routing and state management
- Test all functionality

### Option 2: Incremental Implementation

Use this approach to implement milestone-by-milestone:

1. Read `product-overview.md` for context
2. Start with `instructions/incremental/01-foundation.md`
3. Copy components from the corresponding section directories
4. Follow the step-by-step instructions
5. Proceed to the next milestone when complete

Each milestone includes:

- Objectives and overview
- Step-by-step tasks
- Code examples
- Deliverables checklist
- Acceptance criteria

### Option 3: Section-by-Section with AI

Use this approach for guided implementation with an AI agent:

1. Open `prompts/section-prompt.md`
2. Copy the template and replace `[SECTION_NAME]` with your target section
3. Paste into your AI coding agent
4. Follow the conversation to implement that section

Repeat for each section as needed.

## Directory Structure

```
product-plan/
├── README.md                          # This file
├── product-overview.md                # Product summary
│
├── prompts/                           # Ready-to-use AI prompts
│   ├── one-shot-prompt.md             # Full implementation prompt
│   └── section-prompt.md              # Template for section implementation
│
├── instructions/                      # Implementation guides
│   ├── one-shot-instructions.md       # Combined guide for all milestones
│   └── incremental/                   # Milestone-by-milestone guides
│       ├── 01-foundation.md
│       ├── 02-shell.md
│       ├── 03-certification-management.md
│       ├── 04-team-and-workforce-management.md
│       ├── 05-compliance-and-audit.md
│       ├── 06-certification-catalog.md
│       └── 07-notifications-and-alerts.md
│
├── design-system/                     # Design tokens
│   ├── tokens.css                     # CSS custom properties
│   ├── tailwind-colors.md             # Tailwind color mappings
│   └── fonts.md                       # Typography guide
│
├── data-model/                        # Global data model
│   ├── README.md                      # Entity descriptions
│   ├── types.ts                       # TypeScript interfaces
│   └── sample-data.json               # Mock data for all entities
│
├── shell/                             # Application shell
│   ├── README.md                      # Shell specification
│   ├── shell-preview.png              # Screenshot
│   └── components/                    # Shell components
│       ├── AppShell.tsx
│       ├── MainNav.tsx
│       ├── UserMenu.tsx
│       └── index.ts
│
└── sections/                          # Feature sections
    ├── certification-management/
    ├── team-and-workforce-management/
    ├── compliance-and-audit/
    ├── certification-catalog/
    └── notifications-and-alerts/
        ├── README.md                  # Section specification
        ├── tests.md                   # Test scenarios
        ├── types.ts                   # Section-specific types
        ├── sample-data.json           # Section sample data
        ├── *.png                      # Screenshots
        └── components/                # React components
            ├── [Component].tsx
            └── index.ts
```

## Implementation Sequence

The platform is organized into 7 milestones:

1. **Foundation** — Project setup, design system, core types
2. **Application Shell** — Navigation, layout, responsive chrome
3. **Certification Management** — Core tracking and lifecycle management
4. **Team & Workforce Management** — Competency dashboard and gap analysis
5. **Compliance & Audit** — Audit trail and regulatory reporting
6. **Certification Catalog** — Vendor directory and discovery
7. **Notifications & Alerts** — Notification center and preferences

## Tech Stack

### Required

- **React** — UI framework (React 18+)
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling (v4)

### Recommended

- **Vite** or **Next.js** — Build tool / framework
- **React Router** or **Next.js Router** — Navigation
- **date-fns** — Date formatting and manipulation
- **lucide-react** — Icon library (already used in components)

### Optional (Not Included)

These are implementation decisions left to you:

- **State Management** — React Context, Redux, Zustand, Jotai, etc.
- **Backend** — REST API, GraphQL, tRPC, Firebase, Supabase, etc.
- **Auth** — NextAuth, Auth0, Clerk, Supabase Auth, custom JWT, etc.
- **Database** — PostgreSQL, MySQL, MongoDB, Prisma, etc.
- **Testing** — Vitest, Jest, React Testing Library, Playwright, Cypress
- **Forms** — React Hook Form, Formik, or native React state
- **File Upload** — Custom implementation or service (AWS S3, Cloudinary, etc.)

## Design System

- **Primary Color**: Blue (`blue-500`, `blue-600`, `blue-700`)
- **Secondary Color**: Emerald (`emerald-500`, `emerald-600`)
- **Neutral Color**: Slate (`slate-50` through `slate-900`)
- **Heading Font**: Inter (Google Fonts)
- **Body Font**: Inter (Google Fonts)
- **Mono Font**: JetBrains Mono (Google Fonts)
- **Dark Mode**: Supported with `dark:` variants throughout

## Component Architecture

All components follow these principles:

- **Props-Based**: Components accept data via props, never import data directly
- **TypeScript**: Fully typed props and state
- **Responsive**: Mobile-first with Tailwind responsive utilities
- **Accessible**: Semantic HTML and ARIA attributes where needed
- **Dark Mode**: Complete support with `dark:` variants
- **Framework-Agnostic**: Can be integrated into any React project

## Import Path Updates

The exported components use placeholder import paths like:

```typescript
import type { User } from '@/../product/data-model/types'
```

You'll need to update these to match your project structure:

```typescript
import type { User } from '@/types'
// or
import type { User } from '../types'
```

See individual milestone instructions for specific guidance.

## Getting Help

- **Product Context**: Read `product-overview.md`
- **Data Model**: Review `data-model/README.md`
- **Design Tokens**: Check `design-system/` files
- **Component Usage**: See section `README.md` files
- **Testing**: Review section `tests.md` files
- **Visual Reference**: Check `.png` screenshots

## Next Steps

1. Choose your implementation approach (one-shot, incremental, or section-by-section)
2. Review `product-overview.md` for product context
3. Start with Milestone 1 (Foundation) or use a ready-to-use prompt
4. Copy components as you progress through milestones
5. Update import paths to match your project structure
6. Test each milestone before proceeding to the next
7. Integrate with backend once frontend is complete

## License

This export package is intended for implementation of the Training-Certify platform. All components, types, and documentation are provided as-is for development purposes.
