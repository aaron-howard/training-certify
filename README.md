# Training Certify

A modern web application for managing training certifications, built with TanStack Start, React 19, Drizzle ORM, and PostgreSQL.

[![CI](https://github.com/aaron-howard/training-certify/actions/workflows/ci.yml/badge.svg)](https://github.com/aaron-howard/training-certify/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/aaron-howard/training-certify/graph/badge.svg)](https://codecov.io/gh/aaron-howard/training-certify)

## Local Development Setup

This project uses **pnpm** and a local PostgreSQL database.

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS)
- [pnpm](https://pnpm.io/) (e.g. `npm install -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/) (Local installation)

### Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Set up environment variables**:
    Create a `.env.local` file in the root directory (copy `.env.example` if available) and ensure `DATABASE_URL` points to your local PostgreSQL instance:
    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/devdb"
    VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
    CLERK_SECRET_KEY="your_clerk_secret_key"
    ```
4.  **Run database migrations**:
    ```bash
    pnpm exec drizzle-kit push
    ```
5.  **Run the development server**:
    ```bash
    pnpm run dev
    ```

### Scripts

- `pnpm run dev`: Starts the development server on port 3000.
- `pnpm run build`: Builds the application for production.
- `pnpm run test`: Runs the test suite using Vitest.
- `pnpm run test:coverage`: Runs tests and generates coverage report (text, HTML in `coverage/`, lcov for CI). Thresholds are in `vitest.config.ts` (raise to 80% when coverage is increased per TASK.md Phase 1.2/1.3).
- `pnpm run test:e2e`: Runs Playwright E2E tests (smoke, auth redirects, visual). Starts the dev server automatically if not already running. Use `pnpm run test:e2e -- --update-snapshots` to refresh visual baselines.
- `pnpm run test:e2e:ui`: Opens the Playwright UI for debugging E2E tests.
- `pnpm run lint`: Runs ESLint for code quality checks.
- `pnpm run format`: Runs Prettier for code formatting.
- `pnpm run check`: Runs both formatter and linter.
- `pnpm run docs`: Generates JSDoc API documentation with TypeDoc into `docs/api-jsdoc/` (lib, db, api, routes).

## Architecture & Stack

- **Framework**: [TanStack Start](https://tanstack.com/start)
- **Frontend**: React 19, Tailwind CSS
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Deployment**: Local-only development environment

## Database Schema

The database schema is defined in `src/db/schema.ts`. We use Drizzle Kit for managing migrations and schema pushes.

- To preview the database: `pnpm exec drizzle-kit studio`
- To generate migrations: `pnpm exec drizzle-kit generate`
- To push schema changes: `pnpm exec drizzle-kit push`

## Code Quality

We follow strict TypeScript practices and use ESLint/Prettier to ensure code consistency.

> [!IMPORTANT]
> API security and Zod validation are currently being implemented. While the foundation is in place, comprehensive server-side protection and strict schema validation are part of the active development plan (see `plan.md`).
