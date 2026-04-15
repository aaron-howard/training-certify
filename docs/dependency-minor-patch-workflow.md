# Routine minor / patch dependency workflow (#14)

This describes how we **triage and merge** Dependabot’s **grouped minor and patch** updates so the tree stays current without surprise breakage.

## Cadence (aligned with Dependabot)

| Setting         | Value                                                                         | Where                                                                         |
| --------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Scan**        | Weekly, **Monday 09:00 UTC**                                                  | [`.github/dependabot.yml`](../.github/dependabot.yml)                         |
| **Grouped PRs** | `production-dependencies` (minor + patch), `dev-dependencies` (minor + patch) | Same file                                                                     |
| **Open PR cap** | **5** at a time                                                               | `open-pull-requests-limit` — merge or close stale PRs so new batches can open |

**Habit:** By end of day **Tuesday UTC** (or your team’s next business day), aim to have **open Dependabot dependency PRs** either merged or explicitly deferred (comment + close or draft).

### “Biweekly” option

Dependabot does not support **every two weeks** natively. To reduce load:

- Keep **weekly** scans but **merge grouped PRs every other week**, or
- Change `interval` to **`monthly`** in `dependabot.yml` (fewer PRs, larger batches).

Document any schedule change in this file when you change the YAML.

## Weekly checklist (maintainer)

1. **Open PRs:** [Pull requests labeled `dependencies`](https://github.com/aaron-howard/training-certify/pulls?q=is%3Apr+is%3Aopen+label%3Adependencies) (adjust repo if forked).
2. For each **grouped** `chore(deps): …` PR from Dependabot:
   - [ ] **CI green** — required checks (test, lint, type-check, build, e2e, security-scan per [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).
   - [ ] **Skim release notes** — linked in PR body or look up key packages on npm/GitHub releases.
   - [ ] **Scope sanity** — unusually large lockfile diff or new transitive deps? Run `pnpm why <package>` if unsure.
3. **Merge** with squash or merge commit per team preference; delete branch after merge.
4. If **CI fails** and fix is non-trivial: push a commit to the Dependabot branch (maintainers can edit) or close and let the next week regenerate.

## SLAs (suggested)

| Type                                             | Target                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Security** (advisory / Dependabot security PR) | Same business day if CI passes; escalate if not.                                                                           |
| **Grouped minor/patch** (no advisory)            | Within **5 business days** of PR open so the **5-PR cap** does not stall new updates.                                      |
| **Major / manual**                               | See [dependabot-majors.md](./dependabot-majors.md) and [nitro-tanstack-upgrade-path.md](./nitro-tanstack-upgrade-path.md). |

## Commands (local verification before merge)

From repo root:

```bash
pnpm install
pnpm run type-check
pnpm run test
pnpm run build
```

Optional: `pnpm run test:e2e` before merging large dev-tooling bumps (Playwright, ESLint stack).

## Automation reminders

- **Weekly triage nudge:** [`.github/workflows/dependency-weekly-triage-reminder.yml`](../.github/workflows/dependency-weekly-triage-reminder.yml) (Mondays **10:30 UTC**) — opens a checklist issue; close when triage is done.
- **Quarterly major review:** [dependency-major-review-reminder.yml](../.github/workflows/dependency-major-review-reminder.yml) — see [dependabot-majors.md](./dependabot-majors.md).

## Related docs

- [DEPENDENCY_SECURITY.md](./DEPENDENCY_SECURITY.md) — broader security and update policy
- [dependabot-majors.md](./dependabot-majors.md) — major-version rules
- [dependency-overrides.md](./dependency-overrides.md) — `pnpm.overrides`
