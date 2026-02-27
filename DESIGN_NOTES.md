# Design notes — Training Certify

Product and UX decisions for Training Certify.

## Product scope

Training Certify manages **training certifications**, **teams**, **requirements**, and **compliance**. Users have roles (Admin, Manager, Executive, Auditor, User); managers oversee teams and requirements; admins manage users and catalog.

## Design system

- **UI:** React 19 + Tailwind CSS v4. No separate design-token repo; Tailwind utilities and components in `src/components/`.
- **Shell:** App shell (nav, user menu) in `src/components/shell/`; section UIs in `src/components/` (admin, catalog, dashboard, sections).

## Key UX choices

- **Auth:** Clerk-hosted sign-in/sign-up; app uses Clerk session and RBAC for all protected routes.
- **Navigation:** Shell provides global nav; section pages do not duplicate nav.
- **Data:** Server-driven; TanStack Query for caching and loading states. Forms use server functions with CSRF.
- **Responsiveness:** Layouts use Tailwind responsive prefixes; shell and main views work on small and large screens.

## Design OS (planning phase)

The product was planned using a Design OS–style flow: product vision, roadmap, data model, design system, shell, then section specs and screen designs. The implemented app lives in this repo; export/planning artifacts may live in `product/` or `product-plan/` for reference. Screen designs and components in `src/` are the source of truth for the app.

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Tech stack and structure
- [docs/design-section.md](./docs/design-section.md) — Section design
- [GLOSSARY.md](./GLOSSARY.md) — Terms
