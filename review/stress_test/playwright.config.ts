import { defineConfig, devices } from '@playwright/test';

/**
 * Stress-test Playwright config.
 *
 * Runs against:       process.env.BASE_URL (default: live Vercel URL)
 * QA auth:            process.env.QA_EMAIL, process.env.QA_PASSWORD
 *                     (loaded from .env.playwright locally, or from
 *                     GitHub Actions secrets in CI)
 *
 * Run locally:  npx playwright test --config review/stress_test/playwright.config.ts
 */
import { config as dotenvConfig } from 'dotenv';

// Load root .env first (harmless if missing), then .env.playwright
// (local-only, gitignored) on top so it wins.
dotenvConfig();
dotenvConfig({ path: '.env.playwright', override: true });

export default defineConfig({
  testDir: './specs',
  outputDir: './_out/playwright',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: './_out/playwright-report.json' }],
    ['html', { outputFolder: './_out/html', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://myphonicsbooks.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/personas.spec.ts'], // mobile persona only
    },
  ],
});
