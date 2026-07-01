import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for UniLink URMS
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Do not run tests in parallel to avoid database locks and test conflict */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker to prevent SQLite database locks/concurrency issues */
  workers: 1,
  /* Reporter to use. HTML reporter for human readability */
  reporter: 'html',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers - only Chromium for speed/reliability */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
