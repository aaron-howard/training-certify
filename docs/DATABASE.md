# Database Management Guide

## Overview

This guide covers database management best practices for Training Certify, including migrations, backups, and operational procedures.

---

## Migration Strategy

### Current State

⚠️ **Development:** Using `drizzle-kit push` for rapid iteration  
✅ **Production:** Must use migration-based approach

### Migration-Based Workflow

#### 1. Generate Migration

When you make schema changes in `src/db/schema.ts`:

```bash
npm run db:generate
```

This creates a migration file in `drizzle/migrations/` with SQL statements.

#### 2. Review Migration

**CRITICAL:** Always review generated migrations before applying:

```bash
# View the latest migration
cat drizzle/migrations/0001_*.sql
```

Check for:

- Correct table/column names
- Proper data types
- Index creation
- Foreign key constraints
- No data loss

#### 3. Apply Migration

**Development:**

```bash
npm run db:migrate
```

**Production:**

```bash
# Run with explicit connection string
DATABASE_URL="postgresql://..." npm run db:migrate
```

#### 4. Rollback (if needed)

```bash
npm run db:rollback
```

**Note:** Not all migrations are reversible. Always test rollback in staging first.

---

## Migration Best Practices

### DO

✅ **Test migrations in development first**

```bash
# 1. Generate migration
npm run db:generate

# 2. Apply to dev database
npm run db:migrate

# 3. Test application
npm run dev

# 4. Rollback test
npm run db:rollback

# 5. Re-apply
npm run db:migrate
```

✅ **Create separate migrations for different changes**

- One migration per logical change
- Easier to review and rollback

✅ **Include data migrations when needed**

```sql
-- Example: Populate new column with default values
UPDATE users SET role = 'User' WHERE role IS NULL;
```

✅ **Add indexes in separate migrations**

```sql
-- Migration 1: Add column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Migration 2: Add index (separate for performance)
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

### DON'T

❌ **Never use `drizzle-kit push` in production**

- No migration history
- No rollback capability
- Risk of data loss

❌ **Don't modify existing migrations**

- Once applied, migrations are immutable
- Create new migration to fix issues

❌ **Don't skip migration testing**

- Always test in staging before production
- Verify data integrity after migration

---

## Backup Strategy

### Automated Daily Backups

#### PostgreSQL Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
# Database backup script

# Configuration
BACKUP_DIR="/var/backups/training-certify"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
DATABASE_URL="${DATABASE_URL}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "🔄 Starting database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
echo "✅ Backup completed: $BACKUP_FILE.gz"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
echo "🗑️  Old backups cleaned up"
```

#### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### Backup Retention Policy

| Frequency | Retention |
| --------- | --------- |
| Daily     | 7 days    |
| Weekly    | 4 weeks   |
| Monthly   | 12 months |
| Yearly    | 3 years   |

### Cloud Backup (Recommended)

**AWS RDS:**

- Automated backups enabled
- Point-in-time recovery
- Cross-region replication

**Render/Railway:**

- Managed PostgreSQL with automatic backups
- Configurable retention period

---

## Backup Restoration

### Test Restoration Monthly

```bash
# 1. Create test database
createdb training_certify_restore_test

# 2. Restore from backup
gunzip -c backup_20260102.sql.gz | psql training_certify_restore_test

# 3. Verify data
psql training_certify_restore_test -c "SELECT COUNT(*) FROM users;"

# 4. Clean up
dropdb training_certify_restore_test
```

### Production Restoration

**CRITICAL:** Only perform during maintenance window

```bash
# 1. Announce maintenance
# 2. Stop application
pm2 stop training-certify

# 3. Backup current state
pg_dump $DATABASE_URL > pre_restore_backup.sql

# 4. Restore from backup
gunzip -c backup_20260102.sql.gz | psql $DATABASE_URL

# 5. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 6. Restart application
pm2 start training-certify

# 7. Verify application
curl http://localhost:3000/health
```

---

## Database Monitoring

### Key Metrics

Monitor these metrics in production:

1. **Connection Pool Usage**
   - Current connections
   - Max connections
   - Idle connections

2. **Query Performance**
   - Slow queries (>1s)
   - Query count per second
   - Average query time

3. **Database Size**
   - Total size
   - Growth rate
   - Table sizes

4. **Index Usage**
   - Index hit rate (target: >95%)
   - Unused indexes
   - Missing indexes

### Monitoring Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('training_certify'));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

## Maintenance Tasks

### Weekly

- [ ] Review slow query log
- [ ] Check connection pool usage
- [ ] Verify backup completion
- [ ] Monitor database size growth

### Monthly

- [ ] Test backup restoration
- [ ] Review and optimize slow queries
- [ ] Check for unused indexes
- [ ] Vacuum analyze database

### Quarterly

- [ ] Review migration history
- [ ] Audit database permissions
- [ ] Update PostgreSQL version (if needed)
- [ ] Performance tuning review

---

## Graceful Shutdown

### Implementation

The application includes graceful shutdown handlers in `src/lib/shutdown.server.ts`:

```typescript
import { initGracefulShutdown } from './lib/shutdown.server'

// At application startup
initGracefulShutdown()
```

### Shutdown Process

1. **Signal received** (SIGTERM, SIGINT)
2. **Stop accepting new requests**
3. **Clear cache**
4. **Close database connections**
5. **Exit process**

### Testing Graceful Shutdown

```bash
# Start application
npm run start

# In another terminal, send SIGTERM
kill -TERM $(pgrep -f "node.*start")

# Check logs for graceful shutdown messages
```

---

## Disaster Recovery

### Scenario 1: Database Corruption

1. Stop application immediately
2. Assess corruption extent
3. Restore from most recent backup
4. Apply any missing migrations
5. Verify data integrity
6. Restart application

### Scenario 2: Accidental Data Deletion

1. Identify deletion time
2. Stop application (prevent further changes)
3. Restore from backup before deletion
4. Extract deleted data
5. Re-apply to current database
6. Verify and restart

### Scenario 3: Failed Migration

1. Application fails to start
2. Check migration logs
3. Rollback migration: `npm run db:rollback`
4. Fix migration script
5. Re-generate migration
6. Test in staging
7. Apply to production

---

## Performance Optimization

### Connection Pooling

Current configuration in `db.server.ts`:

```typescript
const pool = new Pool({
  connectionString: url,
  max: 2, // Development
  // Production: 10-20 depending on load
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})
```

**Production recommendations:**

- `max`: 10-20 connections
- Monitor pool exhaustion
- Adjust based on concurrent users

### Query Optimization

1. **Use indexes** (already implemented)
2. **Batch queries** (implemented in Teams API)
3. **Avoid N+1 queries** (fixed)
4. **Use connection pooling** (implemented)

### Database Tuning

PostgreSQL configuration for production:

```ini
# postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

---

## Troubleshooting

### Connection Pool Exhausted

**Symptoms:** "sorry, too many clients already"

**Solutions:**

1. Increase `max` in pool config
2. Check for connection leaks
3. Implement connection timeout
4. Scale horizontally

### Slow Queries

**Symptoms:** Response times > 1s

**Solutions:**

1. Check `pg_stat_statements`
2. Add missing indexes
3. Optimize query structure
4. Consider materialized views

### Database Locks

**Symptoms:** Queries hanging

**Solutions:**

```sql
-- Find blocking queries
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking query
SELECT pg_terminate_backend(pid);
```

---

## Migration Scripts

### Package.json Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:rollback": "drizzle-kit rollback",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push:pg",
    "db:backup": "./scripts/backup-db.sh",
    "db:restore": "./scripts/restore-db.sh"
  }
}
```

### Drizzle Config

Ensure `drizzle.config.ts` is configured:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

---

## Summary

### Production Checklist

- [ ] Using migration-based schema changes
- [ ] Automated daily backups configured
- [ ] Backup restoration tested monthly
- [ ] Database monitoring in place
- [ ] Graceful shutdown implemented
- [ ] Connection pooling optimized
- [ ] Disaster recovery plan documented
- [ ] Performance tuning applied

### Key Takeaways

1. **Never use `drizzle-kit push` in production**
2. **Always test migrations in staging first**
3. **Backup before every migration**
4. **Test backup restoration regularly**
5. **Monitor database metrics continuously**
6. **Implement graceful shutdown**
7. **Optimize connection pooling for production**

---

## Additional Resources

- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Connection Pooling Best Practices](https://node-postgres.com/features/pooling)
