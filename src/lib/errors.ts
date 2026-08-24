/**
 * Custom error classes for the application.
 *
 * Provides type-safe error handling with HTTP status code mapping.
 * All application errors should extend AppError or one of its subclasses.
 */

/**
 * Base error class for all application errors.
 *
 * Extends the standard Error class with HTTP status code and error code.
 * All custom error classes should extend this base class.
 *
 * @property statusCode - HTTP status code (e.g., 400, 401, 403, 404, 500)
 * @property code - Machine-readable error code (e.g., 'VALIDATION_FAILED', 'UNAUTHORIZED')
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code?: string

  /**
   * Creates a new AppError instance.
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param code - Machine-readable error code (optional)
   */
  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error thrown when authentication is required but missing or invalid.
 *
 * Maps to HTTP 401 Unauthorized status code.
 * Use this when a user needs to be authenticated to access a resource.
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates a new UnauthorizedError.
   *
   * @param message - Error message (default: 'Unauthorized')
   */
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

/**
 * Error thrown when authentication succeeds but authorization fails.
 *
 * Maps to HTTP 403 Forbidden status code.
 * Use this when a user is authenticated but doesn't have permission
 * to perform the requested action.
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a new ForbiddenError.
   *
   * @param message - Error message describing why access was forbidden (default: 'Forbidden')
   */
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

/**
 * Error thrown when input validation fails.
 *
 * Maps to HTTP 400 Bad Request status code.
 * Use this when request data doesn't meet validation requirements.
 *
 * @property errors - Array of validation error details (typically Zod errors)
 */
export class ValidationError extends AppError {
  public readonly errors?: Array<unknown>

  /**
   * Creates a new ValidationError.
   *
   * @param message - Error message describing the validation failure (default: 'Validation failed')
   * @param errors - Array of detailed validation errors (e.g., from Zod schema validation)
   */
  constructor(message: string = 'Validation failed', errors?: Array<unknown>) {
    super(message, 400, 'VALIDATION_FAILED')
    this.errors = errors
  }
}

/**
 * Error thrown when a requested resource is not found.
 *
 * Maps to HTTP 404 Not Found status code.
 * Use this when a resource (user, certification, team, etc.) doesn't exist.
 */
export class NotFoundError extends AppError {
  /**
   * Creates a new NotFoundError.
   *
   * @param message - Error message describing what resource was not found (default: 'Resource not found')
   */
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}
