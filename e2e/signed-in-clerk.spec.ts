/**
 * Authenticated E2E: catalog, teams, compliance (Clerk + @clerk/testing).
 * Skipped unless Clerk keys and E2E user credentials are set — see docs/e2e-clerk.md.
 */

import { clerk } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

const publishable =
  process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY
const clerkKeysConfigured =
  Boolean(
    process.env.CLERK_SECRET_KEY?.startsWith('sk_') &&
    publishable?.startsWith('pk_'),
  ) &&
  /** clerkSetup refuses production secret keys */
  !process.env.CLERK_SECRET_KEY?.startsWith('sk_live_')

const e2eUserConfigured = Boolean(
  process.env.E2E_CLERK_USER_USERNAME && process.env.E2E_CLERK_USER_PASSWORD,
)

const signedInE2eReady = clerkKeysConfigured && e2eUserConfigured

const describeSignedIn = signedInE2eReady ? test.describe : test.describe.skip

describeSignedIn('Signed-in flows (Clerk)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    })
    await page.waitForURL(
      (url) =>
        !url.pathname.startsWith('/sign-in') &&
        !url.pathname.startsWith('/sign-up'),
      { timeout: 60_000 },
    )
  })

  test('catalog shows Certification Catalog', async ({ page }) => {
    await page.goto('/catalog')
    await expect(
      page.getByRole('heading', { name: 'Certification Catalog' }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('#catalog-search')).toBeVisible()
  })

  test('team management shows Team & Workforce', async ({ page }) => {
    await page.goto('/team-management')
    await expect(
      page.getByRole('heading', { name: 'Team & Workforce' }),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('compliance audit shell loads', async ({ page }) => {
    await page.goto('/compliance-audit')
    await expect(
      page.getByRole('heading', { name: 'Compliance & Audit' }),
    ).toBeVisible({ timeout: 30_000 })
    // API requires Admin / Auditor / Executive; regular User sees "unavailable" after fetch
    await expect(
      page
        .getByText('Compliance Rate')
        .or(page.getByText('Compliance data unavailable.')),
    ).toBeVisible({ timeout: 30_000 })
  })
})
