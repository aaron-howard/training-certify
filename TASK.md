# Task Breakdown - Training Certify Code Improvements

This document provides a detailed, actionable task list for implementing the improvements outlined in `PLAN.md`. Each task includes specific file paths, code examples, and acceptance criteria.

---

## Review Findings (Feb 5, 2026)

- [x] Remove remaining `any` usage in route handlers and client routes
   - `src/routes/certification-management.tsx`
   - `src/routes/catalog.tsx`
   - `src/routes/index.tsx`
   - `src/routes/team-management.tsx`
   - `src/routes/api.teams.ts`
- [x] Replace `catch (error: any)` with `unknown` + safe message extraction
   - `src/routes/ready.ts`
   - `src/routes/metrics.ts`
   - `src/routes/health.ts`
- [x] Tighten test factory typing for mocked DB helpers
   - `src/test/factories.ts`

## High Priority Tasks

### Task 1: Strengthen Input Validation in Certifications API

**Files Affected:**
- `src/api/certifications.server.ts`

**Current Code (Lines 43-49):**
```typescript
export const createCertification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): CreateCertificationInput => {
    if (typeof data === 'object' && data !== null) {
      return data as CreateCertificationInput  // ⚠️ Weak validation
    }
    throw new Error('Invalid input data')
  })
```

**Required Changes:**
1. Import `CreateUserCertificationSchema` from `src/lib/validation.ts`
2. Replace type assertion with Zod schema validation:
   ```typescript
   .inputValidator((data: unknown) => {
     return CreateUserCertificationSchema.parse(data)
   })
   ```
3. Update `updateCertification` validator similarly (lines 108-119)
4. Create `UpdateCertificationInputSchema` in `src/lib/validation.ts` if needed

**Acceptance Criteria:**
- [ ] `createCertification` uses `CreateUserCertificationSchema.parse()`
- [ ] `updateCertification` uses proper Zod schema validation
- [ ] Invalid input returns clear validation error messages
- [ ] TypeScript types are inferred from Zod schemas
- [ ] All tests pass

**Estimated Time:** 2-3 hours

---

### Task 2: Fix Error Handling Inconsistencies

**Files Affected:**
- `src/api/certifications.server.ts` (line 24)
- All API routes that return empty arrays on error

**Current Code (Line 22-25):**
```typescript
} catch (error) {
  console.error('❌ [Server] Failed to fetch user certifications:', error)
  return []  // ⚠️ Masks errors
}
```

**Required Changes:**
1. Replace `return []` with `throw new DatabaseError(...)` or appropriate `AppError` subclass
2. Ensure all error handlers throw exceptions instead of returning error states
3. Update frontend to handle errors properly

**Acceptance Criteria:**
- [ ] No API routes return empty arrays on error
- [ ] All errors throw `AppError` subclasses
- [ ] Error messages are descriptive and actionable
- [ ] Frontend handles errors gracefully

**Estimated Time:** 3-4 hours

---

### Task 3: Add Explicit Types to Callback Parameters

**Files Affected:**
- `src/routes/notifications.tsx` (if exists)
- `src/routes/team-management.tsx` (if exists)
- Any route files with `.map()` callbacks

**Current Problem:**
```typescript
items.map((item) => { ... })  // ⚠️ item has implicit any type
```

**Required Changes:**
1. Add explicit types to all `.map()`, `.filter()`, `.reduce()` callbacks
2. Use inferred types from Drizzle ORM where possible
3. Create type aliases for complex types

**Example Fix:**
```typescript
items.map((item: UserCertification) => { ... })
// Or better:
items.map((item) => { ... })  // Type inferred from items: UserCertification[]
```

**Acceptance Criteria:**
- [ ] No implicit `any` types in callback parameters
- [ ] TypeScript strict mode passes without errors
- [ ] All types are explicit or properly inferred

**Estimated Time:** 2-3 hours

---

### Task 4: Replace Remaining `any` Types

**Files Affected:**
- `src/db/db.server.ts` (if any remain)
- `src/routes/api.*.ts` files
- `src/api/certifications.server.ts`

**Required Changes:**
1. Search codebase for `any` types: `grep -r "\\bany\\b" src/`
2. Replace each `any` with:
   - Proper type if known
   - `unknown` with type guard if type is dynamic
3. Use Drizzle's inferred types: `typeof users.$inferSelect`

**Acceptance Criteria:**
- [ ] Zero `any` types in API and route files
- [ ] All types are explicit or properly inferred
- [ ] TypeScript compilation succeeds

**Estimated Time:** 4-6 hours

---

### Task 5: Standardize Database Access Pattern

**Files Affected:**
- All files using `getDb()` with null checks

**Current Pattern:**
```typescript
const db = await getDb()
if (!db) throw new Error('Database not available')
```

**Required Changes:**
1. Replace all `getDb()` + null check with `getDbOrThrow()`
2. Remove redundant null checks
3. Ensure `getDbOrThrow()` throws descriptive errors

**Acceptance Criteria:**
- [ ] All database access uses `getDbOrThrow()`
- [ ] No redundant null checks
- [ ] Error messages are descriptive

**Estimated Time:** 1-2 hours

---

## Medium Priority Tasks

### Task 6: Harden CSRF Protection

**Files Affected:**
- `src/lib/csrf.server.ts` (lines 56-62)

**Current Code:**
```typescript
export function requireCSRFToken(token: string | null): void {
  const secret = process.env.CSRF_SECRET

  if (!secret) {
    console.warn('⚠️  CSRF_SECRET not configured - CSRF protection disabled')
    return  // ⚠️ Silently disables protection
  }
```

**Required Changes:**
1. Throw error in production if `CSRF_SECRET` is missing
2. Only allow silent disable in development mode
3. Add check at application startup to fail fast

**Acceptance Criteria:**
- [ ] CSRF protection fails fast in production
- [ ] Development mode allows graceful degradation
- [ ] Startup check validates CSRF_SECRET is set

**Estimated Time:** 1-2 hours

---

### Task 7: Implement Database-Backed Rate Limiting

**Files Affected:**
- `src/lib/rateLimit.server.ts`
- Database schema (add rate_limit_logs table if needed)

**Current Implementation:**
- In-memory only, doesn't work across multiple instances

**Required Changes:**
1. Option A: Use database table for rate limit tracking
   - Create `rate_limit_logs` table
   - Store requests with timestamp and identifier
   - Clean up old entries periodically
2. Option B: Use Redis (if available)
   - Install `ioredis` or `redis` package
   - Replace in-memory Map with Redis
3. Keep in-memory as fallback for development

**Acceptance Criteria:**
- [ ] Rate limiting works across multiple server instances
- [ ] Rate limit data persists across restarts
- [ ] Performance is acceptable (< 10ms overhead)
- [ ] In-memory fallback for development

**Estimated Time:** 4-6 hours

---

### Task 8: Increase Database Connection Pool Size

**Files Affected:**
- `src/db/db.server.ts` (line 54)

**Current Code:**
```typescript
max: parseInt(process.env.DB_POOL_SIZE || '2', 10), // Too small
```

**Required Changes:**
1. Change default to 10 for production
2. Keep 2 for development
3. Add environment variable `DB_POOL_SIZE` documentation
4. Add connection pool monitoring/logging

**Acceptance Criteria:**
- [ ] Default pool size is 10 in production
- [ ] Development uses smaller pool (2)
- [ ] Pool size is configurable via environment variable
- [ ] Pool usage is logged/monitored

**Estimated Time:** 1 hour

---

### Task 9: Add Database Connection Retry Logic

**Files Affected:**
- `src/db/db.server.ts`

**Required Changes:**
1. Implement exponential backoff retry for connection failures
2. Retry transient errors (ECONNREFUSED, ETIMEDOUT)
3. Don't retry permanent errors (authentication failures)
4. Add max retry attempts (3-5)
5. Log retry attempts

**Acceptance Criteria:**
- [ ] Transient connection errors are retried
- [ ] Exponential backoff is implemented
- [ ] Permanent errors fail fast
- [ ] Retry attempts are logged

**Estimated Time:** 3-4 hours

---

### Task 10: Enhance Date Validation

**Files Affected:**
- `src/lib/validation.ts`

**Current Code:**
```typescript
issueDate: z.string().optional().nullable(), // ⚠️ No format validation
expirationDate: z.string().optional().nullable(),
```

**Required Changes:**
1. Add ISO 8601 date format validation:
   ```typescript
   issueDate: z.string().datetime().optional().nullable(),
   expirationDate: z.string().datetime().optional().nullable(),
   ```
2. Or use `z.coerce.date()` if accepting multiple formats
3. Update all date fields in schemas

**Acceptance Criteria:**
- [ ] All date fields validate ISO 8601 format
- [ ] Invalid dates return clear error messages
- [ ] Date parsing is consistent across codebase

**Estimated Time:** 2-3 hours

---

### Task 11: Add String Length Limits

**Files Affected:**
- `src/lib/validation.ts`

**Required Changes:**
1. Add `.max()` constraints to string fields:
   - Names: max 255 characters
   - Descriptions: max 1000 characters
   - URLs: max 2048 characters
   - IDs: appropriate limits based on usage
2. Document limits in schema comments

**Acceptance Criteria:**
- [ ] All string fields have appropriate length limits
- [ ] Limits prevent DoS attacks
- [ ] Error messages indicate max length

**Estimated Time:** 2-3 hours

---

### Task 12: Add UUID Validation

**Files Affected:**
- `src/lib/validation.ts`
- API routes accepting UUIDs

**Required Changes:**
1. Use `z.string().uuid()` for all UUID fields
2. Update schemas that accept IDs:
   - `UpdateUserCertificationDetailsSchema`
   - `AddCertificationProofSchema`
   - Any other schemas with UUID fields

**Acceptance Criteria:**
- [ ] All UUID fields use `.uuid()` validation
- [ ] Invalid UUIDs return clear error messages
- [ ] Validation happens before database queries

**Estimated Time:** 1-2 hours

---

## Low Priority Tasks

### Task 13: Extract Duplicate Logic

**Files Affected:**
- Multiple route files with similar patterns

**Required Changes:**
1. Identify duplicate code patterns:
   - User role checks
   - CSRF token validation
   - Rate limiting setup
   - Error handling patterns
2. Extract into reusable utility functions
3. Update all routes to use utilities

**Acceptance Criteria:**
- [ ] No duplicate logic in route files
- [ ] Utilities are well-documented
- [ ] All routes use extracted utilities

**Estimated Time:** 4-6 hours

---

### Task 14: Add JSDoc Comments

**Files Affected:**
- Complex functions throughout codebase
- API route handlers
- Database utility functions

**Required Changes:**
1. Add JSDoc comments to:
   - All exported functions
   - Complex algorithms
   - API route handlers
   - Database operations
2. Include:
   - Description
   - Parameters with types
   - Return type
   - Throws documentation
   - Examples where helpful

**Example:**
```typescript
/**
 * Creates a new user certification record.
 * 
 * @param data - Certification data validated against CreateUserCertificationSchema
 * @returns The created certification with all fields populated
 * @throws {ValidationError} If input data is invalid
 * @throws {DatabaseError} If database operation fails
 */
```

**Acceptance Criteria:**
- [ ] All complex functions have JSDoc comments
- [ ] Comments include parameter and return types
- [ ] Error conditions are documented

**Estimated Time:** 6-8 hours

---

### Task 15: Add Integration Tests for API Routes

**Files Affected:**
- Test files (create if needed)
- `vitest.config.ts` (may need updates)

**Required Changes:**
1. Create test files for each API route:
   - `src/routes/__tests__/api.users.test.ts`
   - `src/routes/__tests__/api.certifications.test.ts`
   - etc.
2. Test scenarios:
   - Valid requests
   - Invalid input validation
   - Authentication/authorization
   - Error handling
   - Edge cases
3. Use test database or mocks

**Acceptance Criteria:**
- [ ] All API routes have integration tests
- [ ] Test coverage > 80% for API layer
- [ ] Tests run in CI/CD pipeline
- [ ] Tests are fast and reliable

**Estimated Time:** 8-12 hours

---

### Task 16: Add Health Check Endpoint

**Files Affected:**
- `src/routes/api.health.ts` (new file)

**Required Changes:**
1. Create health check endpoint:
   - Check database connectivity
   - Check environment variables
   - Return status and details
2. Use for monitoring/load balancers

**Acceptance Criteria:**
- [ ] Health check endpoint exists at `/api/health`
- [ ] Checks database connectivity
- [ ] Returns appropriate status codes
- [ ] Used by monitoring systems

**Estimated Time:** 2-3 hours

---

## Task Dependencies

```
Task 1 (Input Validation) ──┐
                              ├──> Task 2 (Error Handling)
Task 3 (Explicit Types) ──────┘

Task 6 (CSRF) ──> Task 7 (Rate Limiting)

Task 8 (Pool Size) ──> Task 9 (Retry Logic)

Task 10 (Date Validation) ──┐
Task 11 (String Limits) ────┼──> Task 12 (UUID Validation)
                             └──> All use src/lib/validation.ts

Task 13 (Extract Logic) ──> Task 14 (JSDoc Comments)

Task 15 (Tests) depends on all above tasks
```

---

## Progress Tracking

### High Priority
- [x] Task 1: Strengthen Input Validation
- [x] Task 2: Fix Error Handling
- [x] Task 3: Add Explicit Types
- [x] Task 4: Replace `any` Types (main API/route files completed)
- [x] Task 5: Standardize Database Access

### Medium Priority
- [x] Task 6: Harden CSRF Protection
- [x] Task 7: Database-Backed Rate Limiting
- [x] Task 8: Increase Pool Size
- [x] Task 9: Add Retry Logic
- [x] Task 10: Enhance Date Validation
- [x] Task 11: Add String Length Limits
- [x] Task 12: Add UUID Validation

### Low Priority
- [x] Task 13: Extract Duplicate Logic (api-helpers.server.ts created)
- [x] Task 14: Add JSDoc Comments (key functions documented)
- [ ] Task 15: Add Integration Tests
- [x] Task 16: Add Health Check Endpoint

---

## Notes

- Tasks should be completed in priority order
- High priority tasks block production readiness
- Medium priority tasks improve security and reliability
- Low priority tasks improve maintainability
- Each task should be completed and tested before moving to the next
- Use feature branches for each task
- Update this document as tasks are completed

---

## References

- [PLAN.md](PLAN.md) - Strategic improvement plan
- [CODE_REVIEW.md](CODE_REVIEW.md) - Original code review findings
- [src/lib/validation.ts](src/lib/validation.ts) - Validation schemas
- [src/lib/errors.ts](src/lib/errors.ts) - Error classes
