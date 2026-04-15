/**
 * E2E visual regression: scoped screenshots for stable, mostly static pages (#21).
 * First run / UI change: pnpm run test:e2e -- e2e/visual.spec.ts --update-snapshots
 * Baselines: e2e/visual.spec.ts-snapshots/ (see playwright.config snapshotPathTemplate — no OS suffix).
 *
 * Clerk sign-in/up embeds can drift with @clerk/ui releases — bump snapshots when upgrading Clerk.
 * If GitHub Actions (Linux) fails on pixels but Windows passes, regenerate baselines inside the
 * official Playwright Docker image (Linux) so CI and committed PNGs match.
 */

import { expect, test } from '@playwright/test'

test.describe('Visual regression', () => {
  test('sign-in page matches snapshot', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveScreenshot('sign-in.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('sign-up page matches snapshot', async ({ page }) => {
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveScreenshot('sign-up.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    })
  })

  test('api-docs Swagger (viewport) matches snapshot', async ({ page }) => {
    test.setTimeout(90_000)
    const spec = page.waitForResponse(
      (r) => r.url().includes('openapi.yaml') && r.status() === 200,
      { timeout: 60_000 },
    )
    await page.goto('/api-docs', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })
    await spec
    await expect(page.locator('body')).toBeVisible()
    await page.waitForSelector('.swagger-ui .info', {
      state: 'visible',
      timeout: 60_000,
    })
    // Viewport only: full #swagger-ui height grows with operations list and is unstable for pixels
    await expect(page).toHaveScreenshot('api-docs-viewport.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
      animations: 'disabled',
      timeout: 25_000,
    })
  })
})
