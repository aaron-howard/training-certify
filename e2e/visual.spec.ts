/**
 * E2E visual regression: screenshot comparison.
 * First run: pnpm run test:e2e -- --update-snapshots (generates baseline).
 * Baselines live in e2e/visual.spec.ts-snapshots/
 */

import { expect, test } from '@playwright/test'

test.describe('Visual regression', () => {
  test('sign-in page matches snapshot', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveScreenshot('sign-in.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })
})
