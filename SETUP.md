# Setup — Training Certify

Local development setup for Training Certify.

## Prerequisites

- **Node.js** 18+ LTS — [nodejs.org](https://nodejs.org/)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL** 14+ — [postgresql.org](https://www.postgresql.org/)

## Steps

### 1. Clone and install

```bash
git clone https://github.com/aaron-howard/training-certify.git
cd training-certify
pnpm install
```

### 2. Environment variables

Create `.env.local` in the project root (do not commit). Minimum for local dev:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/devdb"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

For production variables and optional settings, see `docs/env.production.example` and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

### 3. Database

Create a local database (e.g. `devdb`), then:

```bash
pnpm exec drizzle-kit push
```

Other commands:

- `pnpm exec drizzle-kit studio` — open Drizzle Studio
- `pnpm exec drizzle-kit generate` — generate migrations
- `pnpm run db:migrate` — apply migrations (use in production; do not use `push` in prod)

### 4. Run the app

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify setup

- **Health:** `curl http://localhost:3000/api/health`
- **Type check:** `pnpm run type-check`
- **Tests:** `pnpm run test`

## Next steps

- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the app is structured
- [TESTING.md](./TESTING.md) — run and write tests
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — production deployment
