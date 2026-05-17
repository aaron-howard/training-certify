import * as Sentry from '@sentry/tanstackstart-react'
import { logger } from './logging.client-stub'

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized) return

  const dsn =
    import.meta.env.VITE_SENTRY_DSN ||
    process.env.VITE_SENTRY_DSN ||
    process.env.SENTRY_DSN

  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    release: process.env.SENTRY_RELEASE || 'training-certify@1.0.0',
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0',
    ),
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: parseFloat(
      process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1',
    ),
    replaysOnErrorSampleRate: parseFloat(
      process.env.SENTRY_REPLAYS_ERROR_SAMPLE_RATE || '1.0',
    ),
    beforeSend(event) {
      const url = event.request?.url || ''
      if (url.includes('/health') || url.includes('/ready')) {
        return null
      }
      return event
    },
    initialScope: {
      tags: {
        app: 'training-certify',
        runtime: 'browser',
      },
    },
  })

  sentryInitialized = true
  logger.info({}, 'Sentry monitoring initialized')
}
