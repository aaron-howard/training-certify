# Tutorials — Training Certify

Step-by-step guides for common tasks.

## 1. Run the app locally

See [SETUP.md](./SETUP.md): clone, `pnpm install`, set `.env.local` (DATABASE_URL, Clerk keys), `pnpm exec drizzle-kit push`, `pnpm run dev`. Open http://localhost:3000.

## 2. Run the test suite

See [TESTING.md](./TESTING.md): `pnpm run test`, `pnpm run test:coverage`, `pnpm run check:api-coverage`, `pnpm run test:e2e`.

## 3. Deploy to production

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md): env vars (including `CSRF_SECRET`), database migrations (`pnpm run db:migrate`), build, health/ready endpoints, optional Sentry and Redis.

## 4. Add a new API route

1. Create `src/routes/api.<name>.ts` (or extend an existing `api.*` file).
2. Define route with `createFileRoute` and server handlers (GET/POST/etc.).
3. Use `getVerifiedAuth()` and `requireRole()` for protected routes.
4. Use Zod schemas for request body/query; return JSON or use `handleApiError()`.
5. Add tests under `src/api/__tests__/` and ensure API coverage stays ≥80%.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [docs/api/README.md](./docs/api/README.md).

## 5. Debug “App won’t start” or “DB connection”

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md): env vars, `pnpm run type-check`, `curl /api/health`, `DATABASE_URL` format, and common fixes.

## 6. Understand auth and roles

See [docs/auth-flow.md](./docs/auth-flow.md): Clerk flow, RBAC roles (Admin, Manager, Executive, Auditor, User), and how `requireRole()` is used.

---

More detail in [SETUP.md](./SETUP.md), [TESTING.md](./TESTING.md), [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md), and [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
