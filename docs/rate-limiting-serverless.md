# Rate limiting on Vercel and multi-instance deployments (#17)

This document describes how API rate limiting behaves when the app runs on **many concurrent serverless instances** (for example Vercel Fluid Compute / Node serverless functions), and when limits are **not** shared across instances.

## Summary

| Mode                | When it applies                                                                                | Shared across instances?                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Postgres-backed** | `NODE_ENV=production` **and** `USE_DB_RATE_LIMIT` is not set to `false`                        | **Yes** — counters live in `rate_limit_logs` (see `src/db/schema.ts`)          |
| **In-memory**       | Local development / tests, **or** `USE_DB_RATE_LIMIT=false`, **or** DB errors trigger fallback | **No** — each warm isolate keeps its own `Map`; limits multiply by concurrency |

**Production default:** use the database path so all regions and instances agree on usage for a given `identifier` (user id, `health:<ip>`, `csrf:<clientId>`, etc.).

## How the implementation chooses a backend

Logic lives in **`src/lib/rateLimit.server.ts`**:

1. **Database path** when `NODE_ENV === 'production'` and `process.env.USE_DB_RATE_LIMIT !== 'false'`.
2. Otherwise **in-memory** (`InMemoryRateLimiter`).
3. If a DB check throws (connection errors, timeouts, misconfiguration), the code **logs a warning** and **falls back to in-memory** for that request path — at that moment limits are **per instance** again.

Operational implication: monitor logs for `Database check failed, falling back to in-memory`. Sustained fallback under load weakens global rate limits.

## Vercel / serverless specifics

- **Cold starts:** Each invocation may run in a fresh isolate. In-memory state does **not** survive between invocations, so in-memory limiting is erratic and trivially bypassed by spreading traffic across instances. **Do not rely on in-memory limits for production abuse prevention.**
- **Warm concurrency:** Multiple concurrent requests can run in different isolates at once. Only the **database** path aggregates counts across those isolates (subject to the concurrency note below).
- **Single database:** If all deployments share one `DATABASE_URL` (typical Neon/Vercel Postgres), rate limits are **global** for that identifier across the fleet.
- **Multiple databases or regions with separate DBs:** Limits are **per database**, not per product. If you ever split read replicas for rate-limit writes vs reads, keep counting on one primary or use a dedicated store (Redis, etc.).

## Environment variable

| Variable            | Values                                        | Effect                                                                                          |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `USE_DB_RATE_LIMIT` | unset / anything except `false` in production | Use Postgres                                                                                    |
| `USE_DB_RATE_LIMIT` | `false`                                       | Force in-memory even in production (only for narrow debugging; not recommended for public APIs) |

Documented in **`docs/env.production.example`**. This variable is **not** required to be set for normal production.

## Algorithm (database path)

For each allowed request, the service inserts a row into `rate_limit_logs` with `(identifier, timestamp)`. Before allowing, it counts rows for that `identifier` with `timestamp` inside the configured window (`windowMs` / `maxRequests` from `RateLimitPresets` or custom config). Old rows are periodically deleted.

This is a **windowed request log**, not a classic token bucket. It is sufficient for abuse throttling when backed by shared storage.

### Concurrency caveat

The check uses **read count → then insert** without a serializable transaction. Under **many parallel requests** for the same identifier from different instances, it is possible for more than `maxRequests` rows to be inserted in the same window (each concurrent transaction may observe a count below the cap before others insert). For typical API traffic this is acceptable; if you need **hard** caps under extreme parallelism, consider a follow-up: transactional locking, advisory locks, or Redis `INCR` with expiry.

## Related code and docs

- Implementation: `src/lib/rateLimit.server.ts`, table `rate_limit_logs` in `src/db/schema.ts`
- Presets: `RateLimitPresets` (AUTH, MUTATION, READ, EXPORT, ADMIN)
- Security audits: [SECURITY.md](./SECURITY.md) (full), [SECURITY.md](../SECURITY.md) (summary)
- Troubleshooting 429s: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
