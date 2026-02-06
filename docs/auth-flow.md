# Authentication & Authorization Flow

## Overview

Training Certify uses [Clerk](https://clerk.com/) for authentication and implements role-based access control (RBAC) for authorization.

## Authentication Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│    Clerk     │────────▶│  Training   │
│  (Browser)  │         │  (Auth API)  │         │   Certify   │
└─────────────┘         └──────────────┘         └─────────────┘
     │                         │                        │
     │                         │                        │
     │ 1. Sign In             │                        │
     ├────────────────────────▶│                        │
     │                         │                        │
     │ 2. JWT Token            │                        │
     │◀────────────────────────┤                        │
     │                         │                        │
     │ 3. API Request + Token  │                        │
     │─────────────────────────────────────────────────▶│
     │                         │                        │
     │                         │ 4. Verify Token        │
     │                         │◀───────────────────────┤
     │                         │                        │
     │                         │ 5. User Info           │
     │                         │───────────────────────▶│
     │                         │                        │
     │ 6. Response              │                        │
     │◀─────────────────────────────────────────────────┤
```

## Authentication Flow

### 1. User Sign-In

1. User navigates to `/sign-in`
2. Clerk authentication UI is displayed
3. User authenticates (email/password, OAuth, etc.)
4. Clerk issues a JWT token

### 2. Token Storage

- JWT token is stored in HTTP-only cookies (managed by Clerk)
- Token is automatically included in API requests via `Authorization` header
- Token contains user ID and session information

### 3. API Request Authentication

When a user makes an API request:

```typescript
// 1. Request includes Authorization header
GET /api/users
Authorization: Bearer <jwt-token>

// 2. Server verifies token using Clerk SDK
import { auth } from '@clerk/tanstack-react-start/server'
const authObj = await auth()
const userId = authObj.userId

// 3. If valid, proceed with request
// 4. If invalid, return 401 Unauthorized
```

### 4. User Record Sync

After authentication, the user record is synced to the local database:

```typescript
// Called automatically on first sign-in
POST /api/users
{
  "id": "user_clerk_123",
  "name": "John Doe",
  "email": "john@example.com"
}

// Creates or updates user record in database
```

## Authorization Flow

### Role-Based Access Control (RBAC)

The system uses five roles:

1. **Admin** - Full system access
2. **Manager** - Team management access
3. **Executive** - Executive dashboard access
4. **Auditor** - Read-only audit access
5. **User** - Standard user access

### Authorization Check Flow

```
┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify Auth    │
│  (getVerifiedAuth)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Get User       │──────▶│  Database    │
│  (getAuthenticatedUser)│              │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Check Role     │
│  (requireRole)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Allowed  Forbidden
    │         │
    │         └──▶ 403 Forbidden
    │
    ▼
  Process Request
```

### Authorization Implementation

#### 1. Role Check Helper

```typescript
// src/lib/auth.server.ts
export async function requireRole(
  allowedRoles: Array<string>,
): Promise<AuthSession> {
  // 1. Get authenticated user
  const session = await getAuthenticatedUser()

  // 2. Check if user's role is in allowed list
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(
      `Required one of [${allowedRoles.join(', ')}] but user has [${session.role}]`,
    )
  }

  // 3. Return session if authorized
  return session
}
```

#### 2. Usage in API Routes

```typescript
// Example: Admin-only endpoint
export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async () => {
        // Require Admin, Auditor, or Executive role
        await requireRole(['Admin', 'Auditor', 'Executive'])

        // Proceed with request
        const users = await db.select().from(users)
        return json(users)
      },
    },
  },
})
```

### Resource-Level Authorization

Some endpoints check if a user has authority over a specific resource:

#### Example: User Certifications

```typescript
async function checkAuthority(
  db: Database,
  requester: AuthSession,
  targetUserId: string,
): Promise<boolean> {
  // 1. User can access their own resources
  if (requester.userId === targetUserId) return true

  // 2. Admins and Auditors can access any resource
  if (['Admin', 'Auditor', 'Executive'].includes(requester.role)) {
    return true
  }

  // 3. Managers can access resources of their team members
  if (requester.role === 'Manager') {
    const managedTeams = await getManagedTeams(db, requester.userId)
    const isMember = await isUserInTeams(db, targetUserId, managedTeams)
    return isMember
  }

  return false
}
```

## Security Features

### 1. CSRF Protection

All mutation endpoints (POST, PATCH, DELETE) require CSRF tokens:

```typescript
// Client sends CSRF token in header
X-CSRF-Token: <csrf-token>

// Server validates token
requireCSRFToken(getCSRFTokenFromRequest(request))
```

### 2. Rate Limiting

Different endpoints have different rate limits:

- **AUTH**: 5 requests/minute
- **MUTATION**: 30 requests/minute
- **READ**: 100 requests/minute
- **EXPORT**: 5 requests/minute
- **ADMIN**: 50 requests/minute

### 3. Token Validation

- Tokens are validated on every request
- Expired tokens are rejected
- Invalid tokens return 401 Unauthorized

## Error Responses

### 401 Unauthorized

Returned when:

- No authentication token provided
- Token is invalid or expired
- User not found in database

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden

Returned when:

- User is authenticated but lacks required role
- User tries to access another user's resource without permission

```json
{
  "error": "Forbidden: Required one of [Admin] but user has [User]",
  "code": "FORBIDDEN"
}
```

## Session Management

### Session Lifecycle

1. **Sign-In**: User authenticates with Clerk
2. **Token Issuance**: Clerk issues JWT token
3. **Token Storage**: Token stored in HTTP-only cookie
4. **Token Refresh**: Clerk automatically refreshes tokens
5. **Sign-Out**: Token invalidated, session ended

### Session Data

The `AuthSession` interface contains:

```typescript
interface AuthSession {
  userId: string // Clerk user ID
  role: string // User role (Admin, Manager, etc.)
  email?: string // User email
}
```

## Best Practices

### 1. Always Use Helpers

```typescript
// ✅ Good
await requireRole(['Admin'])

// ❌ Bad
const user = await getAuthenticatedUser()
if (user.role !== 'Admin') throw new Error('Forbidden')
```

### 2. Check Resource Ownership

```typescript
// ✅ Good
if (!(await checkAuthority(db, session, targetUserId))) {
  throw new ForbiddenError('Access denied')
}

// ❌ Bad
// Assuming user can access any resource
```

### 3. Use Appropriate Rate Limits

```typescript
// ✅ Good
await requireRateLimit(userId, RateLimitPresets.MUTATION)

// ❌ Bad
// No rate limiting
```

### 4. Validate CSRF Tokens

```typescript
// ✅ Good
requireCSRFToken(getCSRFTokenFromRequest(request))

// ❌ Bad
// No CSRF protection
```

## Troubleshooting

### "Unauthorized" Errors

1. Check if user is signed in
2. Verify Clerk keys are correct
3. Check if user exists in database
4. Verify token is not expired

### "Forbidden" Errors

1. Check user's role in database
2. Verify endpoint allows user's role
3. Check resource-level permissions
4. Review authorization logic

### Token Issues

1. Clear browser cookies
2. Sign out and sign in again
3. Check Clerk dashboard for token issues
4. Verify Clerk keys match environment

## Integration Points

### Clerk Configuration

Required environment variables:

```bash
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Middleware Setup

```typescript
// src/start.ts
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'

export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}))
```

## Future Enhancements

- [ ] Multi-factor authentication (MFA) support
- [ ] API key authentication for service accounts
- [ ] Fine-grained permissions (beyond roles)
- [ ] Audit logging for authorization decisions
- [ ] Session management UI
