import path from 'path';
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const playwrightTarget = process.env.PLAYWRIGHT_TARGET === 'vercel' ? 'vercel' : 'local';
const localFrontendUrl = process.env.PLAYWRIGHT_LOCAL_FRONTEND_URL || 'http://127.0.0.1:3100';
const localApiHealthUrl = process.env.PLAYWRIGHT_LOCAL_API_HEALTH_URL || 'http://127.0.0.1:5100/health';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localFrontendUrl;
const shouldStartLocalStack = playwrightTarget === 'local' && !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: path.join(__dirname, 'e2e', 'tests'),
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  outputDir: path.join(__dirname, 'test-results'),
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ar-EG',
    testIdAttribute: 'data-testid',
  },
  webServer: shouldStartLocalStack
    ? [
        {
          command: 'node ./scripts/start-server-for-playwright.cjs',
          url: localApiHealthUrl,
          cwd: __dirname,
          reuseExistingServer: false,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        {
          command: 'node ./scripts/start-frontend-for-playwright.cjs',
          url: localFrontendUrl,
          cwd: __dirname,
          reuseExistingServer: false,
          timeout: 240_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      ]
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
