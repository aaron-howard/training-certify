# Training Certify Architecture

## Overview

**Training Certify** is a web application for managing compliance and training certifications. It is built using a modern React stack with server-side rendering and type-safe database interactions.

## Technology Stack

### Frontend
- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based routing)

### Backend
- **Server Runtime**: Node.js (via Vinxi/Nitro)
- **API**: TanStack Start Server Functions (`createServerFn`)
- **Validation**: Ad-hoc (Moving to Zod - see `plan.md`)

### Database
- **Engine**: PostgreSQL (Local)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Migrations**: Drizzle Kit

### Authentication
- **Provider**: [Clerk](https://clerk.com/)
- **Integration**: `@clerk/tanstack-react-start`

## Project Structure

- `src/routes/`: File-based routes (Public and Protected).
- `src/components/`: React components.
- `src/db/`: Database schema and connection logic.
- `src/api/`: Server-side API handlers (Server Functions).
- `product/`: Design specifications and planning documents.

## Key Design Patterns

- **Server Functions**: We use `createServerFn` for API interactions, which provides type safety from server to client.
- **Drizzle Schema**: defined in `src/db/schema.ts`.
- **Environment Variables**: Managed via `.env` and `.env.local`.

## Current Status

See `README.md` and `plan.md` for the active development roadmap.
