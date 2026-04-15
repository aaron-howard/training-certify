# Playwright E2E with Clerk (signed-in flows, #20)

Smoke tests in `e2e/smoke.spec.ts` and `e2e/auth-redirect.spec.ts` run **without** a real Clerk user. **`e2e/signed-in-clerk.spec.ts`** exercises **catalog**, **team management**, and **compliance** after a **password** sign-in using [`@clerk/testing`](https://clerk.com/docs/testing/playwright/overview).

## When signed-in tests run

Playwright loads env from **`.env`** then **`.env.local`** (see `playwright.config.ts`). The suite is **`describe.skipIf`** unless all of the following are set:

| Variable                                                | Purpose                                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `CLERK_SECRET_KEY`                                      | Clerk **secret** key (`sk_test_…`, not `sk_live_`) — required for `clerkSetup()` and the dev server |
| `VITE_CLERK_PUBLISHABLE_KEY` or `CLERK_PUBLISHABLE_KEY` | Clerk **publishable** key (`pk_test_…`) — dev server + `@clerk/testing`                             |
| `E2E_CLERK_USER_USERNAME`                               | Sign-in **identifier** (username or email) for a user in your Clerk **development** instance        |
| `E2E_CLERK_USER_PASSWORD`                               | That user’s password                                                                                |

`e2e/playwright-global-setup.ts` calls **`clerkSetup()`** only when publishable + secret keys are present, so CI and local runs without these variables **skip** signed-in specs and still pass.

## Clerk Dashboard checklist

1. **Development instance** keys only (`pk_test_` / `sk_test_`).
2. User must allow **email + password** (or username + password) as configured for `strategy: 'password'`.
3. **Compliance** API (`GET /api/compliance`) allows **Admin**, **Auditor**, or **Executive** only. The compliance E2E asserts the page shell and either **stats** (`Compliance Rate`) or **“Compliance data unavailable.”** if the synced DB role is still **User**. For strict stats assertions, set the user’s row in **`users.role`** to `Admin` (or another allowed role) after first sign-in / sync.

## GitHub Actions (CI)

Store **repository or organization secrets** for your Clerk **development** instance and database. Then extend `.github/workflows/ci.yml` under **Run E2E tests** → `env:` (only include variables that are always defined; **do not** map a missing secret to an empty string or `validateEnv()` may fail).

Example (adjust names to match your secrets):

```yaml
- name: Run E2E tests
  run: pnpm run test:e2e
  env:
    CI: true
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
    E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME }}
    E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD }}
```

| Secret (typical)             | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL URL for `pnpm run dev` (required by server `validateEnv`) |
| `CLERK_SECRET_KEY`           | `sk_test_…`                                                          |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_…`                                                          |
| `E2E_CLERK_USER_USERNAME`    | Clerk identifier for password sign-in                                |
| `E2E_CLERK_USER_PASSWORD`    | Password                                                             |

If `E2E_*` (or core Clerk) secrets are omitted, **`signed-in-clerk` specs are skipped**; smoke tests in `e2e/smoke.spec.ts` still run.

`@clerk/testing` prefers **`CLERK_PUBLISHABLE_KEY`**; `playwright-global-setup.ts` copies `VITE_CLERK_PUBLISHABLE_KEY` when `CLERK_PUBLISHABLE_KEY` is unset.

## Local commands

```bash
pnpm run test:e2e
pnpm run test:e2e:ui
pnpm run test:e2e -- e2e/signed-in-clerk.spec.ts
```

## Related files

- `playwright.config.ts` — `globalSetup`, dotenv, `webServer`
- `e2e/playwright-global-setup.ts` — `clerkSetup()`
- `e2e/signed-in-clerk.spec.ts` — `clerk.signIn` + route assertions
