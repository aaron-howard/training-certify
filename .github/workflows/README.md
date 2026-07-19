# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD and repository management.

## Workflows

### `ci.yml` - Continuous Integration

**Triggers:**

- Pull requests to `main` branch
- Pushes to `main` branch

**Jobs:**

- **test** - Runs test suite with coverage reporting
- **lint** - Runs ESLint
- **type-check** - Runs TypeScript type checking
- **build** - Builds the application
- **security-scan** - Runs npm audit for vulnerability scanning
- **all-checks** - Aggregates all check results

**Status:** ✅ Active and configured

---

### `deploy.yml` - Deployment

**Triggers:**

- Push to `main` branch (deploys to staging)
- Manual workflow dispatch (allows choosing staging or production)

**Jobs:**

- **deploy-staging** - Deploys to staging via Vercel CLI (`vercel pull` → `build` → `deploy --prebuilt`)
- **deploy-production** - Deploys to production (manual `workflow_dispatch` only)

**Required secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Post-deploy gates (both environments):**

1. Health smoke via `scripts/check-uptime.sh` (`/ready` + `/api/health`)
2. Playwright smoke (`e2e/smoke.spec.ts` + `e2e/auth-redirect.spec.ts`) against the deploy URL

**After deploy (operator):** Run `pnpm run db:migrate` against the target `DATABASE_URL`, then bootstrap the first Admin (see `docs/DEPLOYMENT.md` go-live verify). Migrations are **not** auto-applied by this workflow.

**Status:** ✅ Configured (fails fast if Vercel secrets are missing)

---

### `uptime.yml` - External availability probes

**Triggers:** Every 10 minutes (cron) + manual `workflow_dispatch`

**Jobs:** Probe `STAGING_BASE_URL` and/or `PRODUCTION_BASE_URL` repository variables (`/ready` + `/api/health`). Skips with a warning if a variable is unset.

**Status:** ✅ Configured (enable by setting GitHub Actions variables)

---

### `load-test.yml` - k6 smoke load test

**Triggers:** Manual `workflow_dispatch` only

**Jobs:** Runs `perf/smoke-api.k6.js` against `STAGING_BASE_URL`.

**Status:** ✅ Configured

---

### `pr-decline.yml` - PR Management

**Triggers:**

- PR labels (when "Close PR: \*" labels are applied)
- Manual workflow dispatch

**Purpose:** Automatically closes PRs with standardized messages based on decline reasons.

**Status:** ✅ Configured

---

### `stale.yml` - Issue Management

**Triggers:**

- Scheduled (daily at 09:00 UTC)

**Purpose:** Marks stale issues and closes them after inactivity.

**Configuration:**

- Issues marked stale after 30 days
- Issues closed after 7 more days (37 total)
- Bug issues are exempt

**Status:** ✅ Active

---

## Configuration Notes

### Dependabot

Dependabot is configured via `.github/dependabot.yml`:

- Weekly dependency updates
- Automatic security updates
- Grouped updates to reduce PR noise

### Required Secrets

For deployment workflows:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — Vercel CLI deploy
- Optional for richer E2E: `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

### Required Variables (uptime / load test)

- `STAGING_BASE_URL` — staging origin (no trailing slash)
- `PRODUCTION_BASE_URL` — production origin

### Environment Protection

Production deployments require:

- Manual approval (via workflow_dispatch)
- All CI checks must pass
- Environment-specific secrets configured

---

## Troubleshooting

### Build Failures

1. Check CI workflow logs
2. Verify all tests pass locally: `npm test`
3. Check linting: `npm run lint`
4. Check types: `npm run type-check`

### Deployment Failures

1. Verify deployment secrets are configured
2. Check deployment platform status
3. Review deployment logs in workflow output
4. Ensure environment variables are set

---

## Related Documentation

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [CI/CD Setup](../docs/DEPLOYMENT.md#monitoring-setup)
- [Security Documentation](../docs/SECURITY.md)
