import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import type { FullConfig } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: path.join(__dirname, '..', '.env') })
loadDotenv({ path: path.join(__dirname, '..', '.env.local'), override: true })

/**
 * Fetches a Clerk Testing Token once per Playwright run when keys are present.
 * @see https://clerk.com/docs/testing/playwright/overview
 */
export default async function globalSetup(_config: FullConfig) {
  const publishable =
    process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY
  const secret = process.env.CLERK_SECRET_KEY
  if (
    !publishable?.startsWith('pk_') ||
    !secret?.startsWith('sk_') ||
    secret.startsWith('sk_live_')
  ) {
    return
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = publishable
  }
  const { clerkSetup } = await import('@clerk/testing/playwright')
  await clerkSetup()
}
