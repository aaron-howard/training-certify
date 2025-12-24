# Prompt: Implement [SECTION_NAME] Section

I have a complete export package for the [SECTION_NAME] section of Training-Certify, including React components, TypeScript types, sample data, specifications, and test instructions.

## Section Overview

[Replace with section description from the README]

## What I Need

Please implement the [SECTION_NAME] section for my Training-Certify application.

## Before You Start

Please ask me clarifying questions about:

1. **Project Context**
   - Do you already have the Application Shell implemented? (If not, we should implement that first)
   - Which routing solution are you using? (React Router, Next.js Router, other)
   - What's your project structure? (Where should I place components?)

2. **State Management**
   - How are you managing state? (React Context, Redux, Zustand, local state)
   - Should this connect to a backend API or use mock data?
   - If using an API, what endpoints should I connect to?

3. **Integration**
   - Are other sections already implemented? (This might affect shared state or navigation)
   - Do you have the global data model types imported? (from `data-model/types.ts`)

## Available Resources

I have access to:

- `sections/[section-name]/README.md` — Section specification
- `sections/[section-name]/types.ts` — TypeScript interfaces
- `sections/[section-name]/sample-data.json` — Mock data
- `sections/[section-name]/tests.md` — Test scenarios
- `sections/[section-name]/components/` — All React components
- `sections/[section-name]/*.png` — Screenshots for visual reference
- `instructions/incremental/0X-[section-name].md` — Step-by-step guide

## Implementation Steps

Once you've answered my questions:

1. Review the section specification and requirements
2. Copy component files into the project (updating import paths as needed)
3. Wire up routing for this section
4. Implement state management (local or global)
5. Connect any necessary callbacks (add, edit, delete, etc.)
6. Test all functionality per the test specifications
7. Verify responsive layout and dark mode support

## Expected Outcome

A fully functional [SECTION_NAME] section with:

- ✅ All components integrated and rendering correctly
- ✅ Routing configured and working
- ✅ State management connected
- ✅ All interactive features functional (search, filter, actions, etc.)
- ✅ Responsive layout on mobile, tablet, desktop
- ✅ Light and dark mode both working
- ✅ TypeScript types correct throughout

## Let's Begin

Please start by asking me the clarifying questions above, then proceed with the implementation once you have the answers.

---

## Example Usage

To use this prompt template:

1. Copy this entire file
2. Replace `[SECTION_NAME]` with one of:
   - Certification Management
   - Team & Workforce Management
   - Compliance & Audit
   - Certification Catalog
   - Notifications & Alerts
3. Replace `[Replace with section description from the README]` with the actual description from that section's README.md
4. Paste into your AI coding agent
5. Answer the clarifying questions
6. Let the agent implement the section

## Section Descriptions (for reference)

### Certification Management
Core certification tracking and lifecycle management for individual users, including upload, renewal reminders, and status tracking with a table view.

### Team & Workforce Management
Manager and executive views for team oversight, competency analysis, gap identification, and workforce planning with dashboards and visualizations.

### Compliance & Audit
Enterprise audit trail, compliance reporting, and auditor-specific views for regulatory and contractual requirements with detailed logging.

### Certification Catalog
Vendor certification directory and metadata covering AWS, Azure, (ISC)², ITIL, and all supported certification bodies with browse and detail views.

### Notifications & Alerts
Automated renewal reminder engine with 30/60/90-day alerts and configurable notification workflows including feed, filters, and settings.
