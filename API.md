# API — Training Certify

Overview of the HTTP and server-function API.

## Where to look

- **Interactive docs:** Open **[/api-docs](http://localhost:3000/api-docs)** in the browser (Swagger UI).
- **OpenAPI spec:** [docs/api/openapi.yaml](./docs/api/openapi.yaml) (or served at `/docs/api/openapi.yaml`).
- **JSDoc/TypeDoc:** Run `pnpm run docs` to generate API docs in `docs/api-jsdoc/`.

## Areas

| Area               | Purpose                          |
| ------------------ | -------------------------------- |
| **Users**          | User CRUD, profile, auth context |
| **Teams**          | Teams, members, requirements     |
| **Certifications** | User certification records       |
| **Catalog**        | Certification catalog            |
| **Dashboard**      | Stats and metrics                |
| **Compliance**     | Audit logs, compliance views     |
| **Notifications**  | Notifications and preferences    |
| **Export**         | Data export                      |
| **Health**         | `GET /api/health` (no auth)      |

## Authentication

All endpoints except `/api/health` require **Clerk** authentication (session/Bearer). The app uses `getVerifiedAuth()` and role checks on the server.

## Rate limits

| Preset   | Limit (per minute) |
| -------- | ------------------ |
| AUTH     | 5                  |
| MUTATION | 30                 |
| READ     | 100                |
| EXPORT   | 10                 |
| ADMIN    | 50                 |

## CSRF

All **mutation** requests (POST, PATCH, DELETE) must include a valid **CSRF token** in the `X-CSRF-Token` header. Use the CSRF endpoint or server-provided token; `createServerFn` handles this for in-app calls.

## Error format

JSON body:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

Common codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `VALIDATION_FAILED` (400), `NOT_FOUND` (404), `DATABASE_ERROR` (500).

## Health and readiness

- **GET /api/health** — Components (DB, Clerk, etc.); use for liveness.
- **GET /ready** — 200 when DB is reachable and app is “ready” (e.g. after startup delay); use for load balancers.

Full endpoint list and request/response shapes: use the OpenAPI spec or Swagger UI linked above.
