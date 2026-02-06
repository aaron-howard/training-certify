/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of database connections and other resources
 */

import { closeDb } from '../db/db.server'
import { cache } from './cache.server'
import { logError, logger } from './logging.server'

let isShuttingDown = false

/**
 * Perform graceful shutdown of the application.
 *
 * Handles cleanup of resources including:
 * - Clearing cache
 * - Closing database connections
 * - Logging shutdown status
 *
 * This function is idempotent - calling it multiple times will only
 * perform shutdown once.
 *
 * @param signal - Signal name that triggered shutdown (e.g., 'SIGTERM', 'SIGINT')
 * @internal This function is called automatically by signal handlers
 */
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn({ signal }, 'Shutdown already in progress')
    return
  }

  isShuttingDown = true
  logger.info({ signal }, 'Graceful shutdown initiated')

  try {
    // 1. Stop accepting new requests (handled by server)
    logger.info({ signal }, 'Stopping new request acceptance')

    // 2. Clear cache
    logger.info({ signal }, 'Clearing cache')
    cache.clear()

    // 4. Close database connections
    logger.info({ signal }, 'Closing database connections')
    await closeDb()

    // 5. Log completion
    logger.info({ signal }, 'Graceful shutdown complete')

    // Exit successfully
    process.exit(0)
  } catch (error) {
    logError(error, { signal }, 'Error during shutdown')
    process.exit(1)
  }
}

/**
 * Initialize graceful shutdown handlers for the application.
 *
 * Registers handlers for:
 * - SIGTERM: Termination signal (Docker, Kubernetes)
 * - SIGINT: Interrupt signal (Ctrl+C)
 * - uncaughtException: Unhandled exceptions
 * - unhandledRejection: Unhandled promise rejections
 *
 * This should be called once at application startup, typically in the
 * main entry point (e.g., start.ts).
 *
 * @example
 * ```typescript
 * // In start.ts
 * import { initGracefulShutdown } from './lib/shutdown.server'
 * initGracefulShutdown()
 * ```
 */
export function initGracefulShutdown() {
  // Handle SIGTERM (Docker, Kubernetes)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logError(error, { type: 'uncaughtException' }, 'Uncaught exception')
    gracefulShutdown('UNCAUGHT_EXCEPTION')
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    logError(
      error,
      {
        type: 'unhandledRejection',
        promise: String(promise),
      },
      'Unhandled promise rejection',
    )
    gracefulShutdown('UNHANDLED_REJECTION')
  })

  logger.info({ service: 'shutdown' }, 'Graceful shutdown handlers initialized')
}
