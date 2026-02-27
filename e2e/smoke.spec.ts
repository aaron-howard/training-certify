/**
 * E2E smoke tests: critical pages load.
 * Run with: pnpm run test:e2e
 */

import { expect, test } from '@playwright/test'

test.describe('Smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(
      /Training.Certify|Sign in|Welcome|My account/i,
    )
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page).toHaveURL(/\/sign-up/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('api-docs page loads', async ({ page }) => {
    await page.goto('/api-docs')
    await expect(page.locator('body')).toBeVisible()
  })
})
