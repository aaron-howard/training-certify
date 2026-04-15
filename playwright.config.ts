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
      },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
})
