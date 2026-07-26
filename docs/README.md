# Documentation

Main project docs live in the **repository root**. This folder holds deeper guides and specs.

## Root documentation (start here)

| Doc                                         | Description                    |
| ------------------------------------------- | ------------------------------ |
| [README.md](../README.md)                   | Project overview and doc index |
| [SETUP.md](../SETUP.md)                     | Local setup                    |
| [ARCHITECTURE.md](../ARCHITECTURE.md)       | Architecture and stack         |
| [API.md](../API.md)                         | API overview                   |
| [TESTING.md](../TESTING.md)                 | Running tests                  |
| [SECURITY.md](../SECURITY.md)               | Security summary               |
| [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | Common issues                  |
| [CONTRIBUTING.md](../CONTRIBUTING.md)       | How to contribute              |
| [SUPPORT.md](../SUPPORT.md)                 | Where to get help              |

## This folder (`docs/`)

| Document                                                                   | Description                                                           |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                                           | Production deployment, env vars, health, backups                      |
| [SECURITY.md](./SECURITY.md)                                               | Full security audit and checklists                                    |
| [auth-flow.md](./auth-flow.md)                                             | Authentication and authorization flow                                 |
| [database-schema.md](./database-schema.md)                                 | Database schema details                                               |
| [api/README.md](./api/README.md)                                           | API reference and OpenAPI                                             |
| [MONITORING.md](./MONITORING.md)                                           | SLOs, uptime workflow, Sentry alert playbook                          |
| [PRIVACY.md](./PRIVACY.md)                                                 | Privacy / DSAR ops guidance (not legal sign-off)                      |
| [VERCEL_TROUBLESHOOTING.md](./VERCEL_TROUBLESHOOTING.md)                   | Vercel-specific issues                                                |
| [ROLLBACK.md](./ROLLBACK.md)                                               | Rollback procedures                                                   |
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)                       | Production readiness report                                           |
| [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)   | Full production readiness checklist assessment                        |
| [dependency-overrides.md](./dependency-overrides.md)                       | `package.json` pnpm overrides (why / when to remove)                  |
| [dependabot-majors.md](./dependabot-majors.md)                             | Dependabot major-version policy and quarterly review                  |
| [dependency-minor-patch-workflow.md](./dependency-minor-patch-workflow.md) | Weekly triage for grouped minor/patch Dependabot PRs                  |
| [rate-limiting-serverless.md](./rate-limiting-serverless.md)               | Rate limits across Vercel / multi-instance (Postgres vs in-memory)    |
| [nitro-tanstack-upgrade-path.md](./nitro-tanstack-upgrade-path.md)         | Nitro + TanStack Start pins and upgrade procedure                     |
| [bundle-analysis.md](./bundle-analysis.md)                                 | Client bundle treemap (`build:analyze`) and lazy route conventions    |
| [e2e-clerk.md](./e2e-clerk.md)                                             | Playwright signed-in E2E with Clerk (`@clerk/testing`) and CI secrets |
| [index.md](./index.md)                                                     | Design OS methodology (planning context)                              |

`architecture.md` and `TROUBLESHOOTING.md` in this folder redirect to the root versions.
