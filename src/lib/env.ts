/**
 * Environment variable validation using Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'

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

  // Caching (Optional - for multi-instance deployments)
  REDIS_URL: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val.startsWith('redis') || val.startsWith('rediss'),
      {
        message: 'Invalid REDIS_URL',
      },
    ),

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
    console.log('✅ Environment variables validated successfully')
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      // Log available keys (safely) to help debug Vercel environment issues
      console.error(
        'Available env keys:',
        Object.keys(process.env).filter(
          (k) =>
            !k.toLowerCase().includes('key') &&
            !k.toLowerCase().includes('secret') &&
            !k.toLowerCase().includes('password') &&
            !k.toLowerCase().includes('token'),
        ),
      )
    }
    console.error(
      '\n💡 Please check your Vercel environment variables or .env file.',
    )

    // In production/serverless, we throw instead of exiting to allow for better error handling
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    process.exit(1)
  }
}

/**
 * Get validated environment variables
 * Use this instead of process.env for type safety
 */
export function getEnv(): Env {
  return envSchema.parse(process.env)
}

/**
 * Check if running in production
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

export const ENV = new Proxy({} as Env & { CLERK_PUBLISHABLE_KEY: string }, {
  get(_target, prop) {
    // Client-side safety: Only allow VITE_ variables and provide basic fallback
    if (typeof window !== 'undefined') {
      if (
        prop === 'CLERK_PUBLISHABLE_KEY' ||
        prop === 'VITE_CLERK_PUBLISHABLE_KEY'
      ) {
        // @ts-ignore - Basic fallback for local development if window.__ENV__ is missing
        return (
          window.__ENV__?.CLERK_PUBLISHABLE_KEY ||
          import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
        )
      }
      return (import.meta.env as any)[prop]
    }

    if (!_env) {
      _env = envSchema.parse(process.env)
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
