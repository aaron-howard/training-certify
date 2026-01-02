# Sentry.io Setup - Complete! ✅

## Files Created

### 1. Sentry Configuration
**File:** `src/lib/sentry.server.ts`
- Unified server + client monitoring
- Error tracking
- Performance monitoring
- Session replay
- Custom breadcrumbs
- User context tracking

### 2. Monitoring Integration
**File:** `src/lib/monitoring.server.ts` (updated)
- Integrated with Sentry
- `captureError()` sends to Sentry
- `captureMessage()` sends to Sentry

### 3. Root Component
**File:** `src/routes/__root.tsx` (updated)
- Initializes Sentry on client-side
- Automatic error boundary
- Session replay enabled

### 4. Package Installed
```powershell
@sentry/tanstackstart-react
```

---

## Next Steps

### 1. Get Your Sentry DSN

1. Go to https://sentry.io/signup/
2. Create account (free tier)
3. Create project → Select "Node.js"
4. Copy your DSN

### 2. Add to .env.production

```env
# Sentry Error Tracking & Monitoring
SENTRY_DSN="https://your-key@o123.ingest.sentry.io/456"
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="training-certify@1.0.0"

# Sample Rates (adjust based on traffic)
SENTRY_TRACES_SAMPLE_RATE="1.0"  # 100% of transactions
SENTRY_REPLAYS_SESSION_SAMPLE_RATE="0.1"  # 10% of sessions
SENTRY_REPLAYS_ERROR_SAMPLE_RATE="1.0"  # 100% of error sessions
```

### 3. Test It

**Create a test error:**
```typescript
// In any route
throw new Error('Test error for Sentry!')
```

**Check Sentry dashboard** - error should appear!

---

## What You Get

✅ **Error Monitoring** - All production errors tracked  
✅ **Performance Tracing** - API response times monitored  
✅ **Session Replay** - Watch user sessions (10% sampled)  
✅ **Custom Metrics** - Track business KPIs  
✅ **Breadcrumbs** - Debug context for errors  
✅ **User Context** - Know which users hit errors  

---

## Features Enabled

### Automatic
- ✅ Route instrumentation
- ✅ Error boundaries
- ✅ Performance tracking
- ✅ Health check filtering

### Manual (Available)
- `captureError(error, context)` - Log errors
- `captureMessage(message, level)` - Log messages
- `addBreadcrumb(message, data)` - Add debug context
- `setUser({ id, email })` - Track user
- `clearUser()` - Clear user context

---

## Cost

**Free Tier:**
- 5,000 errors/month
- 10,000 performance units/month
- 50 replay sessions/month

**Perfect for getting started!**

---

## Documentation

- **Full Guide:** `sentry_setup_guide.md` (in artifacts)
- **Quick Start:** `docs/SENTRY_QUICKSTART.md`
- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/tanstack-start/

---

## Ready to Deploy!

Once you add your `SENTRY_DSN` to `.env.production`, Sentry will automatically start monitoring your production application. No additional code changes needed!
