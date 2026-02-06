# Troubleshooting Guide

This guide helps diagnose and resolve common issues in the Training Certify platform.

**Last Updated:** February 6, 2026

---

## Quick Reference

| Issue                | Quick Check          | Solution                |
| -------------------- | -------------------- | ----------------------- |
| App won't start      | `npm run type-check` | Fix TypeScript errors   |
| Database connection  | `curl /health`       | Check DATABASE_URL      |
| High memory          | `curl /health`       | Check memory stats      |
| Slow responses       | `curl /metrics`      | Check query performance |
| Authentication fails | Check Clerk keys     | Verify CLERK_SECRET_KEY |

---

## Application Won't Start

### Symptoms

- Application fails to start
- Process exits immediately
- Error messages in logs

### Diagnosis Steps

1. **Check Environment Variables:**

   ```bash
   # Validate environment configuration
   npm run type-check

   # Check required variables are set
   echo $DATABASE_URL
   echo $CLERK_SECRET_KEY
   ```

2. **Check Node.js Version:**

   ```bash
   node --version
   # Should be 18+ LTS
   ```

3. **Check Dependencies:**

   ```bash
   npm ci
   npm run build
   ```

4. **Check Logs:**

   ```bash
   # PM2 logs
   pm2 logs training-certify --lines 100

   # Docker logs
   docker logs training-certify

   # System logs
   journalctl -u training-certify -n 100
   ```

### Common Causes & Solutions

#### Missing Environment Variables

**Error:** `DATABASE_URL is required`

**Solution:**

```bash
# Set required environment variables
export DATABASE_URL="postgresql://..."
export CLERK_SECRET_KEY="sk_..."
export NODE_ENV="production"
```

#### TypeScript Errors

**Error:** `Type errors found`

**Solution:**

```bash
# Fix TypeScript errors
npm run type-check

# Fix automatically where possible
npm run lint:fix
```

#### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**

```bash
# Find process using port
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process or change PORT
export PORT=3001
```

#### Missing Dependencies

**Error:** `Cannot find module`

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Database Connection Issues

### Symptoms

- Database connection errors
- Timeout errors
- "Connection refused" errors
- Health check fails

### Diagnosis Steps

1. **Test Database Connection:**

   ```bash
   # Direct connection test
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check Health Endpoint:**

   ```bash
   curl http://localhost:3000/health
   # Should return database status
   ```

3. **Check Connection String:**
   ```bash
   # Verify DATABASE_URL format
   echo $DATABASE_URL
   # Format: postgresql://user:password@host:port/database
   ```

### Common Causes & Solutions

#### Invalid Connection String

**Error:** `Invalid connection string`

**Solution:**

```bash
# Verify format
# Correct: postgresql://user:pass@host:5432/dbname
# Check for special characters in password (URL encode if needed)
```

#### Database Not Running

**Error:** `Connection refused`

**Solution:**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql
```

#### Network Issues

**Error:** `Connection timeout`

**Solution:**

```bash
# Test network connectivity
ping <database-host>

# Test port accessibility
telnet <database-host> 5432
# or
nc -zv <database-host> 5432
```

#### Connection Pool Exhausted

**Error:** `Too many connections`

**Solution:**

```bash
# Check current connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool size in connection string or database config
# Or close idle connections
```

#### SSL/TLS Issues

**Error:** `SSL connection required`

**Solution:**

```bash
# Add SSL parameter to connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

---

## High Memory Usage

### Symptoms

- Application crashes
- Slow performance
- Memory warnings in logs
- Health check shows high memory

### Diagnosis Steps

1. **Check Memory Usage:**

   ```bash
   # Via health endpoint
   curl http://localhost:3000/health | jq .memory

   # System memory
   free -h

   # Process memory
   ps aux | grep node
   ```

2. **Check for Memory Leaks:**
   ```bash
   # Monitor memory over time
   watch -n 5 'curl -s http://localhost:3000/health | jq .memory'
   ```

### Common Causes & Solutions

#### Cache Size Too Large

**Solution:**

```bash
# Check cache configuration
# Reduce cache TTL or size limits
# See src/lib/cache.server.ts
```

#### Memory Leak in Code

**Solution:**

```bash
# Use Node.js memory profiler
node --inspect server.js

# Or use clinic.js
npm install -g clinic
clinic doctor -- node server.js
```

#### Too Many Concurrent Requests

**Solution:**

- Scale horizontally (add more instances)
- Implement request queuing
- Add rate limiting (already implemented)

#### Large Result Sets

**Solution:**

- Ensure pagination is used (already implemented)
- Add query limits
- Optimize database queries

---

## Slow Response Times

### Symptoms

- API requests take >1 second
- Timeout errors
- User complaints about slowness

### Diagnosis Steps

1. **Check Metrics:**

   ```bash
   # Get performance metrics
   curl http://localhost:3000/metrics
   ```

2. **Check Database Performance:**

   ```bash
   # Slow queries
   psql $DATABASE_URL -c "
     SELECT query, mean_exec_time, calls
     FROM pg_stat_statements
     ORDER BY mean_exec_time DESC
     LIMIT 10;
   "
   ```

3. **Check Network Latency:**
   ```bash
   # Test response times
   time curl http://localhost:3000/api/catalog
   ```

### Common Causes & Solutions

#### Slow Database Queries

**Solution:**

```bash
# Check if indexes exist
psql $DATABASE_URL -c "\d+ user_certifications"

# Add missing indexes (see Phase 5.1)
# Use EXPLAIN ANALYZE to optimize queries
```

#### N+1 Query Problem

**Solution:**

- Use batch queries (already implemented)
- Use `inArray()` for multiple IDs
- Check query logs for patterns

#### Missing Cache

**Solution:**

- Verify caching is enabled
- Check cache hit rates
- Increase cache TTL for stable data

#### Network Issues

**Solution:**

- Check database network latency
- Use connection pooling (already configured)
- Consider database read replicas

---

## Authentication Issues

### Symptoms

- Users can't sign in
- "Unauthorized" errors
- Session expired errors

### Diagnosis Steps

1. **Check Clerk Configuration:**

   ```bash
   # Verify keys are set
   echo $CLERK_SECRET_KEY
   echo $VITE_CLERK_PUBLISHABLE_KEY

   # Check key format
   # Secret: sk_live_... or sk_test_...
   # Publishable: pk_live_... or pk_test_...
   ```

2. **Test Clerk API:**

   ```bash
   # Test Clerk connection
   curl -H "Authorization: Bearer $CLERK_SECRET_KEY" \
     https://api.clerk.com/v1/users
   ```

3. **Check Application Logs:**
   ```bash
   # Look for authentication errors
   pm2 logs training-certify | grep -i "auth\|clerk\|unauthorized"
   ```

### Common Causes & Solutions

#### Wrong Clerk Keys

**Error:** `Invalid API key`

**Solution:**

- Verify keys match environment (test vs production)
- Check for typos or extra spaces
- Regenerate keys if compromised

#### CORS Issues

**Error:** `CORS policy blocked`

**Solution:**

- Check Clerk dashboard for allowed origins
- Verify frontend URL is whitelisted
- Check security headers configuration

#### Session Expired

**Error:** `Session expired`

**Solution:**

- Check Clerk session configuration
- Verify session timeout settings
- Check if cookies are being blocked

---

## Rate Limiting Issues

### Symptoms

- Legitimate users blocked
- "Too many requests" errors
- Inconsistent rate limiting

### Diagnosis Steps

1. **Check Rate Limit Configuration:**

   ```bash
   # Review rate limit settings
   # See src/lib/rateLimit.server.ts
   ```

2. **Check Rate Limit Storage:**
   ```bash
   # If using database storage, check rate_limit_logs table
   psql $DATABASE_URL -c "SELECT * FROM rate_limit_logs LIMIT 10;"
   ```

### Common Causes & Solutions

#### Rate Limits Too Strict

**Solution:**

- Adjust rate limit presets
- Increase limits for authenticated users
- Whitelist specific IPs if needed

#### Rate Limit Storage Issues

**Solution:**

- Check database connectivity
- Verify rate_limit_logs table exists
- Check for storage cleanup issues

---

## CSRF Token Issues

### Symptoms

- "CSRF token missing" errors
- "Invalid CSRF token" errors
- Form submissions fail

### Diagnosis Steps

1. **Check CSRF Configuration:**

   ```bash
   # Verify CSRF_SECRET is set
   echo $CSRF_SECRET
   ```

2. **Check Client-Side Implementation:**
   - Verify CSRF token is included in requests
   - Check X-CSRF-Token header
   - Verify token generation

### Common Causes & Solutions

#### Missing CSRF Secret

**Error:** `CSRF_SECRET is required`

**Solution:**

```bash
# Generate secure secret
openssl rand -hex 32
export CSRF_SECRET="<generated-secret>"
```

#### Token Mismatch

**Error:** `Invalid CSRF token`

**Solution:**

- Verify token is sent with each request
- Check token expiration
- Ensure same secret used for generation/validation

---

## Database Migration Issues

### Symptoms

- Migration fails
- Schema mismatch errors
- Data integrity issues

### Diagnosis Steps

1. **Check Migration Status:**

   ```bash
   # List applied migrations
   psql $DATABASE_URL -c "
     SELECT * FROM drizzle.__drizzle_migrations
     ORDER BY created_at DESC;
   "
   ```

2. **Test Migration:**

   ```bash
   # Generate migration
   npm run db:generate

   # Review SQL before applying
   cat drizzle/[latest-migration].sql
   ```

### Common Causes & Solutions

#### Migration Conflicts

**Error:** `Migration already applied`

**Solution:**

- Check migration history
- Manually mark migration as applied if needed
- Or rollback and reapply

#### Schema Drift

**Error:** `Column does not exist`

**Solution:**

- Compare schema.ts with database
- Generate migration to sync
- Or manually fix schema

---

## Performance Issues

### Symptoms

- Slow page loads
- High CPU usage
- Timeout errors

### Diagnosis Steps

1. **Check CPU Usage:**

   ```bash
   top
   # or
   htop
   ```

2. **Check Application Metrics:**

   ```bash
   curl http://localhost:3000/metrics
   ```

3. **Profile Application:**
   ```bash
   # Use Node.js profiler
   node --prof server.js
   node --prof-process isolate-*.log
   ```

### Common Causes & Solutions

#### High CPU Usage

**Solution:**

- Optimize hot code paths
- Add caching
- Scale horizontally

#### Slow Database Queries

**Solution:**

- Add indexes
- Optimize queries
- Use query caching

---

## Error Tracking Issues

### Symptoms

- Errors not appearing in Sentry
- Missing error context
- Duplicate errors

### Diagnosis Steps

1. **Check Sentry Configuration:**

   ```bash
   echo $SENTRY_DSN
   ```

2. **Test Sentry Connection:**
   ```bash
   # Check Sentry dashboard
   # Verify DSN is correct
   ```

### Common Causes & Solutions

#### Missing Sentry DSN

**Solution:**

```bash
# Set Sentry DSN
export SENTRY_DSN="https://..."
```

#### Sentry Not Initialized

**Solution:**

- Verify Sentry is initialized in entry-server.tsx
- Check Sentry configuration
- Verify environment is production

---

## Getting Help

### Escalation Path

1. **Check Documentation:**
   - This troubleshooting guide
   - Deployment guide
   - API documentation

2. **Check Logs:**
   - Application logs
   - System logs
   - Sentry errors

3. **Check Monitoring:**
   - Health endpoint
   - Metrics endpoint
   - Monitoring dashboards

4. **Contact Support:**
   - On-call engineer
   - Team lead
   - Escalate if critical

### Useful Commands

```bash
# Health check
curl http://localhost:3000/health

# Metrics
curl http://localhost:3000/metrics

# Database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check logs
pm2 logs training-certify --lines 100

# Check environment
env | grep -E "DATABASE|CLERK|SENTRY"
```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Security Documentation](./SECURITY.md)
- [API Documentation](./API.md)
