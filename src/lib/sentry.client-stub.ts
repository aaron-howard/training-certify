/**
 * Client-side stub for sentry.server.ts
 * Prevents server-only code from being included in client bundle
 */

export function initSentry(): void {
  // No-op in client - Sentry should be initialized server-side
}

export function captureError(
  _error: Error,
  _context?: Record<string, any>,
): void {
  // No-op in client
}

export function captureMessage(
  _message: string,
  _level: 'info' | 'warning' | 'error' = 'info',
): void {
  // No-op in client
}

export function addBreadcrumb(
  _message: string,
  _data?: Record<string, any>,
): void {
  // No-op in client
}

export function setUser(_user: {
  id: string
  email?: string
  username?: string
}): void {
  // No-op in client
}

export function clearUser(): void {
  // No-op in client
}
