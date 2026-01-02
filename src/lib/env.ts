/**
 * Environment variable validation using Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Clerk Authentication
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required')
    .startsWith('sk_', 'CLERK_SECRET_KEY must start with sk_'),
  VITE_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'VITE_CLERK_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'VITE_CLERK_PUBLISHABLE_KEY must start with pk_'),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),

  // Caching (Optional - for multi-instance deployments)
  REDIS_URL: z.string().url().optional(),

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
    }
    console.error('\n💡 Please check your .env file and ensure all required variables are set.')
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
