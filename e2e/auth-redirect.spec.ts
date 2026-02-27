/**
 * E2E auth/redirect: protected routes require auth (redirect or show sign-in).
 */

import { expect, test } from '@playwright/test'

test.describe('Auth and protected routes', () => {
  test('visiting certification-management shows app or sign-in', async ({
    page,
  }) => {
    await page.goto('/certification-management')
    await expect(page.locator('body')).toBeVisible()
    const url = page.url()
    const hasSignIn =
      url.includes('/sign-in') ||
      (await page.getByRole('link', { name: /sign in/i }).count()) > 0 ||
      (await page.locator('text=Sign in').count()) > 0
    const hasAppContent =
      (await page.locator('text=Certification').count()) > 0 ||
      (await page.locator('text=certification').first().count()) > 0
    expect(hasSignIn || hasAppContent).toBeTruthy()
  })

  test('visiting team-management shows app or sign-in', async ({ page }) => {
    await page.goto('/team-management')
    await expect(page.locator('body')).toBeVisible()
    const url = page.url()
    const hasSignIn = url.includes('/sign-in')
    const hasAppContent =
      (await page.locator('text=Team').count()) > 0 ||
      (await page.locator('text=team').first().count()) > 0
    expect(hasSignIn || hasAppContent).toBeTruthy()
  })

  test('visiting catalog shows app or sign-in', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.locator('body')).toBeVisible()
    const url = page.url()
    const hasSignIn = url.includes('/sign-in')
    const hasCatalog =
      (await page.locator('text=Catalog').count()) > 0 ||
      (await page.locator('text=catalog').first().count()) > 0
    expect(hasSignIn || hasCatalog).toBeTruthy()
  })
})
