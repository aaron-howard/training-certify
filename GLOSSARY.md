# Glossary — Training Certify

Terms and abbreviations used in the project.

| Term                   | Meaning                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **RBAC**               | Role-Based Access Control. Access is determined by user role (Admin, Manager, Executive, Auditor, User). |
| **CSRF**               | Cross-Site Request Forgery. We mitigate it with HMAC-SHA256 tokens required on mutations.                |
| **Clerk**              | Third-party authentication provider. Handles sign-in, sessions, and JWT validation.                      |
| **TanStack Start**     | Full-stack React framework (routing, server functions, SSR) used by this app.                            |
| **Drizzle**            | Drizzle ORM — type-safe SQL over PostgreSQL; schema and migrations via Drizzle Kit.                      |
| **Server function**    | A `createServerFn`-based call that runs on the server; type-safe and CSRF-aware from the client.         |
| **Catalog**            | The set of certifications that can be assigned (certification definitions).                              |
| **User certification** | A user’s record of having (or pursuing) a certification from the catalog.                                |
| **Team requirement**   | A rule that a team must have a certain number of members with a given certification.                     |
| **Health / ready**     | `/api/health` (liveness) and `/ready` (readiness for load balancers).                                    |
| **Rate limit**         | Per-endpoint request caps (e.g. READ 100/min, MUTATION 30/min) to prevent abuse.                         |
| **Design OS**          | The planning methodology used to define product vision, roadmap, and sections before implementation.     |

For architecture and security terms, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [SECURITY.md](./SECURITY.md).
