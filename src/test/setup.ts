/**
 * Test setup file for Vitest
 * Configures global test environment, mocks, and utilities
 */

import { afterEach, beforeAll, vi } from 'vitest'

// Mock Clerk auth globally
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(),
}))

// Setup before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.CLERK_SECRET_KEY = 'test_secret_key'
  process.env.VITE_CLERK_PUBLISHABLE_KEY = 'test_publishable_key'
})

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
}
