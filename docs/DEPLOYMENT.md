# Deployment Guide

## Overview

This guide covers deploying Training Certify to production environments.

## Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- Clerk account with production keys
- (Optional) Sentry account for error tracking
- (Optional) Redis for distributed caching

---

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Copy `docs/env.production.example` to `.env.production`
- [ ] Fill in all required environment variables
- [ ] Validate configuration (ensure required env vars are set; see table below)

### 2. Database Setup

- [ ] Create production database
- [ ] Run migrations: `pnpm run db:migrate` (do **not** use `drizzle-kit push` in production)
- [ ] Verify schema: `pnpm run db:studio`
- [ ] Set up automated backups
- [ ] Bootstrap first Admin (see [First Admin bootstrap](#first-admin-bootstrap) below)

### 3. Build Application

```bash
pnpm run build
```

### 4. Run Tests

```bash
pnpm run test
pnpm run lint
```

---

## First Admin bootstrap

New Clerk users sync into Postgres with role **`User`** by default. Promote the first operator to Admin after they sign in once:

1. Sign in to the deployed app with the intended admin account (creates/syncs the `users` row).
2. In production Postgres, set the role:

```sql
-- By email (preferred)
UPDATE users
SET role = 'Admin', updated_at = NOW()
WHERE lower(email) = lower('admin@example.com');

-- Or by Clerk user id (users.id)
UPDATE users
SET role = 'Admin', updated_at = NOW()
WHERE id = 'user_...';
```

3. Sign out and back in (or hard-refresh) so session/role checks pick up `Admin`.
4. Confirm Admin-only UI (e.g. User Management on Team Management) and `GET /api/users` succeed.

Optional: after the first Admin exists, use the in-app User Management UI to promote others.

---

## Environment Variables

### Required Variables

These variables **must** be set for the application to run. In `NODE_ENV=production`, startup also requires `CSRF_SECRET` and `BLOB_READ_WRITE_TOKEN`.

| Variable                     | Description                  | Example                               | Validation                                 |
| ---------------------------- | ---------------------------- | ------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`               | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Must be valid PostgreSQL URL               |
| `CLERK_SECRET_KEY`           | Clerk secret key             | `sk_live_...`                         | Must start with `sk_`                      |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key        | `pk_live_...`                         | Must start with `pk_`                      |
| `NODE_ENV`                   | Environment                  | `production`                          | `development`, `production`, or `test`     |
| `PORT`                       | Server port                  | `3000`                                | String (defaults to `3000`)                |
| `CSRF_SECRET`                | CSRF HMAC secret             | `openssl rand -base64 32`             | **Required in production**, min 32 chars   |
| `BLOB_READ_WRITE_TOKEN`      | Vercel Blob write token      | `vercel_blob_rw_...`                  | **Required in production** (proof uploads) |

**Note:** The application validates all required environment variables at startup (`src/lib/env.ts`). If any are missing or invalid, the application will fail to start with a clear error message.

### Optional Variables (Recommended for Production)

| Variable                    | Description                                                | Default                       | When to Use                                                                                                                               |
| --------------------------- | ---------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_DSN`                | Sentry error tracking DSN                                  | -                             | Production error monitoring                                                                                                               |
| `SENTRY_TRACES_SAMPLE_RATE` | Sentry traces sample rate                                  | `0.1` in production           | Override default sampling                                                                                                                 |
| `INTERNAL_OPS_TOKEN`        | Bearer token for `/metrics` and deep `/health`             | unset (endpoints public)      | **Set in production** so metrics are not scraped anonymously                                                                              |
| `REDIS_URL`                 | Redis connection string                                    | -                             | Documented for future multi-instance cache (not wired yet)                                                                                |
| `USE_DB_RATE_LIMIT`         | Keep API rate limits on Postgres (shared across instances) | unset (enabled in production) | Set to `false` only for debugging — forces per-process in-memory limits. See [rate-limiting-serverless.md](./rate-limiting-serverless.md) |
| `HTTPS_ONLY`                | Force HTTPS redirects                                      | `false`                       | Production (set to `true`)                                                                                                                |

### Environment Variable Details

#### DATABASE_URL

PostgreSQL connection string. Supports multiple formats:

- `postgresql://user:password@host:port/database`
- `postgres://user:password@host:port/database`
- Also accepts `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING` as aliases

**Security:** Never commit this value to version control. Use secure secret management.

#### CLERK_SECRET_KEY

Clerk authentication secret key. Get from [Clerk Dashboard](https://dashboard.clerk.com).

- **Development:** Use `sk_test_...` keys
- **Production:** Use `sk_live_...` keys

**Security:** This is a secret key. Keep it secure and never expose it to the client.

#### VITE_CLERK_PUBLISHABLE_KEY

Clerk publishable key (safe to expose to client). Get from [Clerk Dashboard](https://dashboard.clerk.com).

- **Development:** Use `pk_test_...` keys
- **Production:** Use `pk_live_...` keys

**Note:** This key is prefixed with `VITE_` so it's available to the client-side code.

#### NODE_ENV

Application environment. Affects:

- Error message detail level
- Security header enforcement
- Logging verbosity
- CSRF secret requirements

**Values:**

- `development` - Development mode (detailed errors, relaxed security)
- `production` - Production mode (sanitized errors, strict security)
- `test` - Test mode (test-specific behavior)

#### PORT

Server port number. Defaults to `3000` if not specified.

**Note:** Some platforms (Vercel, Railway) ignore this and use their own port configuration.

#### SENTRY_DSN

Sentry error tracking DSN. Get from [Sentry Dashboard](https://sentry.io).

**Format:** `https://<key>@<org>.ingest.sentry.io/<project-id>`

**When to Use:** Production environments for error monitoring and alerting.

#### REDIS_URL

Redis connection string for distributed caching. Required for multi-instance deployments.

**Format:** `redis://user:password@host:port` or `rediss://...` for SSL

**When to Use:**

- Multiple application instances
- Need shared cache across instances
- High availability requirements

#### HTTPS_ONLY

Force HTTPS redirects. Set to `true` in production.

**Security:** Prevents HTTP access and ensures all traffic is encrypted.

#### CSRF_SECRET

CSRF protection secret. Must be at least 32 characters.

**Generate:**

```bash
openssl rand -hex 32
# or
openssl rand -base64 32
```

**Security:** Required in production. Application will fail to start if missing in production mode.

### Environment Variable Validation

The application validates environment variables at startup using Zod schemas. Validation errors include:

- Missing required variables
- Invalid formats (e.g., invalid URLs)
- Invalid values (e.g., wrong key prefixes)

**Validation occurs in:** `src/lib/env.ts`

### Setting Environment Variables

#### Local Development

Create `.env` file:

```bash
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_test_..."
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
NODE_ENV="development"
```

#### Production (Vercel)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)
4. Redeploy

#### Production (Railway)

1. Go to Railway Dashboard → Project → Variables
2. Add each variable
3. Redeploy

#### Production (Docker)

Use `--env-file`:

```bash
docker run --env-file .env.production training-certify
```

Or pass individually:

```bash
docker run -e DATABASE_URL="..." -e CLERK_SECRET_KEY="..." training-certify
```

### Environment Variable Security

**DO:**

- ✅ Use secure secret management (Vercel, AWS Secrets Manager, etc.)
- ✅ Rotate secrets regularly
- ✅ Use different keys for development and production
- ✅ Never commit secrets to version control
- ✅ Use `.env.example` for documentation (without real values)

**DON'T:**

- ❌ Commit `.env` files to Git
- ❌ Share secrets in chat or email
- ❌ Use production keys in development
- ❌ Hardcode secrets in code
- ❌ Log secrets in application logs

### Troubleshooting Environment Variables

**Error:** `Environment variable validation failed`

**Solution:**

1. Check all required variables are set
2. Verify variable formats (URLs, key prefixes)
3. Check for typos or extra spaces
4. Review validation errors in logs

**Error:** `DATABASE_URL is required`

**Solution:**

- Set `DATABASE_URL` environment variable
- Or set `POSTGRES_URL` as alternative
- Verify connection string format

**Error:** `CLERK_SECRET_KEY must start with sk_`

**Solution:**

- Verify key is from Clerk dashboard
- Check for typos
- Ensure using correct key type (secret vs publishable)

---

## Deployment Options

### Option 1: Traditional Server

1. **Install dependencies:**

   ```bash
   npm ci --production
   ```

2. **Build application:**

   ```bash
   npm run build
   ```

3. **Start server:**

   ```bash
   npm run start
   ```

4. **Use process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "training-certify" -- start
   pm2 save
   pm2 startup
   ```

### Option 2: Docker

1. **Create Dockerfile:**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t training-certify .
   docker run -p 3000:3000 --env-file .env.production training-certify
   ```

### Option 3: Cloud Platforms

#### Vercel

```bash
vercel --prod
```

#### Railway

```bash
railway up
```

#### Render

- Connect GitHub repository
- Set environment variables in dashboard
- Deploy automatically on push

---

## Health Checks

Configure your load balancer or monitoring service to check these endpoints:

- **Health Check:** `GET /health`
  - Returns 200 if healthy, 503 if unhealthy
  - Checks database, memory, system

- **Readiness Check:** `GET /ready`
  - Returns 200 if ready, 503 if not ready
  - For load balancer health checks

- **Metrics:** `GET /metrics`
  - Prometheus-format metrics
  - For monitoring and alerting

---

## Database Migrations

### Generate Migration

```bash
npm run db:generate
```

### Apply Migration

```bash
npm run db:migrate
```

### Rollback Migration

```bash
npm run db:rollback
```

**IMPORTANT:** Never use `drizzle-kit push` in production. Always use migrations.

---

## Monitoring Setup

### 1. Error Tracking (Sentry)

1. Create Sentry project at https://sentry.io
2. Copy DSN to `SENTRY_DSN` environment variable
3. Errors will be automatically tracked

### 2. Application Monitoring

Configure your APM tool to monitor:

- Response times (target: <500ms p95)
- Error rates (target: <1%)
- Database query performance
- Memory usage

### 3. Alerting Rules

Set up alerts for:

- Error rate > 5%
- Response time > 1s (p95)
- Database connection failures
- Memory usage > 90%
- Health check failures

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] CSRF protection configured
- [ ] Security headers set
- [ ] Rate limiting active
- [ ] Database credentials secured
- [ ] Clerk keys are production keys
- [ ] Sensitive data encrypted at rest
- [ ] Regular security updates scheduled

---

## Performance Optimization

### 1. Database

- [ ] Connection pooling configured
- [ ] Indexes created (already done via migrations)
- [ ] Query performance monitored
- [ ] Automated backups scheduled

### 2. Caching

- [ ] Redis configured (for multi-instance)
- [ ] Cache hit rates monitored (target: >80%)
- [ ] Cache invalidation working

### 3. Rate Limiting

- [ ] Rate limits configured per endpoint
- [ ] Monitor for false positives
- [ ] Adjust limits based on usage

---

## Backup & Recovery Procedures

### Database Backups

#### Automated Backups

**Recommended:** Use managed database services with automated backups:

- **Vercel Postgres:** Automatic daily backups (7-day retention)
- **Railway Postgres:** Automatic backups (configurable retention)
- **AWS RDS:** Automated backups with point-in-time recovery
- **Google Cloud SQL:** Automated backups with configurable retention

#### Manual Backup Script

Create a backup script (`scripts/backup-db.sh`):

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE.gz"
```

**Schedule with cron:**

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh
```

#### Backup Retention Policy

| Backup Type | Frequency    | Retention | Location            |
| ----------- | ------------ | --------- | ------------------- |
| Daily       | Every day    | 7 days    | Local/cloud storage |
| Weekly      | Sunday       | 4 weeks   | Cloud storage       |
| Monthly     | 1st of month | 12 months | Long-term storage   |

#### Backup Verification

Regularly verify backups are restorable:

```bash
# Test restore to a test database
psql $TEST_DATABASE_URL < backup_20260102.sql

# Verify data integrity
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Database Recovery

#### Point-in-Time Recovery

If using managed database with PITR:

1. **Identify recovery point:**
   - Check error logs for corruption time
   - Identify last known good state

2. **Restore from backup:**
   - Use database provider's restore tool
   - Select recovery point
   - Restore to new database instance

3. **Verify restoration:**

   ```bash
   # Connect to restored database
   psql $RESTORED_DATABASE_URL

   # Verify data
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM certifications;
   ```

4. **Switch application:**
   - Update `DATABASE_URL` to restored database
   - Restart application
   - Monitor for issues

#### Full Database Restore

```bash
# 1. Stop application
pm2 stop training-certify

# 2. Restore from backup
psql $DATABASE_URL < backup_20260102.sql

# 3. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 4. Restart application
pm2 start training-certify

# 5. Verify application health
curl http://localhost:3000/health
```

#### Partial Data Recovery

If only specific tables need recovery:

```bash
# Restore specific table
pg_restore -d $DATABASE_URL -t users backup_20260102.sql

# Or restore from SQL dump
psql $DATABASE_URL -c "\copy users FROM 'users_backup.csv' CSV HEADER;"
```

### Application Backups

#### Source Code

- **Backup:** Git repository (already versioned)
- **Recovery:** `git checkout <commit-hash>`
- **Best Practice:** Regular commits, tagged releases

#### Environment Configuration

- **Backup:** Secure vault (Vercel, AWS Secrets Manager, etc.)
- **Recovery:** Restore from vault
- **Best Practice:** Document all environment variables

#### User Uploads (If Applicable)

If storing user-uploaded files:

- **Backup:** S3, Google Cloud Storage, etc.
- **Recovery:** Restore from cloud storage
- **Best Practice:** Enable versioning on storage bucket

### Disaster Recovery Plan

#### Scenario 1: Database Corruption

1. **Immediate Actions:**
   - Stop application
   - Isolate corrupted database
   - Assess damage scope

2. **Recovery Steps:**
   - Restore from most recent backup
   - Verify data integrity
   - Restart application
   - Monitor for issues

3. **Post-Recovery:**
   - Investigate root cause
   - Improve backup frequency if needed
   - Document incident

#### Scenario 2: Complete System Failure

1. **Immediate Actions:**
   - Assess damage
   - Notify team
   - Activate disaster recovery plan

2. **Recovery Steps:**
   - Restore database from backup
   - Redeploy application
   - Restore environment variables
   - Verify all services

3. **Post-Recovery:**
   - Full system verification
   - Data integrity checks
   - Post-mortem analysis

#### Scenario 3: Data Loss

1. **Immediate Actions:**
   - Stop application to prevent further loss
   - Identify data loss scope
   - Check backup availability

2. **Recovery Steps:**
   - Restore from backup
   - Identify missing data
   - Restore missing data if possible
   - Verify data integrity

3. **Post-Recovery:**
   - Notify affected users (if applicable)
   - Improve data protection
   - Document incident

### Backup Testing

**Regular Testing Schedule:**

- **Monthly:** Test restore procedure
- **Quarterly:** Full disaster recovery drill
- **After major changes:** Verify backup process

**Testing Checklist:**

- [ ] Backup created successfully
- [ ] Backup file is valid
- [ ] Restore procedure works
- [ ] Data integrity verified
- [ ] Application works after restore
- [ ] Recovery time documented

### Backup Storage Locations

**Recommended:**

- **Primary:** Cloud storage (S3, Google Cloud Storage)
- **Secondary:** Different region/cloud provider
- **Local:** Keep recent backups locally for quick access

**Security:**

- Encrypt backups at rest
- Use secure access controls
- Regular access audits
- Test restore permissions

### Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Scenario            | RTO (Recovery Time) | RPO (Data Loss) |
| ------------------- | ------------------- | --------------- |
| Database corruption | 1 hour              | 24 hours        |
| Complete failure    | 4 hours             | 24 hours        |
| Data loss           | 2 hours             | 24 hours        |

**Note:** These are targets. Actual times depend on backup frequency and system complexity.

---

## Troubleshooting

### Application Won't Start

1. Check environment variables (see table above; ensure all required vars are set)
2. Check database connectivity: `curl http://localhost:3000/health`
3. Check logs for errors
4. Verify Node.js version: `node --version`

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify network connectivity
4. Check connection pool limits

### High Memory Usage

1. Check `/health` endpoint for memory stats
2. Review cache size
3. Check for memory leaks
4. Consider scaling horizontally

### Slow Response Times

1. Check `/metrics` for slow endpoints
2. Review database query performance
3. Check cache hit rates
4. Enable query logging

---

## Scaling

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Tune connection pools

### Horizontal Scaling

1. **Requirements:**
   - Redis for distributed caching
   - Load balancer
   - Session storage (Clerk handles this)

2. **Setup:**
   - Deploy multiple instances
   - Configure load balancer
   - Set `REDIS_URL` environment variable
   - Verify sticky sessions not required

---

## Rollback Procedure

1. **Identify issue:**
   - Check error rates in monitoring
   - Review recent deployments

2. **Rollback steps:**

   ```bash
   # Revert to previous version
   git checkout <previous-commit>
   npm run build
   npm run start

   # Or with PM2
   pm2 restart training-certify
   ```

3. **Database rollback (if needed):**

   ```bash
   npm run db:rollback
   ```

4. **Verify:**
   - Check `/health` endpoint
   - Monitor error rates
   - Test critical user flows

---

## Support

For deployment issues:

1. Check logs: `pm2 logs` or `docker logs`
2. Review `/health` endpoint
3. Check Sentry for errors
4. Consult documentation
5. Contact support team

---

## Maintenance

### Regular Tasks

- **Daily:** Monitor error rates and performance
- **Weekly:** Review security logs, update dependencies
- **Monthly:** Review and optimize database, test backups
- **Quarterly:** Security audit, performance review

### Updates

```bash
# Update dependencies
npm update

# Test
npm run test

# Deploy
npm run build
npm run start
```

---

## Production Checklist Summary

- [ ] Environment variables configured and validated
- [ ] Database migrations applied
- [ ] Tests passing
- [ ] Build successful
- [ ] Health checks responding
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Security checklist complete
- [ ] Load testing performed
- [ ] Rollback procedure documented
- [ ] Team trained on deployment process

---

## Additional Resources

- [Environment Configuration](./env.production.example)
- [Database Schema](../src/db/schema.ts)
- [API Documentation](./API.md)
- [Security Policy](./SECURITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
