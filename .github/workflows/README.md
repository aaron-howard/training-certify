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

- **deploy-staging** - Deploys to staging environment
- **deploy-production** - Deploys to production (requires manual approval)

**Note:** Deployment steps are placeholders. Update with your actual deployment commands.

**Status:** ⚠️ Template - Requires configuration

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

For deployment workflows, you may need:

- `VERCEL_TOKEN` - If deploying to Vercel
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - If deploying to AWS
- `RAILWAY_TOKEN` - If deploying to Railway
- Other platform-specific secrets

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
