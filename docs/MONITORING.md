# Production Monitoring & Alerting

This document outlines the monitoring and alerting setup for the Training Certify platform.

**Last Updated:** February 6, 2026

---

## Overview

The Training Certify platform uses multiple monitoring tools to ensure reliability, performance, and quick incident response:

- **Error Tracking:** Sentry
- **Application Metrics:** Custom metrics endpoint
- **Health Checks:** `/health` and `/ready` endpoints
- **Logging:** Structured logging (Pino)

---

## Monitoring Stack

### 1. Error Tracking (Sentry)

**Purpose:** Track and alert on application errors

**Setup:**

1. Create Sentry project at https://sentry.io
2. Copy DSN to `SENTRY_DSN` environment variable
3. Errors are automatically tracked

**What's Monitored:**

- Unhandled exceptions
- API errors
- Database errors
- Authentication failures

**Configuration:** `src/lib/sentry.server.ts`

### 2. Application Metrics

**Endpoint:** `GET /metrics`

**Purpose:** Prometheus-format metrics for monitoring

**Metrics Exposed:**

- Request counts
- Response times
- Error rates
- Database query performance

**Usage:**

```bash
curl http://localhost:3000/metrics
```

### 3. Health Checks

**Endpoints:**

- `GET /health` - Health check (database, environment)
- `GET /ready` - Readiness check (for load balancers)

**Usage:**

```bash
# Health check
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/ready
```

### 4. Structured Logging

**Purpose:** Application logs with structured data

**Implementation:** Pino logger (`src/lib/logging.server.ts`)

**Log Levels:**

- `error` - Errors requiring attention
- `warn` - Warnings
- `info` - Informational messages
- `debug` - Debug information (development only)

---

## Alert Configuration

### Critical Alerts (Immediate Response)

These alerts require immediate attention:

#### 1. Error Rate > 5%

**Condition:** Error rate exceeds 5% over 5 minutes

**Action:**

- Page on-call engineer
- Check Sentry for error details
- Review recent deployments
- Consider rollback if recent deployment

**Alert Channel:** PagerDuty / Email / SMS

#### 2. Application Down

**Condition:** Health check fails for 2 consecutive checks

**Action:**

- Page on-call engineer immediately
- Check application logs
- Verify database connectivity
- Check deployment status

**Alert Channel:** PagerDuty / Phone

#### 3. Database Connection Failure

**Condition:** Database health check fails

**Action:**

- Page on-call engineer
- Check database status
- Verify network connectivity
- Check connection pool limits

**Alert Channel:** PagerDuty / Email

### High Priority Alerts (Response within 1 hour)

#### 4. Response Time > 1s (p95)

**Condition:** 95th percentile response time exceeds 1 second

**Action:**

- Notify on-call engineer
- Check slow query logs
- Review database performance
- Check cache hit rates

**Alert Channel:** Email / Slack

#### 5. Error Rate > 1%

**Condition:** Error rate exceeds 1% over 15 minutes

**Action:**

- Notify team
- Review error patterns in Sentry
- Check for common causes
- Monitor for escalation

**Alert Channel:** Email / Slack

#### 6. Memory Usage > 80%

**Condition:** Application memory usage exceeds 80%

**Action:**

- Review memory usage trends
- Check for memory leaks
- Consider scaling
- Review cache size

**Alert Channel:** Email / Slack

### Medium Priority Alerts (Response within 4 hours)

#### 7. Disk Space < 20%

**Condition:** Disk space below 20% free

**Action:**

- Review disk usage
- Clean up old logs
- Archive old backups
- Consider increasing disk size

**Alert Channel:** Email

#### 8. Database Query Time > 500ms

**Condition:** Average database query time exceeds 500ms

**Action:**

- Review slow queries
- Check for missing indexes
- Optimize queries
- Review query patterns

**Alert Channel:** Email

#### 9. Cache Hit Rate < 70%

**Condition:** Cache hit rate below 70%

**Action:**

- Review cache configuration
- Check cache invalidation patterns
- Review cache TTL settings
- Optimize cache keys

**Alert Channel:** Email

---

## Alerting Channels

### PagerDuty Integration

**Purpose:** Critical alerts requiring immediate response

**Setup:**

1. Create PagerDuty service
2. Configure integration with monitoring tool
3. Set up escalation policies
4. Configure on-call schedule

**Escalation Policy:**

- **Level 1:** Primary on-call (5 minutes)
- **Level 2:** Secondary on-call (15 minutes)
- **Level 3:** Team lead (30 minutes)
- **Level 4:** Engineering manager (1 hour)

### Email Alerts

**Purpose:** Non-critical alerts and notifications

**Configuration:**

- Send to team distribution list
- Include error details and context
- Link to monitoring dashboards

### Slack Integration

**Purpose:** Team notifications and alerts

**Channels:**

- `#alerts-critical` - Critical alerts
- `#alerts-warnings` - Warning-level alerts
- `#monitoring` - General monitoring updates

---

## Monitoring Dashboards

### Recommended Dashboards

#### 1. Application Overview

**Metrics:**

- Request rate (requests/minute)
- Error rate (%)
- Response time (p50, p95, p99)
- Active users

**Refresh:** 1 minute

#### 2. Database Performance

**Metrics:**

- Query count
- Average query time
- Slow queries (>500ms)
- Connection pool usage
- Database size

**Refresh:** 5 minutes

#### 3. Error Tracking

**Metrics:**

- Error count by type
- Error rate trend
- Top errors
- Error distribution by endpoint

**Refresh:** 1 minute

#### 4. System Resources

**Metrics:**

- CPU usage
- Memory usage
- Disk usage
- Network I/O

**Refresh:** 1 minute

---

## On-Call Rotation

### Rotation Schedule

**Format:** Weekly rotation

**Responsibilities:**

- Monitor alerts during on-call period
- Respond to critical alerts within SLA
- Escalate if unable to resolve
- Document incidents

### On-Call Engineer Checklist

**Before On-Call:**

- [ ] Review current alerts
- [ ] Check known issues
- [ ] Verify access to all systems
- [ ] Test alerting channels

**During On-Call:**

- [ ] Monitor alerts
- [ ] Respond to critical alerts within SLA
- [ ] Document incidents
- [ ] Escalate if needed

**After On-Call:**

- [ ] Hand off unresolved issues
- [ ] Document any incidents
- [ ] Update runbooks if needed

---

## Incident Response

### Severity Levels

#### P0 - Critical (Immediate Response)

**Definition:** Complete service outage or data loss

**Response Time:** Immediate (< 5 minutes)

**Examples:**

- Application completely down
- Database unavailable
- Security breach

**Process:**

1. Acknowledge alert immediately
2. Assess impact
3. Start incident response
4. Notify stakeholders
5. Resolve or escalate

#### P1 - High (Response within 1 hour)

**Definition:** Major feature broken or significant degradation

**Response Time:** < 1 hour

**Examples:**

- Critical feature unavailable
- High error rate (>5%)
- Performance degradation (>50%)

**Process:**

1. Acknowledge alert
2. Investigate issue
3. Implement fix or workaround
4. Monitor resolution

#### P2 - Medium (Response within 4 hours)

**Definition:** Minor feature broken or moderate degradation

**Response Time:** < 4 hours

**Examples:**

- Non-critical feature unavailable
- Moderate error rate (1-5%)
- Performance degradation (20-50%)

**Process:**

1. Acknowledge alert
2. Investigate during business hours
3. Plan fix
4. Implement fix

#### P3 - Low (Response within 1 business day)

**Definition:** Minor issues or improvements

**Response Time:** < 1 business day

**Examples:**

- Cosmetic issues
- Low error rate (<1%)
- Minor performance issues

**Process:**

1. Log issue
2. Prioritize with team
3. Schedule fix
4. Implement fix

### Incident Response Process

#### 1. Detection

- Alert received via PagerDuty/Email/Slack
- Check monitoring dashboards
- Review error logs

#### 2. Assessment

- Determine severity
- Assess impact
- Identify affected users/features
- Check recent changes

#### 3. Response

**For P0/P1:**

- Start incident response immediately
- Create incident channel
- Notify stakeholders
- Begin investigation

**For P2/P3:**

- Log issue
- Investigate during business hours
- Plan resolution

#### 4. Resolution

- Identify root cause
- Implement fix or workaround
- Verify resolution
- Monitor for recurrence

#### 5. Post-Mortem

- Document incident
- Identify improvements
- Update runbooks
- Schedule follow-up

---

## Monitoring Best Practices

### ✅ Do

- Monitor key metrics continuously
- Set up alerts for all critical metrics
- Test alerting channels regularly
- Review and tune alert thresholds
- Document all incidents
- Regular on-call rotation
- Review monitoring dashboards daily

### ❌ Don't

- Ignore alerts
- Set alert thresholds too sensitive
- Skip post-mortems
- Leave alerts unacknowledged
- Change alert thresholds without review
- Ignore trends

---

## Metrics to Monitor

### Application Metrics

- **Request Rate:** Requests per minute
- **Error Rate:** Percentage of failed requests
- **Response Time:** p50, p95, p99 percentiles
- **Throughput:** Requests per second

### Database Metrics

- **Query Count:** Queries per minute
- **Query Time:** Average query duration
- **Slow Queries:** Queries > 500ms
- **Connection Pool:** Active/idle connections
- **Database Size:** Total database size

### System Metrics

- **CPU Usage:** Percentage CPU utilization
- **Memory Usage:** Percentage memory used
- **Disk Usage:** Percentage disk used
- **Network I/O:** Bytes in/out per second

### Business Metrics

- **Active Users:** Users active in last hour/day
- **Certification Count:** Total certifications
- **Team Count:** Total teams
- **Export Requests:** Export requests per day

---

## Alert Thresholds Summary

| Metric                | Warning   | Critical    | Action             |
| --------------------- | --------- | ----------- | ------------------ |
| Error Rate            | >1%       | >5%         | Investigate / Page |
| Response Time (p95)   | >500ms    | >1s         | Optimize / Page    |
| Memory Usage          | >70%      | >90%        | Scale / Page       |
| Disk Usage            | >70%      | >90%        | Cleanup / Page     |
| Database Connections  | >80%      | >95%        | Scale / Page       |
| Health Check Failures | 1 failure | 2+ failures | Page               |

---

## Tools & Integrations

### Recommended Tools

- **Error Tracking:** Sentry
- **APM:** New Relic, Datadog, or similar
- **Logging:** CloudWatch, Loggly, or similar
- **Alerting:** PagerDuty
- **Dashboards:** Grafana, Datadog, or similar

### Integration Setup

See platform-specific documentation:

- [Sentry Setup](./SENTRY_SETUP_COMPLETE.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

## Regular Reviews

### Daily

- Review error rates
- Check critical alerts
- Review performance metrics

### Weekly

- Review alert thresholds
- Analyze error trends
- Review on-call incidents

### Monthly

- Review monitoring coverage
- Update alert thresholds
- Review and optimize dashboards
- On-call rotation review

---

## Support

For monitoring issues:

1. Check this documentation
2. Review monitoring dashboards
3. Check alert history
4. Contact on-call engineer
5. Escalate if needed

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Sentry Setup](./SENTRY_SETUP_COMPLETE.md)
