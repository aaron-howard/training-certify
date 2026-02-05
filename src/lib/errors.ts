/**
 * Custom error classes for the application
 * Allows for better status mapping and type-safe error handling
 */

export class AppError extends Error {
    public readonly statusCode: number
    public readonly code?: string

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.code = code
        Error.captureStackTrace(this, this.constructor)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
    }
}

export class ValidationError extends AppError {
    public readonly errors?: Array<unknown>

    constructor(message: string = 'Validation failed', errors?: Array<unknown>) {
        super(message, 400, 'VALIDATION_FAILED')
        this.errors = errors
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND')
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR')
    }
}
