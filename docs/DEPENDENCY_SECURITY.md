# Dependency Security Management

This document outlines the dependency security process for the Training Certify platform.

---

## Automated Dependency Scanning

### Dependabot Configuration

Dependabot is configured via `.github/dependabot.yml` to automatically:

- **Scan weekly** (Mondays at 9:00 AM)
- **Create PRs** for security and minor/patch updates
- **Group updates** to reduce PR noise
- **Prioritize security** updates (always allowed)

### Update Schedule

- **Frequency:** Weekly
- **Day:** Monday
- **Time:** 9:00 AM UTC
- **Scope:** npm ecosystem

### Update Types

#### ✅ Automatically Updated

- **Security updates** (all severity levels)
- **Minor version updates** (grouped)
- **Patch version updates** (grouped)

#### ⚠️ Requires Manual Review

- **Major version updates** (not auto-updated)
- **Breaking changes** (manual review required)

### pnpm overrides (`package.json`)

Transitive dependency versions are sometimes pinned with pnpm **`overrides`**. Each entry is documented (reason, advisories, removal checklist) in **[dependency-overrides.md](./dependency-overrides.md)**. Update that file whenever you add, bump, or remove an override.

### Dependabot major versions

**[dependabot-majors.md](./dependabot-majors.md)** describes which packages get **automatic major** PRs vs **ignored majors** (manual upgrade path), and the **quarterly review** checklist. The scheduled reminder workflow is `.github/workflows/dependency-major-review-reminder.yml`.

### Nitro + TanStack Start

Toolchain bumps (Nitro prereleases, TanStack Start/Router lockstep upgrades) are documented in **[nitro-tanstack-upgrade-path.md](./nitro-tanstack-upgrade-path.md)**.

### Routine minor / patch workflow

**[dependency-minor-patch-workflow.md](./dependency-minor-patch-workflow.md)** describes the **weekly** triage habit for Dependabot’s grouped production and dev **minor/patch** PRs, SLAs, and local verification commands. The scheduled nudge is **`.github/workflows/dependency-weekly-triage-reminder.yml`** (Mondays 10:30 UTC).

---

## Dependency Update Process

### 1. Dependabot Creates PR

When Dependabot finds updates:

1. Creates a pull request with update details
2. Labels PR with `dependencies` and `security` (if security update)
3. Assigns reviewer (configured in dependabot.yml)
4. CI pipeline runs automatically

### 2. CI Pipeline Validation

The CI pipeline automatically:

- ✅ Runs tests (`pnpm test`)
- ✅ Runs linting (`pnpm run lint`)
- ✅ Runs type checking (`pnpm run type-check`)
- ✅ Builds the project (`pnpm run build`)

### 3. Review Process

**For Security Updates:**

- **Priority:** High - Review and merge ASAP
- **Check:** Review changelog for breaking changes
- **Test:** Verify application still works
- **Merge:** If tests pass and no breaking changes

**For Minor/Patch Updates:**

- **Priority:** Medium - Review within 1 week
- **Check:** Review changelog
- **Test:** Run test suite
- **Merge:** If tests pass

**For Major Updates:**

- **Priority:** Low - Manual review required
- **Process:**
  1. Review migration guide
  2. Test in development branch
  3. Update code if needed
  4. Create manual PR

---

## Manual Dependency Updates

### Checking for Updates

```bash
# Check outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit --fix

# Review detailed vulnerability report
pnpm audit --json
```

### Updating Dependencies

```bash
# Update a specific package
pnpm add package-name@latest

# Update all packages (use with caution)
pnpm update

# Update lockfile after manifest changes
pnpm install
```

### Testing Updates

1. **Create a branch:**

   ```bash
   git checkout -b update-dependencies
   ```

2. **Update dependencies:**

   ```bash
   pnpm add package-name@version
   ```

3. **Run tests:**

   ```bash
   pnpm test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit and push:**
   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "chore: update package-name to version"
   git push
   ```

---

## Security Vulnerability Response

### Critical Vulnerabilities (CVSS 9.0+)

**Response Time:** Immediate (within 24 hours)

1. **Assess Impact:**
   - Review vulnerability details
   - Check if vulnerable code is used
   - Assess exploitability

2. **Apply Fix:**
   - Update to patched version immediately
   - Or apply workaround if update not available

3. **Test & Deploy:**
   - Run full test suite
   - Deploy to production ASAP

### High Vulnerabilities (CVSS 7.0-8.9)

**Response Time:** Within 1 week

1. Review vulnerability
2. Update to patched version
3. Test thoroughly
4. Deploy to production

### Medium/Low Vulnerabilities (CVSS < 7.0)

**Response Time:** Within 1 month

1. Review during next scheduled update
2. Include in next dependency update batch
3. Test and deploy

---

## Dependency Overrides

Some dependencies require version overrides (in `package.json` under `pnpm.overrides`):

```json
{
  "pnpm": {
    "overrides": {
      "tar": "^7.5.8",
      "seroval": "^1.4.1",
      "undici": "^6.27.0",
      "path-to-regexp": "^6.3.0",
      "esbuild": "^0.25.0"
    }
  }
}
```

**Note:** These overrides are used to resolve dependency conflicts. Review carefully before updating.

---

## Best Practices

### ✅ Do

- Review Dependabot PRs promptly
- Test updates before merging
- Keep security updates prioritized
- Review changelogs for breaking changes
- Use `pnpm audit` before production deployments

### ❌ Don't

- Auto-merge major version updates
- Ignore security update PRs
- Update dependencies without testing
- Remove overrides without testing
- Skip CI checks

---

## Monitoring

### Current Status

- **Dependabot:** ✅ Active
- **Security Alerts:** ✅ Enabled
- **Automated PRs:** ✅ Configured
- **CI Integration:** ✅ Automatic
- **pnpm audit:** ✅ 0 vulnerabilities (as of May 17, 2026)

### Regular Tasks

**Weekly:**

- Review Dependabot PRs
- Merge security updates
- Review minor/patch updates

**Monthly:**

- Review major version updates
- Audit dependency tree (`pnpm ls`)
- Review and update overrides if needed

**Quarterly:**

- Full dependency audit
- Review and update major dependencies
- Security vulnerability assessment

---

## Tools & Resources

### Commands

- `pnpm audit` - Check for vulnerabilities
- `pnpm audit --fix` - Auto-fix vulnerabilities
- `pnpm outdated` - List outdated packages
- `pnpm ls` - Show dependency tree

### Resources

- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Snyk Vulnerability Database](https://security.snyk.io/)

---

## Incident Response

If a critical vulnerability is discovered:

1. **Immediate Actions:**
   - Assess severity and impact
   - Check if vulnerable code is in use
   - Review available patches

2. **Remediation:**
   - Update to patched version
   - Or apply workaround
   - Test thoroughly

3. **Deployment:**
   - Deploy fix to production
   - Monitor for issues
   - Document incident

4. **Post-Incident:**
   - Review dependency update process
   - Improve monitoring if needed
   - Update documentation

---

**Last Updated:** May 17, 2026
