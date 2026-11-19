import { defineConfig, devices } from '@playwright/test';

const webURL = process.env['E2E_WEB_URL'] ?? 'http://localhost:3000';
const apiURL = process.env['E2E_API_URL'] ?? 'http://localhost:3001/api/v1';

export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: webURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  metadata: {
    apiURL,
  },
  webServer: process.env['E2E_SKIP_WEBSERVER']
    ? undefined
    : {
        command: 'npx next dev --port 3000',
        url: `${webURL}/en`,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        cwd: '../web',
      },
});
