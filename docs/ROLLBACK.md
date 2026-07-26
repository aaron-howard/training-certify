# Rollback Procedures

This document outlines the procedures for rolling back deployments and database migrations in case of issues.

**Last Updated:** February 6, 2026

---

## Overview

Rollback procedures are critical for maintaining system availability. This guide covers:

- Application rollback (code deployment)
- Database migration rollback
- Emergency rollback procedures
- Post-rollback verification

---

## Pre-Rollback Checklist

Before initiating a rollback:

- [ ] Identify the issue and confirm rollback is necessary
- [ ] Document the problem for post-mortem
- [ ] Notify team members
- [ ] Verify rollback target version is known
- [ ] Ensure database backup is available
- [ ] Confirm rollback won't cause data loss

---

## Application Rollback

### Quick Rollback (No Database Changes)

If the issue is in application code only (no database migrations):

#### Option 1: Git-Based Rollback

```bash
# 1. Identify the previous working commit
git log --oneline -10

# 2. Checkout the previous version
git checkout <previous-commit-hash>

# 3. Rebuild the application
npm ci --production
npm run build

# 4. Restart the application
# With PM2:
pm2 restart training-certify

# With Docker:
docker-compose restart

# With systemd:
systemctl restart training-certify
```

#### Option 2: Deployment Platform Rollback

**Vercel:**

```bash
vercel rollback
# Or use Vercel dashboard to select previous deployment
```

**Railway:**

```bash
railway rollback
```

**Render:**

- Use dashboard to select previous deployment
- Click "Rollback" button

### Rollback with Database Changes

If the deployment included database migrations:

**⚠️ WARNING:** Rolling back database migrations can cause data loss if not handled carefully.

1. **Stop the application:**

   ```bash
   pm2 stop training-certify
   # or
   docker-compose stop
   ```

2. **Rollback database migration:**

   ```bash
   # No db:rollback script — use provider PITR, restore from pnpm run db:backup,
   # or apply a manual reverse migration. See Database Migration Rollback below.
   ```

3. **Rollback application code:**

   ```bash
   git checkout <previous-commit>
   npm ci --production
   npm run build
   ```

4. **Restart application:**
   ```bash
   pm2 start training-certify
   # or
   docker-compose up -d
   ```

---

## Database Migration Rollback

### Understanding Drizzle Migrations

Drizzle migrations are stored in `drizzle/` directory. Each migration file contains both `up` and `down` operations.

### Manual Rollback

1. **List recent migrations:**

   ```bash
   ls -la drizzle/*.sql
   ```

2. **Identify migration to rollback:**

   ```bash
   # Check migration journal
   cat drizzle/meta/_journal.json
   ```

3. **Create rollback SQL:**
   - Review the migration file
   - Write reverse SQL statements
   - Test on staging first

4. **Execute rollback:**

   ```bash
   # Connect to database
   psql $DATABASE_URL

   # Execute rollback SQL manually
   # Example: Drop index
   DROP INDEX IF EXISTS "user_certifications_expiration_date_idx";
   ```

### Automated Rollback (If Supported)

If your migration tool supports automated rollback:

```bash
# Drizzle Kit doesn't have built-in rollback, but you can:
# 1. Create a new migration that reverses changes
npm run db:generate

# 2. Edit the generated migration to reverse previous changes
# 3. Apply the rollback migration
npm run db:migrate
```

### Common Rollback Scenarios

#### Scenario 1: Adding a Column

**Original Migration:**

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(255);
```

**Rollback:**

```sql
ALTER TABLE users DROP COLUMN phone;
```

#### Scenario 2: Adding an Index

**Original Migration:**

```sql
CREATE INDEX "user_certifications_expiration_date_idx"
ON "user_certifications" ("expiration_date");
```

**Rollback:**

```sql
DROP INDEX IF EXISTS "user_certifications_expiration_date_idx";
```

#### Scenario 3: Adding a Table

**Original Migration:**

```sql
CREATE TABLE "new_table" (...);
```

**Rollback:**

```sql
DROP TABLE IF EXISTS "new_table";
```

---

## Emergency Rollback

### When to Use Emergency Rollback

- Critical security vulnerability discovered
- Complete application failure
- Data corruption detected
- Performance degradation >50%

### Emergency Rollback Steps

1. **Immediate Actions:**

   ```bash
   # Stop application immediately
   pm2 stop training-certify

   # Or if using load balancer, remove from pool
   ```

2. **Quick Rollback:**

   ```bash
   # Rollback to last known good version
   git checkout <last-known-good-commit>
   npm run build
   pm2 start training-certify
   ```

3. **Verify:**

   ```bash
   # Check health endpoint
   curl http://localhost:3000/health

   # Check error logs
   pm2 logs training-certify --lines 50
   ```

4. **Notify Team:**
   - Send incident notification
   - Document what happened
   - Schedule post-mortem

---

## Post-Rollback Verification

After rolling back, verify the system is working correctly:

### 1. Health Checks

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected: 200 OK with healthy status
```

### 2. Critical User Flows

Test these critical flows:

- [ ] User authentication (sign in)
- [ ] User registration
- [ ] View certifications
- [ ] Add certification
- [ ] View dashboard
- [ ] Export data (if applicable)

### 3. Database Integrity

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Verify critical tables exist
psql $DATABASE_URL -c "\dt"
```

### 4. Monitoring

- [ ] Check error rates (should return to normal)
- [ ] Check response times (should be normal)
- [ ] Verify no new errors in Sentry
- [ ] Check application logs

### 5. Performance Metrics

- [ ] Response times < 500ms (p95)
- [ ] Error rate < 1%
- [ ] Database query times normal
- [ ] Memory usage stable

---

## Rollback Decision Matrix

| Issue Type               | Rollback Type                | Time Estimate |
| ------------------------ | ---------------------------- | ------------- |
| Application bug          | Code rollback                | 5-10 minutes  |
| Performance issue        | Code rollback                | 5-10 minutes  |
| Database migration issue | Code + DB rollback           | 15-30 minutes |
| Security vulnerability   | Emergency rollback           | 2-5 minutes   |
| Data corruption          | Code + DB rollback + restore | 30-60 minutes |

---

## Preventing Rollbacks

### Pre-Deployment Checks

- [ ] All tests passing
- [ ] Code review completed
- [ ] Staging environment tested
- [ ] Database migration tested on staging
- [ ] Performance testing completed
- [ ] Security scan passed

### Deployment Best Practices

1. **Feature Flags:** Use feature flags for risky changes
2. **Gradual Rollout:** Deploy to 10% → 50% → 100%
3. **Canary Deployments:** Test on small subset first
4. **Database Migrations:** Always backward compatible when possible
5. **Monitoring:** Watch metrics closely during deployment

---

## Rollback Communication

### Internal Notification Template

```
Subject: [URGENT] Production Rollback - [Date/Time]

Issue: [Brief description]
Impact: [User impact]
Action Taken: Rolled back to version [commit-hash]
Status: [Current status]
Next Steps: [What happens next]
Post-Mortem: Scheduled for [date/time]
```

### External Communication (If Needed)

If user-facing issues occurred:

```
We experienced a technical issue and have rolled back to a
previous stable version. The issue has been resolved and
service is restored. We apologize for any inconvenience.
```

---

## Rollback Log Template

Document each rollback:

```markdown
## Rollback Log - [Date/Time]

**Rollback ID:** RB-[YYYYMMDD]-[NNN]
**Rolled Back From:** [commit-hash] - [version]
**Rolled Back To:** [commit-hash] - [version]
**Reason:** [Why rollback was needed]
**Performed By:** [Name]
**Duration:** [Time taken]
**Impact:** [User impact]
**Post-Mortem:** [Link to post-mortem]
```

---

## Database Backup Before Rollback

**ALWAYS** backup database before rolling back migrations:

```bash
# Create backup
pg_dump $DATABASE_URL > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_before_rollback_*.sql
```

---

## Recovery from Rollback

After successful rollback:

1. **Fix the Issue:**
   - Identify root cause
   - Create fix in development
   - Test thoroughly

2. **Re-deploy:**
   - Follow normal deployment process
   - Monitor closely
   - Have rollback ready

3. **Post-Mortem:**
   - Document what went wrong
   - Identify improvements
   - Update procedures

---

## Rollback Testing

Test rollback procedures regularly:

- **Quarterly:** Full rollback drill
- **After major changes:** Test rollback process
- **Document:** Update procedures based on learnings

---

## Support

For rollback assistance:

1. Check this documentation
2. Review deployment logs
3. Check monitoring dashboards
4. Contact on-call engineer
5. Escalate if needed

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Database Schema](../src/db/schema.ts)
- [Monitoring Setup](./DEPLOYMENT.md#monitoring-setup)
