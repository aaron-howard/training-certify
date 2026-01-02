# Sentry.io Quick Start

**Fast track to get Sentry monitoring running**

## 1. Create Account & Get DSN (5 min)

1. Go to https://sentry.io/signup/
2. Create project → Select "Node.js"
3. Copy your DSN (looks like: `https://abc@o123.ingest.sentry.io/456`)

## 2. Install Package (2 min)

```powershell
npm install --save @sentry/tanstackstart-react
```

**Note:** This single package handles both server and client monitoring!

## 3. Add to .env.production (1 min)

```env
SENTRY_DSN="your-dsn-here"
SENTRY_ENVIRONMENT="production"
SENTRY_TRACES_SAMPLE_RATE="1.0"
SENTRY_REPLAYS_SESSION_SAMPLE_RATE="0.1"
SENTRY_REPLAYS_ERROR_SAMPLE_RATE="1.0"
```

## 4. Next Steps

See `sentry_setup_guide.md` for:
- Complete server & client configuration
- Performance tracing setup
- Session replay configuration
- Custom metrics
- Best practices

**Estimated total setup:** 45 minutes
