/**
 * Structured Logging Utility
 *
 * Provides structured logging using Pino with JSON output for production
 * and pretty output for development. Includes request ID tracking and
 * performance logging capabilities.
 */

import { randomBytes } from 'node:crypto'
import pino from 'pino'

// Request ID storage (using AsyncLocalStorage for request context)
const requestIdStorage = new Map<string, string>()

/**
 * Generate a unique request ID
 * @internal - Used internally by getRequestId
 */
function generateRequestId(): string {
  return randomBytes(8).toString('hex')
}

/**
 * Get or create request ID for current request
 */
export function getRequestId(): string {
  // In a real implementation, this would use AsyncLocalStorage
  // For now, we'll use a simple approach with request context
  // This will be enhanced when we add request middleware
  const current = requestIdStorage.get('current')
  if (current) return current
  const newId = generateRequestId()
  requestIdStorage.set('current', newId)
  return newId
}

/**
 * Set request ID for current request context
 */
export function setRequestId(requestId: string): void {
  // Store request ID (in real implementation, use AsyncLocalStorage)
  requestIdStorage.set('current', requestId)
}

/**
 * Create Pino logger instance
 */
const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport:
    isDevelopment && !isTest
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  base: {
    env: process.env.NODE_ENV || 'development',
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Logger interface matching Pino's API
 */
export interface Logger {
  debug: (obj: Record<string, unknown>, msg?: string) => void
  info: (obj: Record<string, unknown>, msg?: string) => void
  warn: (obj: Record<string, unknown>, msg?: string) => void
  error: (obj: Record<string, unknown>, msg?: string) => void
  child: (bindings: Record<string, unknown>) => Logger
}

/**
 * Create a logger instance with optional context
 */
function createLogger(context?: Record<string, unknown>): Logger {
  const childLogger = context ? pinoLogger.child(context) : pinoLogger

  return {
    debug: (obj: Record<string, unknown>, msg?: string) => {
      const logObj = {
        ...obj,
        requestId: getRequestId(),
      }
      childLogger.debug(logObj, msg)
    },
    info: (obj: Record<string, unknown>, msg?: string) => {
      const logObj = {
        ...obj,
        requestId: getRequestId(),
      }
      childLogger.info(logObj, msg)
    },
    warn: (obj: Record<string, unknown>, msg?: string) => {
      const logObj = {
        ...obj,
        requestId: getRequestId(),
      }
      childLogger.warn(logObj, msg)
    },
    error: (obj: Record<string, unknown>, msg?: string) => {
      const logObj = {
        ...obj,
        requestId: getRequestId(),
      }
      childLogger.error(logObj, msg)
    },
    child: (bindings: Record<string, unknown>) => {
      return createLogger({ ...context, ...bindings })
    },
  }
}

/**
 * Default logger instance
 */
export const logger = createLogger()

/**
 * Create a logger with context (e.g., for a specific module or request)
 *
 * @param context - Context object to include in all log messages
 * @returns Logger instance with context
 *
 * @example
 * ```typescript
 * const apiLogger = loggerWithContext({ module: 'api', route: '/api/users' })
 * apiLogger.info({ userId: '123' }, 'User fetched')
 * // Logs: { module: 'api', route: '/api/users', userId: '123', msg: 'User fetched' }
 * ```
 */
export function loggerWithContext(context: Record<string, unknown>): Logger {
  return createLogger(context)
}

/**
 * Performance logging helper
 *
 * Creates a performance timer that logs duration when completed.
 *
 * @param operation - Operation name
 * @param context - Additional context
 * @returns Function to call when operation completes
 *
 * @example
 * ```typescript
 * const endTimer = logPerformance('database_query', { table: 'users' })
 * await db.select().from(users)
 * endTimer() // Logs duration
 * ```
 */
export function logPerformance(
  operation: string,
  context: Record<string, unknown> = {},
): () => void {
  const startTime = Date.now()
  const requestId = getRequestId()

  return () => {
    const duration = Date.now() - startTime
    logger.info(
      {
        ...context,
        operation,
        duration,
        durationMs: duration,
        requestId,
      },
      `Performance: ${operation} completed in ${duration}ms`,
    )
  }
}

/**
 * Log an error with full context
 *
 * @param error - Error object
 * @param context - Additional context
 * @param message - Optional message
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation()
 * } catch (error) {
 *   logError(error, { userId: '123', operation: 'updateUser' }, 'Failed to update user')
 * }
 * ```
 */
export function logError(
  error: Error | unknown,
  context: Record<string, unknown> = {},
  message?: string,
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  const requestId = getRequestId()

  logger.error(
    {
      ...context,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
      requestId,
    },
    message || errorObj.message,
  )
}

/**
 * Log a warning with context
 *
 * @param message - Warning message
 * @param context - Additional context
 *
 * @example
 * ```typescript
 * logWarning('Rate limit approaching', { userId: '123', remaining: 5 })
 * ```
 */
export function logWarning(
  message: string,
  context: Record<string, unknown> = {},
): void {
  const requestId = getRequestId()
  logger.warn({ ...context, requestId }, message)
}

/**
 * Log an info message with context
 *
 * @param message - Info message
 * @param context - Additional context
 *
 * @example
 * ```typescript
 * logInfo('User created', { userId: '123', email: 'user@example.com' })
 * ```
 */
export function logInfo(
  message: string,
  context: Record<string, unknown> = {},
): void {
  const requestId = getRequestId()
  logger.info({ ...context, requestId }, message)
}

/**
 * Log a debug message with context
 *
 * @param message - Debug message
 * @param context - Additional context
 *
 * @example
 * ```typescript
 * logDebug('Processing request', { method: 'GET', path: '/api/users' })
 * ```
 */
export function logDebug(
  message: string,
  context: Record<string, unknown> = {},
): void {
  const requestId = getRequestId()
  logger.debug({ ...context, requestId }, message)
}

/**
 * Initialize logging system
 * Call this at application startup
 */
export function initLogging(): void {
  const level = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')
  logger.info(
    {
      level,
      environment: process.env.NODE_ENV || 'development',
      pretty: isDevelopment && !isTest,
    },
    'Logging system initialized',
  )
}
