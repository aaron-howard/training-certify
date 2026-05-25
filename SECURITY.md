# Security — Training Certify

**Last updated:** February 2026 · **Status:** Production-ready

## Summary

Training Certify uses layered security: Clerk auth, role-based access, CSRF and rate limiting, security headers, and Zod validation. No critical issues open; see [docs/SECURITY.md](./docs/SECURITY.md) for the full audit and checklists.

## Authentication & authorization

- **Clerk** — Sessions and token validation.
- **RBAC** — Roles: Admin, Manager, Executive, Auditor, User. `requireRole()` on protected endpoints; users see only their data unless Admin/Manager.

## Protections

| Area              | Implementation                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSRF**          | HMAC-SHA256 tokens; required for mutations; `CSRF_SECRET` required in production.                                                                                                   |
| **Rate limiting** | Per-endpoint presets (e.g. READ 100/min, MUTATION 30/min); Postgres-backed in production across instances — [docs/rate-limiting-serverless.md](./docs/rate-limiting-serverless.md). |
| **Input**         | Zod schemas on all inputs; DB constraints; no raw SQL with user input (Drizzle).                                                                                                    |
| **File uploads**  | Certification proofs via `POST /api/certifications/proof` → Vercel Blob (`BLOB_READ_WRITE_TOKEN`); PDF/JPEG/PNG only, 10 MB max.                                                    |
| **Headers**       | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.                                                                                                                            |
| **Errors**        | Sanitized in production (no stack traces to client).                                                                                                                                |

## Required production env

- `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `CSRF_SECRET` (min 32 chars)
- Optional: `SENTRY_DSN`, `LOG_LEVEL`, `HTTPS_ONLY`

## Reporting issues

Report security vulnerabilities privately to the maintainers (e.g. via GitHub Security Advisories or contact in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)). Do not open public issues for security-sensitive findings.

## Full audit and checklists

Detailed vulnerability assessment, checklists, and compliance notes: [docs/SECURITY.md](./docs/SECURITY.md).
