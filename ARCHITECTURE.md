# Training Certify — Architecture

## Overview

**Training Certify** is a web application for managing compliance and training certifications. It uses a modern React stack with server-side rendering and type-safe database access.

## System architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React UI   │  │ TanStack     │  │   Tailwind   │       │
│  │  Components  │  │   Router     │  │     CSS      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ TanStack     │  │   Clerk      │  │   Server     │       │
│  │   Start      │  │   Auth       │  │  Functions   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Rate       │  │     CSRF     │  │   Security   │       │
│  │  Limiting    │  │  Protection  │  │   Headers    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Drizzle    │  │  PostgreSQL  │  │    Cache     │       │
│  │     ORM      │  │   Database   │  │  (In-Memory) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Technology stack

| Layer             | Technology                                                                       |
| ----------------- | -------------------------------------------------------------------------------- |
| **Frontend**      | TanStack Start (React 19), TanStack Router, Tailwind CSS v4, TanStack Query      |
| **Backend**       | Node (Vinxi/Nitro), Server Functions + file-based API routes, Zod, custom errors |
| **Database**      | PostgreSQL, Drizzle ORM, Drizzle Kit migrations                                  |
| **Auth**          | Clerk; CSRF, rate limiting, security headers                                     |
| **Observability** | Sentry, Pino logging, `/api/health`, `/ready`, `/metrics`                        |

## Project structure

```
src/
├── routes/              # File-based routes (API + pages)
│   ├── api.*.ts         # API route handlers
│   └── *.tsx             # Page components
├── components/           # React components (admin, catalog, dashboard, shell)
├── db/                   # schema.ts, db.server.ts, migrations
├── api/                  # Server functions (*.server.ts) and __tests__
├── lib/                  # auth, errors, validation, cache, csrf, rateLimit
└── hooks/                # e.g. usePermissions
```

## Key patterns

- **Server functions** — `createServerFn` for type-safe server calls.
- **File-based routing** — API routes in `src/routes/api.*.ts` with GET/POST/etc. handlers.
- **RBAC** — `requireRole(['Admin', 'Manager'])` and resource-level checks.
- **Errors** — `ValidationError`, `ForbiddenError`, `NotFoundError` with consistent JSON shape.
- **Validation** — Zod schemas for all inputs.

## Request flow

- **Read:** Client → Router → Auth → Authz → DB (and cache) → Response
- **Write:** Client → Router → Auth → Authz → CSRF → Rate limit → Validate → DB → Invalidate cache → Response

## Related docs

- [docs/database-schema.md](./docs/database-schema.md) — Schema details
- [docs/auth-flow.md](./docs/auth-flow.md) — Auth and RBAC
- [docs/api/README.md](./docs/api/README.md) — API reference
- [DEPLOYMENT](./docs/DEPLOYMENT.md) — Deployment
