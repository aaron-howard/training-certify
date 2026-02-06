/**
 * Client-side stub for logging.server.ts
 * Prevents server-only code from being included in client bundle
 */

export interface Logger {
  info: (context: Record<string, unknown>, message: string) => void
  error: (context: Record<string, unknown>, message: string) => void
  warn: (context: Record<string, unknown>, message: string) => void
  debug: (context: Record<string, unknown>, message: string) => void
}

export const logger: Logger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
}

export function logError(
  _error: Error | unknown,
  _context?: Record<string, unknown>,
  _message?: string,
): void {
  // No-op in client
}

export function logWarning(
  _context: Record<string, unknown>,
  _message: string,
): void {
  // No-op in client
}

export function logInfo(
  _context: Record<string, unknown>,
  _message: string,
): void {
  // No-op in client
}

export function logDebug(
  _message: string,
  _context: Record<string, unknown> = {},
): void {
  // No-op in client
}

export function logPerformance(
  _operation: string,
  _duration: number,
  _context?: Record<string, unknown>,
): void {
  // No-op in client
}

export function getRequestId(): string {
  return 'client'
}

export function setRequestId(_requestId: string): void {
  // No-op in client
}

export function loggerWithContext(_context: Record<string, unknown>): Logger {
  return logger
}

export function initLogging(): void {
  // No-op in client
}
