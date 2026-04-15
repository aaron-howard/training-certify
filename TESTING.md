# Testing — Training Certify

How to run and extend tests.

## Commands

| Command                       | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `pnpm run test`               | Run unit and API tests (Vitest) once                            |
| `pnpm run test:coverage`      | Same + coverage report (text, HTML in `coverage/`, lcov for CI) |
| `pnpm run check:api-coverage` | Enforce ≥80% statement coverage on API route files              |
| `pnpm run test:e2e`           | Playwright E2E (starts dev server if needed)                    |
| `pnpm run test:e2e:ui`        | Playwright UI for debugging E2E                                 |

## Unit and API tests (Vitest)

- **Location:** `src/**/*.test.ts`, `src/**/*.spec.ts`, `src/api/__tests__/`
- **Config:** `vitest.config.ts` — coverage thresholds and include/exclude.
- **API coverage:** CI runs `check:api-coverage`; all 13 API route files must meet the 80% statement gate.

## E2E (Playwright)

- **Location:** `e2e/` — `playwright.config.ts` loads `.env` / `.env.local` and runs `e2e/playwright-global-setup.ts` for Clerk testing tokens when keys are present.
- **Usage:** `pnpm run test:e2e`; use `pnpm run test:e2e -- --update-snapshots` to refresh visual baselines.
- **Debug:** `pnpm run test:e2e:ui`.
- **Signed-in flows (Clerk):** `e2e/signed-in-clerk.spec.ts` — requires test user env vars; see **[docs/e2e-clerk.md](./docs/e2e-clerk.md)** for CI secrets and Clerk dashboard setup.

## Before CI / PR

Run locally:

```bash
pnpm run test:coverage
pnpm run check:api-coverage
pnpm run lint
pnpm run type-check
pnpm run build
pnpm run test:e2e
```

CI runs these (see `.github/workflows/ci.yml`).

## Writing tests

- **Unit:** Use Vitest and Testing Library where applicable; mock server-only deps (DB, Clerk) as needed.
- **API:** Use the helpers in `src/api/__tests__/`; hit route handlers with mocked auth and DB.
- **E2E:** Use Playwright for critical flows (smoke, auth redirects, key pages); keep tests stable and maintainable.

See [SETUP.md](./SETUP.md) for environment setup and [ARCHITECTURE.md](./ARCHITECTURE.md) for structure.
