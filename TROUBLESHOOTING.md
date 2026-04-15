# Troubleshooting — Training Certify

**Last updated:** February 2026

## Quick reference

| Issue                | Quick check           | Solution                |
| -------------------- | --------------------- | ----------------------- |
| App won't start      | `pnpm run type-check` | Fix TypeScript errors   |
| Database connection  | `curl /api/health`    | Check DATABASE_URL      |
| High memory          | `curl /api/health`    | Check memory stats      |
| Slow responses       | `curl /metrics`       | Check query performance |
| Authentication fails | Check Clerk keys      | Verify CLERK_SECRET_KEY |

## App won't start

- **Env:** Ensure `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` are set. Use `.env.local` for local dev.
- **TypeScript:** Run `pnpm run type-check` and fix reported errors; `pnpm run lint:fix` where applicable.
- **Port in use:** Change `PORT` or stop the process using port 3000 (`lsof -i :3000` / `netstat -tulpn | grep 3000`).
- **Dependencies:** From repo root run `pnpm install` (or clean with `rm -rf node_modules && pnpm install`).

## Database connection

- **Test DB:** `psql $DATABASE_URL -c "SELECT 1;"`
- **Health:** `curl http://localhost:3000/api/health` — inspect DB status in the response.
- **Format:** `postgresql://user:password@host:5432/dbname`; URL-encode special characters in password.
- **Connection refused:** Start PostgreSQL; check host/port/firewall.
- **Too many connections:** Check pool usage; increase pool size or close idle connections.
- **SSL:** Add `?sslmode=require` to `DATABASE_URL` if required.

## Authentication (Clerk)

- **Keys:** Set `CLERK_SECRET_KEY` (sk*...) and `VITE_CLERK_PUBLISHABLE_KEY` (pk*...); match test vs production.
- **CORS:** In Clerk dashboard, allow your app origin.
- **Session:** Check cookie settings and session timeout in Clerk.

## Rate limiting / CSRF

- **429:** Ease limits in `src/lib/rateLimit.server.ts` if needed. In production, limits are normally **Postgres-backed** (shared across instances); see [docs/rate-limiting-serverless.md](./docs/rate-limiting-serverless.md). If the database errors, the app **falls back to in-memory** limits per instance — check logs for `falling back to in-memory`.
- **CSRF errors:** Set `CSRF_SECRET` (min 32 chars); ensure token is sent (e.g. X-CSRF-Token header). Generate with `openssl rand -hex 32`.

## Migrations

- **Status:** Inspect `drizzle.__drizzle_migrations` in the DB.
- **Generate:** `pnpm run db:generate`; review SQL before applying.
- **Apply:** Use `pnpm run db:migrate` in production (do not use `drizzle-kit push` in prod).

## Performance / memory

- **Metrics:** `curl http://localhost:3000/metrics`
- **Slow queries:** Use DB tools (e.g. `pg_stat_statements`); add indexes as needed.
- **Memory:** Check `/api/health` memory stats; review cache TTL/size in `src/lib/cache.server.ts`.

## Getting help

1. Check this guide, [SETUP.md](./SETUP.md), [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md), and [SECURITY.md](./SECURITY.md).
2. Check logs (e.g. PM2, Docker, or app logs) and Sentry.
3. Use [GitHub Discussions](https://github.com/aaron-howard/training-certify/discussions) or open an issue with steps to reproduce.

## Useful commands

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/metrics
psql $DATABASE_URL -c "SELECT 1;"
pnpm run type-check
pnpm run lint
pnpm run test
```

For Vercel-specific issues, see [docs/VERCEL_TROUBLESHOOTING.md](./docs/VERCEL_TROUBLESHOOTING.md). For rollback steps, see [docs/ROLLBACK.md](./docs/ROLLBACK.md).
