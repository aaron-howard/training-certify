/**
 * Client-side stub for logging.server.ts
 * Prevents server-only code from being included in client bundle
 */

export const logger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
}

export function logError() {}
export function logWarning() {}
export function logInfo() {}
export function getRequestId() {
  return 'client'
}
export function initLogging() {}
