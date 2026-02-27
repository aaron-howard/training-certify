# Training Certify

A modern web application for managing training certifications, built with TanStack Start, React 19, Drizzle ORM, and PostgreSQL.

[![CI](https://github.com/aaron-howard/training-certify/actions/workflows/ci.yml/badge.svg)](https://github.com/aaron-howard/training-certify/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/aaron-howard/training-certify/graph/badge.svg)](https://codecov.io/gh/aaron-howard/training-certify)

## Quick start

- **Setup:** [SETUP.md](./SETUP.md) — prerequisites, install, env, migrations, run locally
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) — stack, structure, patterns
- **API:** [API.md](./API.md) — endpoints, auth, OpenAPI, Swagger UI
- **Testing:** [TESTING.md](./TESTING.md) — unit, E2E, coverage
- **Deployment:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — production deploy, env, health checks
- **Security:** [SECURITY.md](./SECURITY.md) — auth, CSRF, rate limiting, headers
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common issues and fixes

## Documentation index

| Document                                   | Description                  |
| ------------------------------------------ | ---------------------------- |
| [SETUP.md](./SETUP.md)                     | Local development setup      |
| [ARCHITECTURE.md](./ARCHITECTURE.md)       | System design and tech stack |
| [API.md](./API.md)                         | API overview and reference   |
| [TESTING.md](./TESTING.md)                 | Running and writing tests    |
| [SECURITY.md](./SECURITY.md)               | Security model and hardening |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Diagnosing and fixing issues |
| [CONTRIBUTING.md](./CONTRIBUTING.md)       | How to contribute            |
| [CHANGELOG.md](./CHANGELOG.md)             | Version history              |
| [RELEASES.md](./RELEASES.md)               | Release process              |
| [HISTORY.md](./HISTORY.md)                 | Project history              |
| [DESIGN_NOTES.md](./DESIGN_NOTES.md)       | Design and UX notes          |
| [TUTORIALS.md](./TUTORIALS.md)             | Step-by-step guides          |
| [GLOSSARY.md](./GLOSSARY.md)               | Terms and abbreviations      |
| [SUPPORT.md](./SUPPORT.md)                 | Where to get help            |
| [LICENSE.md](./LICENSE.md)                 | License information          |

## Tech stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Auth:** [Clerk](https://clerk.com/)

## Scripts

| Command                  | Description                  |
| ------------------------ | ---------------------------- |
| `pnpm run dev`           | Start dev server (port 3000) |
| `pnpm run build`         | Production build             |
| `pnpm run test`          | Run unit/API tests           |
| `pnpm run test:coverage` | Tests with coverage          |
| `pnpm run test:e2e`      | Playwright E2E tests         |
| `pnpm run lint`          | ESLint                       |
| `pnpm run type-check`    | TypeScript check             |
| `pnpm run docs`          | Generate JSDoc API docs      |

See [SETUP.md](./SETUP.md) and [TESTING.md](./TESTING.md) for details.
