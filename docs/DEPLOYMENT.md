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
- [ ] Validate configuration: `npm run env:validate`

### 2. Database Setup

- [ ] Create production database
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify schema: `npm run db:studio`
- [ ] Set up automated backups

### 3. Build Application

```bash
npm run build
```

### 4. Run Tests

```bash
npm run test
npm run lint
```

---

## Environment Variables

### Required

| Variable                     | Description                               | Example                               |
| ---------------------------- | ----------------------------------------- | ------------------------------------- |
| `DATABASE_URL`               | PostgreSQL connection string              | `postgresql://user:pass@host:5432/db` |
| `CLERK_SECRET_KEY`           | Clerk secret key (starts with `sk_`)      | `sk_live_...`                         |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts with `pk_`) | `pk_live_...`                         |
| `NODE_ENV`                   | Environment                               | `production`                          |
| `PORT`                       | Server port                               | `3000`                                |

### Optional (Recommended)

| Variable      | Description               | Default |
| ------------- | ------------------------- | ------- |
| `SENTRY_DSN`  | Sentry error tracking DSN | -       |
| `REDIS_URL`   | Redis connection string   | -       |
| `HTTPS_ONLY`  | Force HTTPS               | `false` |
| `CSRF_SECRET` | CSRF protection secret    | -       |

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

## Backup Strategy

### Database Backups

1. **Automated Daily Backups:**

   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Retention Policy:**
   - Daily backups: 7 days
   - Weekly backups: 4 weeks
   - Monthly backups: 12 months

3. **Test Restoration:**
   ```bash
   psql $DATABASE_URL < backup_20260102.sql
   ```

### Application Backups

- Source code: Git repository
- Environment config: Secure vault
- User uploads: S3 or similar

---

## Troubleshooting

### Application Won't Start

1. Check environment variables: `npm run env:validate`
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
