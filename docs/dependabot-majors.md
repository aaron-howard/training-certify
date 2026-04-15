# Dependabot: major-version policy

This repo uses [Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates) (see [`.github/dependabot.yml`](../.github/dependabot.yml)).

## Goals

1. **Automatically receive major bumps** for lower-risk, high-value packages (e.g. `typescript`, `zod`, `prettier`, `@types/*`, `dotenv`) so tooling stays current without waiting for a manual pass.
2. **Avoid noisy or breaking auto-majors** for the framework/runtime stack (React, TanStack, Vite, Clerk, Drizzle, Nitro, ESLint, Playwright, etc.) — those stay **manual** with migration notes and full CI.
3. **Review quarterly** whether the ignore list should shrink (upstream has stabilized) or grow (new risky transitive).

For **routine minor/patch** triage (grouped PRs, SLAs, weekly reminder), see **[dependency-minor-patch-workflow.md](./dependency-minor-patch-workflow.md)**.

## What Dependabot does here

| Update type       | Policy                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Patch / minor** | Grouped PRs for production and dev dependencies (weekly, Monday 09:00 UTC).                                                             |
| **Major**         | Opened **unless** the dependency matches an `ignore` rule in `dependabot.yml` (see below).                                              |
| **Security**      | GitHub still surfaces **Dependabot security alerts** / advisory PRs per your org/repo settings; keep merging those on severity and SLA. |

## Majors ignored automatically (manual upgrade path)

These patterns only block **`version-update:semver-major`**. Patch/minor (and security) updates still flow when Dependabot offers them.

| Area                                    | Rationale                                                |
| --------------------------------------- | -------------------------------------------------------- |
| React, Vite, Vitest, TanStack, Tailwind | Coordinated upgrades; often need code or config changes. |
| Clerk, Sentry                           | Auth/telemetry SDK majors follow their migration guides. |
| Drizzle, Nitro                          | Schema/build pipeline risk.                              |
| ESLint, Playwright                      | Config and CI contract changes.                          |
| `pg`, `pino`, `lucide-react`            | Runtime/driver/icon churn — verify in a branch.          |
| `vercel` CLI                            | Deploy tooling — align with platform docs.               |

Exact `dependency-name` globs live in **`.github/dependabot.yml`** — edit there first, then update this table if you rename sections.

## Quarterly review (calendar)

Suggested: **first week of January, April, July, October** (or when [`.github/workflows/dependency-major-review-reminder.yml`](../.github/workflows/dependency-major-review-reminder.yml) opens its reminder issue).

Checklist:

1. Run `pnpm outdated` locally and skim **major** columns for ignored packages.
2. For one stack at a time (e.g. TanStack only), read upstream release notes, bump in a branch, run `pnpm run type-check`, `pnpm run test`, `pnpm run build`, and smoke E2E if auth-related.
3. Remove or narrow a Dependabot `ignore` entry when you are ready for automated majors again for that package.
4. Add new `ignore` entries when you adopt a fragile major (e.g. new platform SDK).

## Related

- [DEPENDENCY_SECURITY.md](./DEPENDENCY_SECURITY.md) — process, audit, Dependabot basics
- [dependency-overrides.md](./dependency-overrides.md) — `package.json` `pnpm.overrides`
- [nitro-tanstack-upgrade-path.md](./nitro-tanstack-upgrade-path.md) — Nitro + TanStack Start version strategy and manual upgrade steps
