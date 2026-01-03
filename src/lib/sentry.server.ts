/**
 * Sentry configuration for TanStack Start
 * Unified server + client monitoring
 */

import * as Sentry from '@sentry/tanstackstart-react'

let sentryInitialized = false

/**
 * Initialize Sentry for monitoring
 * Works on both server and client
 */
export function initSentry() {
  if (sentryInitialized) return

  const dsn = process.env.SENTRY_DSN

  if (!dsn) {
    console.log('⚠️  Sentry DSN not configured - monitoring disabled')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    release: process.env.SENTRY_RELEASE || 'training-certify@1.0.0',

    // Performance Monitoring
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0',
    ),

    // Profiling
    profilesSampleRate: 1.0,

    // Session Replay (client-side only)
    replaysSessionSampleRate: parseFloat(
      process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1',
    ),
    replaysOnErrorSampleRate: parseFloat(
      process.env.SENTRY_REPLAYS_ERROR_SAMPLE_RATE || '1.0',
    ),

    // TanStack Start automatically includes the right integrations

    // Filter out health check requests
    beforeSend(event) {
      const url = event.request?.url || ''

      // Don't send health check errors
      if (url.includes('/health') || url.includes('/ready')) {
        return null
      }

      return event
    },

    // Add custom tags
    initialScope: {
      tags: {
        app: 'training-certify',
        runtime: typeof window === 'undefined' ? 'node' : 'browser',
      },
    },
  })

  sentryInitialized = true
  console.log('✅ Sentry monitoring initialized')
}

/**
 * Capture an error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) return

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
) {
  if (!sentryInitialized) return

  Sentry.captureMessage(message, level)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (!sentryInitialized) return

  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string
  email?: string
  username?: string
}) {
  if (!sentryInitialized) return

  Sentry.setUser(user)
}

/**
 * Clear user context
 */
export function clearUser() {
  if (!sentryInitialized) return

  Sentry.setUser(null)
}

export { Sentry }
