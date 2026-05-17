import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: path.join(__dirname, '.env') })
loadDotenv({ path: path.join(__dirname, '.env.local'), override: true })

/**
 * Playwright E2E config for Training Certify.
 * Run with: pnpm run test:e2e
 * Requires app to be available at baseURL (webServer starts it automatically unless CI and server already running).
 */
export default defineConfig({
  globalSetup: path.join(__dirname, 'e2e/playwright-global-setup.ts'),
  testDir: './e2e',
  // CI is Linux; omit {platform} so one committed baseline works locally + in GitHub Actions.
  snapshotPathTemplate:
    '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // CI smoke tests need format-valid env; real keys come from GitHub secrets when set.
        env: {
          ...process.env,
          NODE_ENV: 'development',
          DATABASE_URL:
            process.env.DATABASE_URL?.trim() ||
            'postgresql://ci:ci@127.0.0.1:5432/training_certify_ci',
          CLERK_SECRET_KEY:
            process.env.CLERK_SECRET_KEY?.trim() ||
            'sk_test_ci_e2e_smoke_only_not_for_production',
          VITE_CLERK_PUBLISHABLE_KEY:
            process.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
            'pk_test_ci_e2e_smoke_only_not_for_production',
        },
      },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
})
