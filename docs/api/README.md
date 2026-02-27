# API Documentation

This directory contains the API documentation for the Training Certify application.

## Files

- `openapi.yaml` - OpenAPI 3.0 specification file documenting all API endpoints
- `../api-jsdoc/` - JSDoc/TypeDoc-generated API docs (run `pnpm run docs` from repo root to regenerate)

## Accessing the Documentation

### Interactive Swagger UI

Visit `/api-docs` in your browser to access the interactive Swagger UI documentation.

### OpenAPI Spec File

The OpenAPI specification is available at `/docs/api/openapi.yaml`.

## API Overview

The Training Certify API provides REST endpoints for:

- **Users** - User management and authentication
- **Teams** - Team management, members, and requirements
- **Certifications** - User certification records
- **Catalog** - Certification catalog management
- **Dashboard** - Statistics and metrics
- **Compliance** - Audit logs and compliance tracking
- **Notifications** - User notifications and preferences
- **Export** - Data export functionality
- **Health** - Health check endpoints

## Authentication

All endpoints (except `/api/health`) require Clerk authentication via Bearer token in the Authorization header.

## Rate Limiting

Different endpoints have different rate limits:

- **AUTH**: 5 requests/minute
- **MUTATION**: 30 requests/minute
- **READ**: 100 requests/minute
- **EXPORT**: 5 requests/minute
- **ADMIN**: 50 requests/minute

## CSRF Protection

All mutation endpoints (POST, PATCH, DELETE) require a CSRF token in the `X-CSRF-Token` header.

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `VALIDATION_FAILED` (400): Invalid input data
- `NOT_FOUND` (404): Resource not found
- `DATABASE_ERROR` (500): Database operation failed

## Generating Documentation

To update the OpenAPI spec:

1. Edit `docs/api/openapi.yaml`
2. Validate using [Swagger Editor](https://editor.swagger.io/)
3. The Swagger UI at `/api-docs` will automatically reflect changes

## Tools

- **Swagger UI**: Interactive API documentation browser
- **OpenAPI Generator**: Generate client SDKs from the spec
- **Postman**: Import the OpenAPI spec for API testing
