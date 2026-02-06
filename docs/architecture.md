# Training Certify Architecture

## Overview

**Training Certify** is a web application for managing compliance and training certifications. It is built using a modern React stack with server-side rendering and type-safe database interactions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │ TanStack    │  │   Tailwind   │     │
│  │  Components  │  │   Router    │  │     CSS     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ TanStack    │  │   Clerk      │  │   Server     │     │
│  │   Start     │  │   Auth       │  │  Functions   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Rate       │  │     CSRF     │  │   Security   │     │
│  │  Limiting    │  │  Protection  │  │   Headers    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Drizzle    │  │  PostgreSQL  │  │    Cache     │     │
│  │     ORM      │  │   Database   │  │  (In-Memory) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Routing**: [TanStack Router](https://tanstack.com/router) (File-based routing)
- **State Management**: TanStack Query for server state
- **UI Components**: Custom components with Tailwind CSS

### Backend

- **Server Runtime**: Node.js (via Vinxi/Nitro)
- **API**: TanStack Start Server Functions (`createServerFn`) and file-based routes
- **Validation**: Zod schemas for input validation
- **Error Handling**: Custom error classes (`AppError`, `ValidationError`, etc.)

### Database

- **Engine**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Migrations**: Drizzle Kit
- **Connection**: Connection pooling via `pg` driver

### Authentication & Security

- **Provider**: [Clerk](https://clerk.com/)
- **Integration**: `@clerk/tanstack-react-start`
- **CSRF Protection**: Custom CSRF token validation
- **Rate Limiting**: In-memory rate limiting (database-backed in production)
- **Security Headers**: Comprehensive security headers middleware

### Monitoring & Observability

- **Error Tracking**: Sentry integration
- **Logging**: Console logging (structured logging planned)
- **Health Checks**: `/api/health` endpoint
- **Metrics**: `/metrics` endpoint (Prometheus format)

## Project Structure

```
src/
├── routes/              # File-based routes (API and pages)
│   ├── api.*.ts        # API route handlers
│   └── *.tsx           # Page components
├── components/          # React components
│   ├── admin/          # Admin components
│   ├── catalog/        # Catalog components
│   ├── dashboard/      # Dashboard components
│   └── shell/          # App shell components
├── db/                  # Database layer
│   ├── schema.ts       # Drizzle schema definitions
│   ├── db.server.ts    # Database connection utilities
│   └── migrations/     # Database migrations
├── api/                 # Server functions
│   ├── *.server.ts     # Server-side API functions
│   └── __tests__/      # API tests
├── lib/                 # Shared utilities
│   ├── auth.server.ts  # Authentication helpers
│   ├── errors.ts       # Error classes
│   ├── validation.ts   # Zod schemas
│   ├── cache.server.ts # Caching utilities
│   ├── csrf.server.ts  # CSRF protection
│   └── rateLimit.server.ts # Rate limiting
└── hooks/               # React hooks
    └── usePermissions.ts # Permission hooks
```

## Key Design Patterns

### 1. Server Functions

We use `createServerFn` for type-safe API interactions:

```typescript
export const getUserCertifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    // Server-side code with type safety
  },
)
```

### 2. File-Based Routing

API routes are defined using file-based routing:

```typescript
// src/routes/api.users.ts
export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async () => {
        /* ... */
      },
      POST: async ({ request }) => {
        /* ... */
      },
    },
  },
})
```

### 3. Role-Based Access Control

Authorization is handled via role checks:

```typescript
await requireRole(['Admin', 'Manager'])
```

### 4. Error Handling

Consistent error handling with custom error classes:

```typescript
throw new ValidationError('Invalid input', errors)
throw new ForbiddenError('Access denied')
throw new NotFoundError('Resource not found')
```

### 5. Input Validation

Zod schemas for type-safe validation:

```typescript
const data = CreateUserSchema.parse(requestBody)
```

## Request Flow

### 1. Client Request

```
Client → TanStack Router → Route Handler → Server Function/API Route
```

### 2. Authentication Flow

```
Request → Clerk Middleware → Verify Token → Get User → Check Role → Process Request
```

### 3. Database Query Flow

```
Request → getDbOrThrow() → Drizzle Query → PostgreSQL → Response
```

## Security Architecture

### Authentication

- Clerk handles user authentication
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh

### Authorization

- Role-based access control (RBAC)
- Resource-level permission checks
- Manager team member access

### Protection Mechanisms

- CSRF tokens for mutations
- Rate limiting per endpoint
- Security headers (CSP, HSTS, etc.)
- Input validation with Zod
- SQL injection prevention (Drizzle ORM)

## Data Flow

### Read Operations

```
Client → API Route → Authentication → Authorization → Database Query → Cache Check → Response
```

### Write Operations

```
Client → API Route → Authentication → Authorization → CSRF Check → Rate Limit → Validation → Database Write → Cache Invalidation → Response
```

## Caching Strategy

- **In-Memory Cache**: Used for frequently accessed data
- **Cache Keys**: Pattern-based (e.g., `teams:all:${userId}`)
- **TTL**: Configurable per cache entry
- **Invalidation**: Pattern-based invalidation

## Error Handling Strategy

1. **Validation Errors** (400): Invalid input data
2. **Unauthorized** (401): Authentication required
3. **Forbidden** (403): Insufficient permissions
4. **Not Found** (404): Resource doesn't exist
5. **Rate Limit** (429): Too many requests
6. **Server Error** (500): Internal server error

All errors follow consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Performance Considerations

- **Database Indexes**: Optimized for common queries
- **Batch Queries**: Used to prevent N+1 problems
- **Caching**: Frequently accessed data cached
- **Rate Limiting**: Prevents abuse
- **Connection Pooling**: Efficient database connections

## Scalability

### Current Architecture

- Single-instance deployment
- In-memory caching
- Direct database connections

### Horizontal Scaling (Future)

- Redis for distributed caching
- Load balancer for multiple instances
- Database read replicas
- Session storage (Clerk handles this)

## Monitoring & Observability

### Health Checks

- `/api/health`: Comprehensive health check
- `/ready`: Readiness check for load balancers
- `/metrics`: Prometheus metrics

### Error Tracking

- Sentry integration for error tracking
- Structured logging (planned)
- Audit logs for compliance

## Related Documentation

- [Database Schema](./database-schema.md) - Detailed database schema documentation
- [Auth Flow](./auth-flow.md) - Authentication and authorization flow
- [API Documentation](./api/README.md) - API endpoint documentation
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
