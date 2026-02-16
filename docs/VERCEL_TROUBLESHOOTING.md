# Vercel and Browser Error Troubleshooting

This doc covers common production/preview errors and how to fix them.

---

## 1. "Clerk: no secret key provided" (500 on `/` or API routes)

**Error in logs:**

```text
Error: @clerk/tanstack-react-start: Clerk: no secret key provided
```

**Cause:** The deployment has no `CLERK_SECRET_KEY` in its environment. Clerk needs this for any server-side auth (SSR, API routes that use `auth()` or `getVerifiedAuth()`).

**Fix:**

1. In **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add (or fix):
   - **`CLERK_SECRET_KEY`** – from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys → Secret key (starts with `sk_`).
   - **`VITE_CLERK_PUBLISHABLE_KEY`** – from same place, Publishable key (starts with `pk_`).
3. Set both for **Production** and **Preview** (or "All").  
   Preview deployments (e.g. `training-certify-xxxxx-aaron-howards-projects.vercel.app`) only get variables that are enabled for **Preview**.
4. Redeploy after changing env vars (or trigger a new deployment).

---

## 2. 500 on `/api/catalog` or `/api/users` (production)

**Symptoms:**

- `GET /api/catalog?limit=200` → 500
- `POST /api/users` → 500
- Other routes (e.g. `/api/dashboard`, `GET /api/users`) may return 200.

**Possible causes:**

| Cause                                    | What to check                                                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clerk secret missing** (same as above) | Ensure `CLERK_SECRET_KEY` is set for the environment that serves production (and that no typo or wrong scope).                                                                      |
| **Database unavailable**                 | `DATABASE_URL` (or `POSTGRES_URL`) must be set in Vercel for Production (and Preview if you hit APIs from preview). Connection timeouts or pool limits can cause intermittent 500s. |
| **Serverless cold start / timeouts**     | First request after idle can fail if DB or Clerk init is slow; consider Vercel Pro for longer timeouts or warming.                                                                  |

**How to see the real error:**

- In **Vercel** → **Deployments** → select a deployment → **Functions** (or **Logs**).  
  The function log for the failing request should show the actual exception (e.g. "Clerk: no secret key" or a DB error).
- The API only returns a generic `"Internal server error"` (see `handleApiError` in `src/lib/api-helpers.server.ts`); the full message is server-side only.

**Quick checks:**

1. Env vars in Vercel for **Production**: `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `DATABASE_URL` (or `POSTGRES_URL`).
2. From Vercel function logs, confirm whether the failure is Clerk (no secret key) or DB (connection/query error).

---

## 3. Browser: "Failed to load resource: 500" and "Failed to fetch catalog"

These are the client-side reflection of the same server 500s:

- **`/api/catalog` 500** → server threw in the catalog handler (often Clerk or DB; see above).
- **`POST /api/users` 500** → server threw in the users handler (same: auth or DB).

Fix the server-side cause (Clerk keys, DB URL, or timeouts) as in sections 1 and 2; the browser errors will go away once the APIs return 200.

---

## 4. SSL warning (pg / connection string)

**Log message:**

```text
SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'...
```

This is a **warning** from the Node `pg` driver about future behavior; it does not cause 500s.

**Optional (to silence and future-proof):**  
In your DB URL (e.g. in Vercel `DATABASE_URL`), use explicit SSL mode, for example:

- `?sslmode=verify-full` (current secure behavior), or
- `?uselibpqcompat=true&sslmode=require` (if you need libpq-compatible behavior).

Only change this if you understand your DB’s SSL requirements.

---

## Checklist summary

| Issue                                           | Action                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 500 on preview URL or "no secret key"           | Add `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` to Vercel **Preview** (and Production).          |
| 500 on /api/catalog or /api/users in production | Confirm Clerk keys and `DATABASE_URL` for **Production**; read Vercel function logs for the exact error. |
| Browser "Failed to fetch catalog" / 500         | Fix the corresponding API 500 (Clerk or DB) on the server.                                               |
| pg SSL warning                                  | Optional: set `sslmode=verify-full` (or compat) in `DATABASE_URL`.                                       |
