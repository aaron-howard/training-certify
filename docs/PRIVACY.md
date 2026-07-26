# Privacy & Data Handling

**Last updated:** July 2026  
**Status:** Operational guidance for internal / municipal beta — **not** a legal privacy policy or GDPR sign-off.

This document describes what Training Certify stores, how long we intend to keep it, and how to fulfill data-subject requests. Legal review is still required before public GA.

---

## Data categories

| Category          | Examples                                       | Where stored                   |
| ----------------- | ---------------------------------------------- | ------------------------------ |
| Identity          | Clerk user id, email, display name, role       | Clerk + Postgres `users`       |
| Team membership   | Team name, membership, manager links           | Postgres                       |
| Certifications    | Exam codes, status, earned/expiry dates        | Postgres                       |
| Proof uploads     | PDF/JPEG/PNG certification proofs              | Vercel Blob (URLs in Postgres) |
| Catalog           | Vendor certification definitions               | Postgres                       |
| Application audit | Admin/security-relevant actions (`audit_logs`) | Postgres                       |
| Ops telemetry     | Errors, performance traces (when enabled)      | Sentry                         |
| Hosting logs      | Request logs, deploy metadata                  | Vercel / platform              |

---

## Subprocessors / processors

| Provider   | Purpose                                         |
| ---------- | ----------------------------------------------- |
| Clerk      | Authentication and sessions                     |
| Vercel     | App hosting, Blob file storage                  |
| PostgreSQL | Primary application database (managed provider) |
| Sentry     | Error / performance monitoring                  |

DPAs with each vendor should be reviewed by legal before GA.

---

## Retention intent

| Data                         | Retention intent                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Active user + cert records   | While the account is active / required for compliance                                    |
| Soft-deleted / departed user | Review within 90 days; purge or archive per policy                                       |
| Proof blobs                  | Same as owning certification record                                                      |
| Database backups             | Provider PITR + local `pnpm run db:backup` retention (default 7 days for scripted dumps) |
| Sentry events                | Per Sentry project retention (configure in Sentry UI)                                    |

Automated purge jobs are **not** implemented yet. Retention is operator-driven until legal defines final policy.

---

## Data subject requests (DSAR)

Manual process for access / rectification / deletion:

1. **Verify** the requester’s identity (municipal / org process).
2. **Access / export:** Admin locates the user in User Management; export relevant certification rows and proof URLs as needed.
3. **Rectification:** Admin or user updates profile/cert fields via the app; Clerk email/name via Clerk Dashboard if required.
4. **Deletion:**
   - Remove or anonymize Postgres user + related certs/memberships (coordinate FK order).
   - Delete proof objects from Vercel Blob when URLs are known.
   - Delete or disable the Clerk user in Clerk Dashboard.
   - Note the request in an internal ticket / `audit_logs` if available.
5. **Confirm** completion to the requester per org SLA.

---

## Cookies & analytics

- Auth cookies/sessions are managed by Clerk.
- `@vercel/analytics` may be present for aggregate traffic — confirm enablement per environment and disclose if used for end users.

---

## Still needed before GA (legal / product)

- [ ] Published privacy policy linked from the product
- [ ] Formal GDPR/CCPA (or local equivalent) mapping
- [ ] Signed DPAs with Clerk, Vercel, DB provider, Sentry
- [ ] Automated retention / purge jobs if required by policy
- [ ] Consent copy for analytics if enabled for non-employee users

---

## Related docs

- [SECURITY.md](../SECURITY.md) / [docs/SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md) — backups, HA/DR, go-live verify
- [DATABASE.md](./DATABASE.md) — backup and restore procedures
