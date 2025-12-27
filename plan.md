# Implementation Plan: Resolve Security, Performance, and Code Quality Issues

## Overview

This plan addresses all identified issues across security, authentication/authorization, database configuration, environment handling, error/logging consistency, type safety, and performance. Work is sequenced to secure the application, then improve robustness and maintainability for local development.

## Phases & Tasks

### Phase 1: Secure Development Environment (Day 1)
- Protect env files
  - Update `.gitignore` to ensure all `.env*` files are excluded (keep `.env.example`).
- DevTools Configuration
  - Disable DevTools in production builds using `import.meta.env.DEV` guards.
- Database Connection Hygiene
  - Standardize on `pg` Pool configuration for local PostgreSQL instance in Docker.

### Phase 2: Server-Side AuthN/AuthZ (Day 1–2)
- Add `src/lib/auth.ts`
  - `requireAuth(request)`: validates session via Clerk server API.
  - `requireRole(request, role)`: enforces role using DB-backed user record.
- Secure API endpoints
  - Update all handlers in `src/api/` to call `requireAuth()` and filter by `auth.userId`.
  - Protect admin-only endpoints (role updates, catalog mutations) via `requireRole(..., 'Admin')`.
- Ensure user bootstrap
  - Confirm `ensureUser` persists Clerk user with default role and is only callable by the authenticated user.

### Phase 3: Type Safety & Validation (Day 2)
- Introduce validation with Zod
  - Add `zod` dependency; create `src/lib/validation.ts` with schemas for inputs/outputs.
  - Replace `inputValidator` inline casts with Zod schemas.
- Remove `any` types
  - Define `RouterContext` (with `QueryClient`) and proper props for components; update occurrences of `any` in routes/components.
- Normalize date and status fields
  - Standardize serialization (ISO strings) and enum-like types.

### Phase 4: Error Handling & Logging (Day 2–3)
- Standardize API responses
  - Add `src/lib/errors.ts` with `ApiError`, `ApiResponse<T>`, error codes; return consistent structures from handlers.
- Replace console logging
  - Add `src/lib/logger.ts` with environment-aware structured logging; remove `console.log/error` across codebase.
- Strengthen DB access patterns
  - Make `getDb()` non-nullable on server; throw explicit errors instead of returning `null`.
- Add route-level error boundaries
  - Provide per-route boundaries and user-friendly error UI while capturing logs.

### Phase 5: Database & Environment Config (Day 3)
- Simplify environment loading
  - Use `process.env` on server and `import.meta.env` for client; remove manual FS parsing.
  - Validate env with Zod at startup; fail fast if required vars missing.
- Transactions & helpers
  - Use `db.transaction()` for multi-step mutations (e.g., create certification + audit log).
  - Replace raw SQL string filters with Drizzle helpers like `inArray`.
- Health checks
  - Add `checkDbHealth` server function; optionally log pool stats.

### Phase 6: Performance & Query Hygiene (Day 4)
- React Query defaults
  - Configure `staleTime`, `gcTime`, `retry`, `refetchOnWindowFocus` in router/bootstrap.
- Component optimization
  - Wrap expensive components in `React.memo` and use `useCallback` for handlers.
- Environment-tuned pool
  - Allow pool size override via env for local dev contexts.

## Milestone Deliverables
- Project configured for local-only development using Docker.
- All API endpoints enforce server-side auth; user-specific row-level data access.
- Zod validation for all inputs; `any` eliminated in public props/contexts.
- Consistent `ApiResponse<T>` error handling; centralized logger.
- DB pooling configured for local PostgreSQL; transactions for multi-step mutations; health check endpoint.
- React Query defaults and component memoization in place.

## Risk & Mitigation
- Auth rollout risk: stage via feature flags or deploy after thorough QA locally.
- Refactor scope creep: prioritize endpoints with sensitive data first; track progress per route.

## Optional Enhancements
- Add Sentry for error/performance monitoring.
- Implement rate limiting and CORS hardening for server functions.
- Add E2E tests (Playwright) for critical flows (auth, CRUD ops, role changes).

## Sequencing Summary
1. Secure dev (DevTools, pool) → 2. Server auth → 3. Types/validation → 4. Errors/logging → 5. DB/env → 6. Performance.

## Quick Checks Post-Implementation
- Verify authenticated requests return only the caller’s data.
- Confirm admin-only actions are blocked for non-admins.
- Validate DB pool does not exceed limits under load.
- Confirm reduced log volume and structured error logs.
