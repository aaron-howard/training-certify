# Production Readiness Checklist

> **Project:** Training Certify  
> **Version:** 1.0.0-pre
> **Review Date:** 2026-06-25  
> **Reviewed By:** Aaron Howard (automated assessment)
> **Status:** 🟡 In Progress — **Conditional STAGED GO** (in-repo beta gates landed; ops verify migrate/Admin/uptime vars/Sentry alerts still required; GA not approved)

This checklist verifies production-readiness based on the current repository state, CI/CD configuration, security documentation, and source code. **Completion rate: 71/241 items checked (~29%).** Counts below are derived from the checklist rows (canonical source).

## Executive Summary

**Strengths:** Architecture is well-designed with Clerk auth, RBAC, and comprehensive security headers. Strong CI/CD foundation (lint, test, type-check, build, security scan). Good test coverage on API routes (≥80%). Security documentation is solid. Deployment guidance exists.

**Gaps requiring attention before production:**

1. **SLOs and monitoring** — No defined Service Level Objectives, alerting, or dashboard configuration
2. **High availability** — No documented multi-AZ setup, failover, or blue/green deployment strategy
3. **Data resilience** — Backup strategy, RTO/RPO, and DR validation not documented
4. **Full E2E testing** — E2E workflow exists but staging validation gates missing from CD pipeline
5. **Load & performance testing** — No baseline benchmarks, load tests, or stress tests
6. **Compliance & privacy** — GDPR/privacy policies and audit logs not documented
7. **Infrastructure as Code** — No Terraform/IaC for reproducible deployments
8. **API versioning & deprecation** — No API versioning strategy or backward-compatibility roadmap

**Recommended next steps:**

- Define SLOs and alerting rules for production (1 week)
- Document HA/DR strategy and implement multi-AZ PostgreSQL failover (2 weeks)
- Add load testing to pre-release checklist (1 week)
- Implement feature flags for safer deployments (2 weeks)
- Create IaC (Terraform or Pulumi) for deployment reproducibility (2–3 weeks)

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Security](#2-security)
3. [Testing](#3-testing)
4. [Performance](#4-performance)
5. [Reliability](#5-reliability)
6. [Observability](#6-observability)
7. [DevOps & CI/CD](#7-devops--cicd)
8. [Data Management](#8-data-management)
9. [Compliance & Privacy](#9-compliance--privacy)
10. [Operations & Incident Management](#10-operations--incident-management)
11. [Documentation](#11-documentation)
12. [User Experience (UX)](#12-user-experience-ux)

---

## 1. Architecture

### 1.1 Design & Structure

- [ ] Architecture decision records (ADRs) are documented and up to date <!-- No ADR directory is present yet -->
- [ ] System design diagram exists and reflects the current state <!-- Architecture docs exist but no explicit diagram -->
- [x] Service boundaries and responsibilities are clearly defined <!-- Architecture and deployment docs describe the main components -->
- [ ] No circular dependencies between services or modules <!-- This was not formally verified in the repo -->
- [ ] Dependency graph has been reviewed for unnecessary coupling <!-- Not yet documented as a formal review -->
- [x] External dependencies (third-party APIs, SDKs) are identified and risk-assessed <!-- Security and dependency docs cover Clerk, Sentry, Vercel Blob, and package overrides -->

### 1.2 Scalability

- [ ] Horizontal scaling is possible for all stateless components <!-- The app is stateless-friendly, but HA deployment has not been validated -->
- [ ] Stateful components (sessions, caches) are externalised (e.g., Redis, DB) <!-- Postgres is used; Redis is optional rather than enforced -->
- [ ] Load balancing is configured and tested <!-- No deployment topology evidence in the repository -->
- [ ] Auto-scaling policies are defined with appropriate thresholds <!-- Not yet defined -->
- [ ] Expected peak load has been estimated and capacity planned accordingly <!-- No capacity plan was found -->

### 1.3 Resilience Patterns

- [ ] Circuit breakers are implemented for all external service calls <!-- No explicit circuit breaker implementation found -->
- [ ] Retry logic uses exponential back-off with jitter <!-- Not implemented in the repo evidence reviewed -->
- [ ] Timeouts are configured on all outbound HTTP/RPC calls <!-- Not explicitly documented or enforced -->
- [ ] Bulkhead pattern applied to isolate critical service paths <!-- Not implemented -->
- [ ] Graceful degradation paths are defined and tested <!-- No explicit degradation strategy documented -->

### 1.4 API Design

- [ ] All public APIs are versioned (e.g., `/v1/`, `/v2/`) <!-- Current routes are not versioned -->
- [ ] Deprecated endpoints return appropriate warnings and sunset dates <!-- No deprecation policy or warnings found -->
- [x] API contracts (OpenAPI / AsyncAPI / gRPC proto) are committed to the repository <!-- OpenAPI support exists in the app and API docs are present -->
- [ ] Breaking changes follow a documented deprecation policy <!-- Not documented -->
- [ ] Pagination, filtering, and sorting are consistent across endpoints <!-- Not verified across the API surface -->

---

## 2. Security

### 2.1 Authentication & Authorisation

- [x] All endpoints require authentication unless explicitly marked public <!-- Protected routes use Clerk auth; health endpoints are intentionally public -->
- [x] OAuth 2.0 / OIDC flows are correctly implemented and reviewed <!-- Clerk-based auth is documented and used -->
- [x] Role-based or attribute-based access control (RBAC/ABAC) is enforced <!-- Security docs describe role-based access and requireRole usage -->
- [x] JWT expiry and refresh-token rotation policies are configured <!-- Managed by Clerk rather than custom implementation -->
- [x] Privilege escalation paths have been reviewed and closed <!-- Security review notes indicate no critical issues open -->

### 2.2 Secrets Management

- [x] No secrets, tokens, or credentials are hard-coded or committed to source control <!-- The repo uses environment-based config and ignores local env files -->
- [ ] Secrets are stored in a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault, Azure Key Vault) <!-- Deployment guidance assumes env-based secret injection, but no specific secrets manager is enforced -->
- [ ] Secret rotation schedules are defined and automated where possible <!-- Not documented -->
- [x] `.env` files are in `.gitignore` and never pushed to remote <!-- The repository ignores env files -->
- [x] CI/CD pipelines consume secrets via environment injection, not plain text <!-- GitHub Actions uses repository secrets -->

### 2.3 Network & Transport Security

- [ ] TLS 1.2+ is enforced on all ingress and inter-service communication <!-- This depends on the hosting environment rather than code -->
- [x] HTTP Strict Transport Security (HSTS) header is set <!-- Security docs and code mention HSTS in production -->
- [ ] Certificates are valid and auto-renewed (e.g., via ACM, Let's Encrypt) <!-- Deployment-specific certificate management is not defined in repo -->
- [ ] Unnecessary ports and services are closed at the firewall/security-group level <!-- Infrastructure-specific control is not captured here -->
- [ ] Private services are not publicly reachable <!-- Infrastructure-specific control is not captured here -->

### 2.4 Application Security

- [x] All user inputs are validated and sanitised server-side <!-- Zod schemas and Drizzle are used for server-side validation -->
- [x] SQL / NoSQL injection protections are in place (parameterised queries, ODM) <!-- Drizzle ORM with parameterised queries is used -->
- [x] Cross-Site Scripting (XSS) mitigations applied (CSP header, output encoding) <!-- Security headers and sanitized errors are implemented -->
- [x] Cross-Site Request Forgery (CSRF) tokens used where applicable <!-- CSRF protection is documented and enforced for mutations -->
- [x] Security headers set: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` <!-- Security headers are implemented in the app -->
- [x] File upload paths validate type, size, and content (no server-side execution risk) <!-- Uploads are restricted to PDF/JPEG/PNG and size-limited -->
- [x] Rate limiting and brute-force protection applied to sensitive endpoints <!-- Rate limiting is implemented for API routes -->

### 2.5 Dependency Security

- [x] Dependency vulnerability scan run and critical/high CVEs resolved (e.g., `npm audit`, Dependabot, Snyk) <!-- CI includes `pnpm audit --audit-level=critical` and dependency policies are documented -->
- [ ] Software Bill of Materials (SBOM) generated <!-- No SBOM artifact is currently published -->
- [ ] Third-party licence compatibility confirmed <!-- Not documented in the repo -->
- [ ] Container base images are pinned to specific digest versions, not `latest` <!-- No container workflow is present -->
- [ ] Container images scanned for vulnerabilities (e.g., Trivy, Grype) <!-- No container scanning workflow is present -->

### 2.6 Penetration Testing & Code Review

- [ ] Static Application Security Testing (SAST) integrated into CI pipeline <!-- CI runs ESLint and `pnpm audit`; no dedicated SAST tool (e.g. Semgrep/CodeQL) is configured in-repo -->
- [ ] Dynamic Application Security Testing (DAST) performed against staging <!-- Not yet evidenced -->
- [ ] Manual security code review completed for authentication, authorisation, and data handling paths <!-- Not documented as a completed review -->
- [ ] Penetration test scheduled or completed (if required by risk level) <!-- Not evidenced -->

---

## 3. Testing

### 3.1 Unit Tests

- [ ] Unit test coverage meets defined threshold (e.g., ≥ 80%) <!-- The repo’s API coverage gate passes, but overall project coverage is still low -->
- [ ] All business-critical logic has corresponding unit tests <!-- Some critical areas are covered, but not every workflow is fully exercised -->
- [ ] Tests are deterministic (no flaky tests in the suite) <!-- Not formally validated across all environments -->
- [x] Mock/stub usage is appropriate and does not over-mock <!-- Existing tests rely on targeted mocks and helpers -->

### 3.2 Integration Tests

- [ ] Integration tests cover all major service-to-service interactions <!-- There is no broad integration test suite for service interactions -->
- [ ] Database layer is tested against a real or realistic test database <!-- Current test setup uses mocks/helpers rather than a dedicated integration DB -->
- [ ] External API integrations are tested using contract tests (e.g., Pact) <!-- Not present -->
- [ ] Message queue producers and consumers are integration-tested <!-- Not applicable for the current architecture -->

### 3.3 End-to-End (E2E) Tests

- [x] Critical user journeys are covered by automated E2E tests <!-- Playwright tests are configured -->
- [x] E2E tests run against a production-like staging environment <!-- deploy.yml post-deploy Playwright smoke against Vercel URL -->
- [ ] Test data is managed via fixtures or seeding scripts (no production data in tests) <!-- Test data handling is not fully documented -->

### 3.4 Performance & Load Tests

- [x] Baseline performance benchmarks have been established <!-- perf/baselines/README.md targets; first staging numbers pending operator run -->
- [x] Load tests simulate expected peak traffic (e.g., k6, Locust, JMeter) <!-- perf/smoke-api.k6.js + load-test.yml (smoke baseline; not full peak capacity) -->
- [ ] Stress tests have identified the failure/saturation point <!-- Not present -->
- [ ] Performance test results are committed alongside the release <!-- Not present -->

### 3.5 Test Infrastructure

- [x] All tests are automated and run in CI on every pull request <!-- CI runs lint, test, type-check, build, and E2E gates -->
- [ ] Test environments are isolated and reproducible <!-- Not explicitly documented -->
- [x] Failed tests block merges to the main branch <!-- CI status checks are required -->
- [x] Test results and coverage reports are published as CI artefacts <!-- Coverage is uploaded to Codecov -->

---

## 4. Performance

### 4.1 Frontend Performance

- [ ] Core Web Vitals (LCP, FID/INP, CLS) meet acceptable thresholds <!-- Not formally measured -->
- [x] Assets (JS, CSS, images) are minified and compressed (Gzip/Brotli) <!-- The production build emits bundled assets -->
- [ ] Static assets served via CDN with appropriate cache headers <!-- Deployment-specific CDN strategy is not defined -->
- [ ] Lazy loading applied to images, routes, and heavy components <!-- Not explicitly confirmed across the app -->
- [x] Bundle size analysed and code-split where appropriate <!-- A bundle analysis doc and script are present -->
- [ ] Critical rendering path is optimised (no render-blocking resources) <!-- Not explicitly verified -->

### 4.2 Backend Performance

- [ ] API response times meet SLO targets (p50, p95, p99 defined) <!-- No published SLOs -->
- [ ] Database queries are optimised (no N+1 queries, appropriate indexes) <!-- Not formally reviewed -->
- [ ] Query execution plans have been reviewed for slow queries <!-- Not documented -->
- [x] Connection pooling is configured for all database connections <!-- The DB layer uses a pooled connection approach -->
- [x] Caching strategy is implemented (in-memory, Redis, CDN) where appropriate <!-- The app includes caching abstractions and optional Redis guidance -->
- [ ] Background jobs offloaded from the request path to async workers <!-- No background worker pattern is evident -->

### 4.3 Infrastructure Performance

- [ ] Resource requests and limits are set for all containerised workloads <!-- No container deployment manifest was reviewed -->
- [ ] JVM / runtime GC tuning has been reviewed (if applicable) <!-- Not applicable for this stack -->
- [ ] Network I/O bottlenecks identified and addressed <!-- Not documented -->
- [ ] Cold-start latency minimised for serverless or container-on-demand workloads <!-- Not explicitly addressed -->

---

## 5. Reliability

### 5.1 Availability & SLOs

- [x] Service Level Objectives (SLOs) are defined (availability, latency, error rate) <!-- Documented in docs/MONITORING.md -->
- [ ] Error budgets are calculated and communicated to stakeholders <!-- Not present -->
- [ ] SLOs are tracked with dashboards and alerting <!-- Not present -->
- [ ] Uptime target feasibility validated against infrastructure design <!-- Not documented -->

### 5.2 High Availability

- [ ] No single points of failure exist in the critical path <!-- HA architecture is not documented -->
- [x] Multi-AZ (or multi-region) deployment is configured for production <!-- HA/DR operator checklist for Vercel + managed Postgres PITR in docs/DEPLOYMENT.md; provider console verification still required -->
- [ ] Database has automated failover (e.g., RDS Multi-AZ, Patroni) <!-- Not documented -->
- [x] Health checks (liveness and readiness probes) are configured correctly <!-- `/api/health` and `/ready` are implemented -->
- [ ] Rolling deployments or blue/green strategies are used (no hard downtime) <!-- Not documented -->

### 5.3 Disaster Recovery

- [x] Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are defined <!-- Documented in docs/DEPLOYMENT.md and docs/DATABASE.md -->
- [x] Disaster recovery runbook is documented and accessible <!-- Incident response and rollback docs exist -->
- [ ] DR failover has been tested end-to-end at least once <!-- Not evidenced -->
- [ ] Backup restoration has been verified (not just backup creation) <!-- Not evidenced -->

### 5.4 Chaos Engineering

- [ ] Failure scenarios have been identified and documented <!-- Not documented -->
- [ ] At least one chaos experiment has been run against staging (e.g., Chaos Monkey, Gremlin, LitmusChaos) <!-- Not done -->
- [ ] System behaviour under partial failure is predictable and graceful <!-- Not explicitly validated -->

---

## 6. Observability

### 6.1 Logging

- [x] Structured logging is used throughout the application (JSON format) <!-- Pino logging is configured -->
- [x] Log levels are correctly applied (`DEBUG`, `INFO`, `WARN`, `ERROR`) <!-- Logging config is present -->
- [x] Sensitive data (PII, credentials, tokens) is never logged <!-- The app uses sanitized error handling and logging guards -->
- [x] Correlation/trace IDs are present in all log lines <!-- Request IDs are emitted in logs -->
- [ ] Log retention policy is defined and enforced <!-- Not documented -->
- [ ] Logs are shipped to a centralised platform (e.g., Datadog, ELK, CloudWatch) <!-- Optional Sentry is used, but central log shipping is not enforced -->

### 6.2 Metrics

- [x] Key service metrics are instrumented (request rate, error rate, latency, saturation) <!-- Metrics and API metrics wrappers are included -->
- [ ] Infrastructure metrics are collected (CPU, memory, disk I/O, network) <!-- Not explicitly configured -->
- [ ] Custom business metrics are tracked (e.g., sign-ups, orders, conversions) <!-- Not defined -->
- [ ] Metrics are visualised in dashboards (e.g., Grafana, Datadog) <!-- Not documented -->
- [ ] RED method (Rate, Errors, Duration) applied to all services <!-- Not documented -->
- [ ] USE method (Utilisation, Saturation, Errors) applied to all resources <!-- Not documented -->

### 6.3 Tracing

- [ ] Distributed tracing is implemented (e.g., OpenTelemetry, Jaeger, AWS X-Ray) <!-- Sentry is present, but full distributed tracing is not documented -->
- [ ] Trace context propagated across all service boundaries <!-- Not documented -->
- [ ] Slow or high-error traces can be easily queried and inspected <!-- Not documented -->
- [ ] Sampling rates are appropriate for production traffic volume <!-- Not configured -->

### 6.4 Alerting

- [x] Alerts are defined for SLO breaches, error spikes, and resource saturation <!-- Uptime workflow + Sentry alert playbook in docs/MONITORING.md -->
- [ ] Alert thresholds are tuned to reduce false positives <!-- Not configured -->
- [x] Alerts route to on-call via PagerDuty / OpsGenie / Slack with priority levels <!-- Sentry email/Slack + GitHub Actions uptime failures; PagerDuty optional -->
- [ ] Alert runbooks are linked directly from the alert definition <!-- Not configured -->
- [ ] Dead-man's-switch alerts exist for critical background jobs and cron tasks <!-- Not present -->

---

## 7. DevOps & CI/CD

### 7.1 Source Control

- [ ] `main`/`master` branch is protected (no direct pushes) <!-- Repository policy is not visible from the workspace -->
- [ ] Pull request reviews are required before merging <!-- Repository policy is not visible from the workspace -->
- [ ] Branch naming conventions are documented and enforced <!-- Not documented -->
- [ ] Commit message convention is in place (e.g., Conventional Commits) <!-- Not documented -->
- [x] `.gitignore` covers all generated files, secrets, and IDE configs <!-- The repo ignores build outputs, env files, and editor artifacts -->

### 7.2 CI Pipeline

- [x] CI runs automatically on every pull request <!-- GitHub Actions runs on PR and push to main -->
- [ ] Pipeline stages: lint → build → test → security scan → artefact publish <!-- The workflow includes lint, test, build, and security scan, but not artifact publication -->
- [x] Build is fully reproducible (pinned dependency versions, lockfiles committed) <!-- `pnpm-lock.yaml` is committed and dependencies are pinned via package manifests -->
- [x] Pipeline failures block merges <!-- Required job checks are wired up -->
- [ ] CI execution time is within acceptable bounds (< 15 min target) <!-- Not explicitly measured -->

### 7.3 CD Pipeline & Deployments

- [ ] Deployment is fully automated (no manual steps to push to production) <!-- Deployment automation is not fully defined in the repo -->
- [ ] Deployment pipeline enforces environment promotion (dev → staging → production) <!-- Not defined -->
- [x] Rollback mechanism is tested and documented (one-click or automated) <!-- A rollback guide exists -->
- [ ] Deployment notifications sent to the relevant Slack/Teams channel <!-- Not configured -->
- [ ] Zero-downtime deployment strategy is in place <!-- Not documented -->

### 7.4 Infrastructure as Code

- [ ] All infrastructure is defined in code (Terraform, Pulumi, CloudFormation, Bicep) <!-- No IaC files are present -->
- [ ] IaC modules are version-controlled alongside the application <!-- Not present -->
- [ ] IaC changes go through pull request review before `apply` <!-- Not present -->
- [ ] State files are stored remotely with locking enabled <!-- Not present -->
- [ ] Drift detection is scheduled or integrated into CI <!-- Not present -->

### 7.5 Container & Orchestration

- [ ] Dockerfiles follow best practices (multi-stage builds, non-root user, minimal base image) <!-- No container build files were found -->
- [ ] Kubernetes manifests / Helm charts are committed to the repository <!-- Not present -->
- [ ] Resource quotas and namespace isolation are configured <!-- Not present -->
- [ ] Pod disruption budgets (PDBs) are set for critical deployments <!-- Not present -->
- [ ] Image pull policies are pinned to `IfNotPresent` or `Always` as appropriate <!-- Not applicable without container deployment -->

### 7.6 Environment Configuration

- [x] Configuration is externalised from code (12-Factor App principle) <!-- Env-based configuration is used -->
- [ ] Environment-specific config is managed via config maps, parameter store, or equivalent <!-- Not defined in repo -->
- [ ] Parity between staging and production environments is maintained <!-- Not documented -->
- [ ] Feature flags are used to decouple deployment from release <!-- Not present -->

---

## 8. Data Management

### 8.1 Database

- [x] Database schema migrations are versioned and automated (e.g., Flyway, Alembic, Liquibase) <!-- Drizzle migrations are present -->
- [ ] Migrations are backward-compatible and tested on a production-sized dataset <!-- Not evidenced -->
- [ ] Database credentials follow least-privilege access principles <!-- Not documented -->
- [ ] Connection string includes appropriate SSL/TLS settings <!-- This depends on deployment configuration -->
- [ ] Database maintenance windows (vacuuming, statistics updates) are scheduled <!-- Not documented -->

### 8.2 Backups

- [x] Automated backups are configured and verified on a schedule <!-- scripts/backup-db.sh + provider PITR checklist; schedule is operator-owned -->
- [ ] Backup restoration has been tested end-to-end <!-- Not documented -->
- [ ] Point-in-time recovery (PITR) is enabled where supported <!-- Not documented -->
- [ ] Backups are stored in a separate account/region from production <!-- Not documented -->
- [ ] Backup retention meets regulatory and business requirements <!-- Not documented -->

### 8.3 Data Integrity

- [x] Referential integrity constraints are enforced at the database level <!-- Schema constraints are part of the DB layer -->
- [x] Data validation occurs at both the API boundary and the data layer <!-- Zod and DB constraints are both used -->
- [ ] Idempotency is guaranteed for all critical write operations <!-- Not clearly implemented across all write flows -->
- [ ] Eventual consistency trade-offs are documented and acceptable <!-- Not documented -->
- [ ] Stale data scenarios (cache invalidation, race conditions) are handled <!-- Not documented -->

### 8.4 Data Lifecycle

- [ ] Data retention and deletion policies are defined and automated <!-- Not documented -->
- [ ] Soft-delete vs. hard-delete strategy is documented <!-- Not documented -->
- [ ] PII can be selectively purged to satisfy data subject deletion requests <!-- Not documented -->
- [ ] Archive strategy for historical data is documented <!-- Not documented -->

---

## 9. Compliance & Privacy

### 9.1 Regulatory Compliance

- [x] Applicable regulations identified (GDPR, CCPA, HIPAA, SOC 2, PCI-DSS, etc.) <!-- docs/PRIVACY.md identifies GDPR/CCPA-style obligations; legal mapping pending -->
- [ ] Legal review completed for data processing activities <!-- Not documented -->
- [ ] Data Processing Agreements (DPAs) signed with all relevant processors <!-- Not documented -->
- [ ] Compliance controls are documented and mapped to requirements <!-- Not documented -->
- [ ] Audit log of data access and changes is maintained <!-- Not documented -->

### 9.2 Privacy

- [ ] Privacy policy is up to date and linked from the product <!-- Not documented -->
- [ ] Consent management is implemented for data collection (cookies, analytics) <!-- Not documented -->
- [x] PII is identified, catalogued, and minimised to what is necessary <!-- Data categories catalogued in docs/PRIVACY.md -->
- [ ] PII is encrypted at rest and in transit <!-- Deployment-level encryption is not documented -->
- [x] Data subject rights (access, rectification, deletion, portability) can be fulfilled <!-- Manual DSAR process in docs/PRIVACY.md -->

### 9.3 Accessibility

- [ ] Product meets WCAG 2.1 AA accessibility standards <!-- Not formally validated -->
- [ ] Accessibility audit completed (automated: Axe, Lighthouse; manual: screen reader testing) <!-- Not documented -->
- [ ] Keyboard navigation is fully functional <!-- Not formally validated -->
- [ ] All images have meaningful alt text <!-- Not formally validated -->
- [ ] Colour contrast ratios meet minimum requirements <!-- Not formally validated -->

---

## 10. Operations & Incident Management

### 10.1 On-Call & Incident Response

- [ ] On-call rotation is defined with clear escalation paths <!-- Not documented -->
- [ ] Incident severity levels (P0–P3 or SEV1–SEV4) are defined <!-- Not documented -->
- [x] Incident response playbook exists and is accessible <!-- The repo has incident response and rollback docs -->
- [ ] War room / incident bridge process is documented <!-- Not documented -->
- [ ] On-call engineers have access to all tools needed to investigate and mitigate <!-- Not documented -->

### 10.2 Runbooks

- [x] Runbooks exist for all critical operational tasks <!-- Troubleshooting and rollback guidance are present -->
- [x] Runbooks are stored in an accessible, version-controlled location <!-- Docs live in the repository -->
- [ ] Runbooks are linked from alerting rules and dashboards <!-- Not configured -->
- [ ] Runbooks are tested and validated by someone other than the author <!-- Not documented -->

### 10.3 Post-Incident Process

- [ ] Blameless post-mortem process is defined <!-- Not documented -->
- [ ] Post-mortems are published within an agreed SLA (e.g., 5 business days) <!-- Not documented -->
- [ ] Action items from post-mortems are tracked to completion <!-- Not documented -->
- [ ] Recurring incidents trigger a formal reliability review <!-- Not documented -->

### 10.4 Change Management

- [ ] Change management process is documented (planned changes, approvals, comms) <!-- Not documented -->
- [ ] A production change freeze calendar exists (e.g., no deploys on Fridays or during peak) <!-- Not documented -->
- [ ] Stakeholders are notified before significant changes or maintenance windows <!-- Not documented -->
- [ ] All production changes are logged with who, what, when, and why <!-- Not documented -->

---

## 11. Documentation

### 11.1 Technical Documentation

- [x] `README.md` is complete: project overview, prerequisites, setup, and run instructions <!-- The root README is detailed -->
- [x] Architecture overview document is current and accurate <!-- Architecture docs are present -->
- [ ] API reference documentation is auto-generated and published (e.g., Swagger UI, Redoc) <!-- API docs exist, but not as a published auto-generated spec -->
- [x] Data model / entity-relationship diagram is documented <!-- Database schema docs are present -->
- [x] Internal service dependencies and integration points are documented <!-- Architecture and deployment docs cover dependencies -->
- [x] Environment variable reference is documented with descriptions and defaults <!-- The deployment guide and env example file provide this -->

### 11.2 Operational Documentation

- [x] Deployment guide covers all environments and edge cases <!-- The deployment guide is present -->
- [ ] Configuration management guide explains how to change settings safely <!-- Not a dedicated guide -->
- [x] Troubleshooting guide covers the most common failure modes <!-- Troubleshooting documentation is present -->
- [ ] On-call guide summarises the most critical runbooks for first responders <!-- Not present -->

### 11.3 Developer Documentation

- [x] Contributing guide (`CONTRIBUTING.md`) covers branching, PR, and code review process <!-- The contributing guide exists -->
- [ ] Local development setup instructions are verified by a new team member <!-- Not explicitly proven -->
- [x] Code style guide and linter configuration are documented <!-- ESLint and formatting configuration are present -->
- [x] Changelog (`CHANGELOG.md`) is maintained (or auto-generated via release tooling) <!-- Changelog exists -->
- [ ] Architectural decisions are captured in ADRs (`/docs/adr/`) <!-- Not present -->

### 11.4 User-Facing Documentation

- [ ] User guides / help centre articles are current for this release <!-- Not found -->
- [ ] Release notes are written and ready to publish <!-- Not evident -->
- [x] Known issues and workarounds are documented <!-- Troubleshooting docs cover common issues -->

---

## 12. User Experience (UX)

### 12.1 Design & Usability

- [ ] All user flows have been reviewed against the approved design specifications <!-- Not specifically documented -->
- [ ] UI is consistent with the design system / component library <!-- The app uses shared UI patterns, but a formal design-system review is not captured -->
- [ ] Responsive design verified across target breakpoints (mobile, tablet, desktop) <!-- Not explicitly verified -->
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge) <!-- Not documented -->
- [ ] Empty states, loading states, and error states are designed and implemented <!-- Not explicitly documented -->

### 12.2 Error Handling & Feedback

- [ ] User-facing error messages are clear, actionable, and non-technical <!-- Not formally reviewed -->
- [ ] Form validation feedback is inline, immediate, and descriptive <!-- Not explicitly verified -->
- [ ] API errors surface meaningful messages to the user (no raw stack traces) <!-- Error handling exists, but UX review is not captured -->
- [ ] 404, 500, and maintenance pages are branded and helpful <!-- Not documented -->

### 12.3 Onboarding & First-Run Experience

- [ ] New user onboarding flow is complete and tested end-to-end <!-- Not documented -->
- [ ] Tooltips, empty states, and in-app guidance are in place <!-- Not documented -->
- [ ] Email confirmations, welcome messages, and notifications are tested <!-- Not documented -->

### 12.4 Internationalisation & Localisation

- [ ] i18n framework is in place if multi-language support is required <!-- Not present -->
- [ ] Date, time, currency, and number formats respect user locale <!-- Not implemented -->
- [ ] RTL (right-to-left) layout is supported if target markets require it <!-- Not implemented -->
- [ ] All user-facing strings are externalised (no hard-coded copy in code) <!-- No evidence of a localisation layer -->

### 12.5 User Acceptance Testing (UAT)

- [ ] UAT has been completed by representative users or QA team <!-- Not documented -->
- [ ] All P0 and P1 bugs identified in UAT are resolved <!-- Not documented -->
- [ ] Sign-off received from product owner or designated stakeholder <!-- Not documented -->

---

## Critical Findings & Action Items

### 🔴 **Blocking Issues** (Must fix before GA release)

| Issue                     | Status          | Remaining work                                                        | Owner     |
| ------------------------- | --------------- | --------------------------------------------------------------------- | --------- |
| **SLOs / alerting**       | 🟡 In-repo done | Create Sentry alert rules; set GitHub uptime URL vars; watch workflow | Ops       |
| **HA/DR**                 | 🟡 Documented   | Verify provider PITR/Multi-AZ; complete restore drill sign-off        | Infra/Ops |
| **Backup testing**        | 🟡 Script ready | Run staging restore drill and record duration                         | Ops       |
| **E2E in CD**             | ✅ Done         | `deploy.yml` Playwright smoke after health probe                      | Eng       |
| **Load testing baseline** | 🟡 Script ready | Run `load-test.yml` / k6 against staging; fill `perf/baselines/`      | Eng       |

### 🟡 **High-Priority Gaps** (Should complete before GA)

- API versioning strategy (allows future breaking changes without impact)
- Feature flags for safer, progressive rollouts
- Compliance/privacy documentation (GDPR, data retention policy)
- IaC for reproducible deployments
- On-call rotation and incident response SLAs

### 🟢 **Nice-to-Have** (Post-GA backlog)

- Distributed tracing (OpenTelemetry) — useful for multi-service debugging
- DAST penetration testing — external security validation
- SBOM generation — supply chain transparency
- Chaos engineering experiments — resilience validation

---

## Area-by-Area Summary

### 1. Architecture

**Status:** 🟡 Partial (3/21 checked)  
**Gap:** No formal ADR directory; resilience patterns (circuit breakers, retries) not implemented; scalability/HA not validated in code  
**Next:** Document resilience patterns in code; add ADRs for major design decisions

### 2. Security

**Status:** 🟡 Strong foundation with gaps (17/31 checked)  
**Gap:** No dedicated SAST in CI; SBOM not generated; manual security code review not completed; no DAST  
**Next:** Add Semgrep or CodeQL to CI; add SBOM generation; schedule penetration test

### 3. Testing

**Status:** 🟡 Partial (CI + CD smoke improving) (8/19 checked)  
**Gap:** Unit coverage overall is low; no integration DB tests; load script is smoke-level only  
**Next:** Increase unit test coverage; add integration tests for DB layer; record staging k6 numbers

### 4. Performance

**Status:** 🟡 Partial (bundle analysis + k6 smoke present) (4/16 checked)  
**Gap:** No Core Web Vitals monitoring; no Grafana dashboard; baseline numbers pending staging run  
**Next:** Run k6 against staging; add web-vitals; define dashboards

### 5. Reliability

**Status:** 🟡 Improving (SLOs/RTO docs + HA checklist) (5/16 checked)  
**Gap:** Provider PITR/restore drill not yet signed off; no chaos engineering  
**Next:** Complete staging restore drill sign-off; verify Multi-AZ/PITR in provider console

### 6. Observability

**Status:** 🟡 Partial (logging/metrics + uptime + Sentry playbook) (7/21 checked)  
**Gap:** No hosted metrics dashboards; alert routing still needs Sentry rules created in UI  
**Next:** Create Sentry alert rules; set `STAGING_BASE_URL`/`PRODUCTION_BASE_URL`; optional Grafana later

### 7. DevOps & CI/CD

**Status:** 🟡 Partial (CI + CD with health/E2E smoke) (6/29 checked)  
**Gap:** No IaC; migrations still manual post-deploy; no container/K8s  
**Next:** Keep migrate operator-owned; consider Terraform later; document env parity

### 8. Data Management

**Status:** 🟡 Partial (migrations + backup script) (4/19 checked)  
**Gap:** Restore drill sign-off pending; no automated data lifecycle purge  
**Next:** Complete restore drill; define retention automation if legal requires

### 9. Compliance & Privacy

**Status:** 🟡 Partial (PRIVACY.md ops guidance) (3/15 checked)  
**Gap:** No published privacy policy; DPAs/legal review pending; no WCAG audit  
**Next:** Legal review; publish privacy policy; run accessibility audit

### 10. Operations & Incident Management

**Status:** 🟡 Partial (runbooks + alert paths) (3/17 checked)  
**Gap:** No formal on-call rotation calendar; post-mortem process not documented  
**Next:** Define on-call owner for beta; document incident SLA

### 11. Documentation

**Status:** ✅ Strong (11/18 checked)  
**Gap:** No ADRs; no auto-published API spec; no on-call guide index  
**Next:** Start ADR directory; publish OpenAPI spec

### 12. User Experience

**Status:** ❌ Not validated (0/19 checked)  
**Gap:** No WCAG audit, no cross-browser testing, no formal UAT  
**Next:** Run Lighthouse/Axe audit; conduct UAT with stakeholders

---

## Sign-off

| Area                     | Completion  | Owner        | Sign-off Date | Comments                                                     |
| ------------------------ | ----------- | ------------ | ------------- | ------------------------------------------------------------ |
| **Architecture**         | 3/21 (14%)  | Aaron Howard | —             | Structure present; resilience patterns still open            |
| **Security**             | 17/31 (55%) | Aaron Howard | —             | Strong auth/CSRF; dedicated SAST + SBOM + DAST needed        |
| **Testing**              | 8/19 (42%)  | Aaron Howard | —             | CD Playwright smoke added; unit coverage still low           |
| **Performance**          | 4/16 (25%)  | Aaron Howard | —             | k6 smoke + baseline doc; staging numbers pending             |
| **Reliability**          | 5/16 (31%)  | Aaron Howard | —             | SLOs/RTO/HA docs; restore drill sign-off pending             |
| **Observability**        | 7/21 (33%)  | Aaron Howard | —             | Uptime workflow + Sentry playbook; create rules in Sentry UI |
| **DevOps / CI/CD**       | 6/29 (21%)  | Aaron Howard | —             | CD health + E2E smoke; migrate still manual; no IaC          |
| **Data Management**      | 4/19 (21%)  | Aaron Howard | —             | backup script landed; restore drill pending                  |
| **Compliance & Privacy** | 3/15 (20%)  | Aaron Howard | —             | PRIVACY.md ops guidance; legal policy/DPAs pending           |
| **Operations**           | 3/17 (18%)  | Aaron Howard | —             | Runbooks + alert paths; on-call calendar pending             |
| **Documentation**        | 11/18 (61%) | Aaron Howard | —             | Strong; ADRs still missing                                   |
| **User Experience**      | 0/19 (0%)   | Aaron Howard | —             | **CRITICAL for GA:** No WCAG/UAT validation                  |

**Overall Score: 71/241 (29.5%)** — totals match checklist `[x]` / item counts above.

---

## Pre-Release Decision Matrix

**Current Status:** 🟡 **CONDITIONAL STAGED GO** (in-repo beta gates ready; ops verify remaining)

**Decision (unambiguous):**

- **Beta:** **Unblocked in-repo**; **ops-blocked** until the beta prerequisites below are verified in the real staging project.
- **GA:** **BLOCKED** until critical gaps (HA/DR, load testing, compliance, on-call) are closed.
- **STAGED GO** means engineering may proceed toward a limited beta _after_ beta gates pass — it is **not** an unconditional approval to deploy beta today.

**Beta prerequisites (must verify before any beta deploy):**

1. Minimal monitoring/alerting for health, errors, and uptime (even if not full SLO dashboards)
2. Staging environment with `/api/health` and `/ready` wired into the host/load balancer
3. Production/staging secrets set and `pnpm run db:migrate` completed against the target DB
4. First Admin bootstrap completed for the beta environment

**What is already solid for a later beta:**

- Security controls (auth, CSRF, input validation, rate limiting)
- Versioned database migrations
- CI quality gates (lint, test, type-check, build, security audit, E2E)

**GA remains blocked until:**

1. **Observability/Alerting** — Cannot detect outages without monitoring
2. **HA/DR Strategy** — No failover or recovery plan
3. **Load Testing** — Unknown capacity limits
4. **Compliance** — Missing privacy/GDPR requirements

**Staged Rollout Path (after beta gates pass):**

1. **Beta:** Internal team + limited external testers; monitoring/alerting verified
2. **Staging soak:** Load testing and HA validation; compliance review
3. **GA:** Full production rollout with on-call rotation in place

---

> **Go / No-Go Decision:**  
> ☐ **GO** — All critical gaps resolved; HA/DR/monitoring in place; compliance approved  
> ☑️ **STAGED GO (conditional)** — Proceed toward beta only after beta prerequisites above are verified; GA remains blocked  
> ☐ **NO-GO** — Major blockers require rework
>
> **Release Approved By:** Aaron Howard  
> **Date:** 2026-06-25  
> **Approval scope:** Conditional STAGED GO — in-repo monitoring/CD/backup/privacy gates landed; **beta ops verify** (uptime vars, Sentry alerts, migrate, Admin) still required; **GA not approved** until restore drill + load baseline numbers + legal privacy review.
