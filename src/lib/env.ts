/**
 * Environment variable validation using Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'
// Note: Logging imports are done dynamically in validateEnv() to prevent client bundle inclusion

const envSchema = z.object({
  // Database
  DATABASE_URL: z.preprocess(
    (val) =>
      val || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING,
    z
      .string()
      .url('DATABASE_URL or POSTGRES_URL must be a valid PostgreSQL URL'),
  ),

  // Clerk Authentication
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required')
    .startsWith('sk_', 'CLERK_SECRET_KEY must start with sk_'),
  VITE_CLERK_PUBLISHABLE_KEY: z.preprocess(
    (val) =>
      val ||
      process.env.CLERK_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY,
    z
      .string()
      .min(1, 'Clerk Publishable Key is required')
      .startsWith('pk_', 'Clerk Publishable Key must start with pk_'),
  ),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),

  // Monitoring (Optional)
  SENTRY_DSN: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val.startsWith('http'), {
      message: 'Invalid SENTRY_DSN URL',
    }),

  // Security (Optional)
  HTTPS_ONLY: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  CSRF_SECRET: z.string().min(32).optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * Call this at application startup
 * @throws {Error} If validation fails
 */
export function validateEnv(): Env {
  // Client-side safety: Validation should only run on the server
  if (typeof window !== 'undefined') {
    return {} as Env
  }

  try {
    const validated = envSchema.parse(process.env)
    // Logging removed from env.ts to prevent client bundle inclusion
    // Logging is handled in entry-server.tsx where it's safe
    return validated
  } catch (error) {
    // Logging removed from env.ts to prevent client bundle inclusion
    // Logging is handled in entry-server.tsx where it's safe
    // In production, errors will be logged by Sentry or other monitoring

    // In production/serverless, we throw instead of exiting to allow for better error handling
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    process.exit(1)
  }
}

/**
 * Get validated environment variables with type safety.
 *
 * Returns environment variables that have been validated against the
 * envSchema. This provides type safety and ensures all required environment
 * variables are present and valid.
 *
 * @returns Validated environment variables object
 * @throws {z.ZodError} If environment variables don't match the schema
 *
 * @example
 * ```typescript
 * const env = getEnv()
 * const dbUrl = env.DATABASE_URL // Type-safe access
 * ```
 */
export function getEnv(): Env {
  return envSchema.parse(process.env)
}

/**
 * Check if the application is running in production mode.
 *
 * Determines the environment based on NODE_ENV environment variable.
 *
 * @returns true if NODE_ENV === 'production', false otherwise
 *
 * @example
 * ```typescript
 * if (isProduction()) {
 *   // Production-only code
 * }
 * ```
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Lazy-loaded validated environment (for compatibility)
 */
let _env: Env | null = null

// Type for window.__ENV__ (used in development)
interface WindowEnv {
  __ENV__?: {
    CLERK_PUBLISHABLE_KEY?: string
  }
}

// Type for import.meta.env (Vite environment variables)
interface ImportMetaEnv {
  [key: string]: string | undefined
  VITE_CLERK_PUBLISHABLE_KEY?: string
}

declare global {
  interface Window extends WindowEnv {}
}

export const ENV = new Proxy({} as Env & { CLERK_PUBLISHABLE_KEY: string }, {
  get(_target, prop) {
    // Client-side safety: Only allow VITE_ variables and provide basic fallback
    if (typeof window !== 'undefined') {
      if (
        prop === 'CLERK_PUBLISHABLE_KEY' ||
        prop === 'VITE_CLERK_PUBLISHABLE_KEY'
      ) {
        return (
          window.__ENV__?.CLERK_PUBLISHABLE_KEY ||
          import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
        )
      }
      const envKey = String(prop)
      return (import.meta.env as ImportMetaEnv)[envKey]
    }

    if (!_env) {
      // Only parse on server-side
      if (typeof window === 'undefined') {
        _env = envSchema.parse(process.env)
      } else {
        _env = {} as Env
      }
    }
    // Provide CLERK_PUBLISHABLE_KEY as an alias for VITE_CLERK_PUBLISHABLE_KEY
    if (prop === 'CLERK_PUBLISHABLE_KEY') {
      return _env.VITE_CLERK_PUBLISHABLE_KEY
    }
    return _env[prop as keyof Env]
  },
})

/**
 * Promise that resolves when environment is ready
 */
export const envReady = Promise.resolve()
