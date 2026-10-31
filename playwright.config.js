import { defineConfig } from '@playwright/test';

const deployedURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: process.env.CI ? 240000 : 60000,
  expect: { timeout: process.env.CI ? 90000 : 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'desktop', use: { deviceScaleFactor: 1 } },
    { name: 'retina', use: { deviceScaleFactor: 2 } },
  ],
  use: {
    baseURL: deployedURL || 'http://127.0.0.1:4173/portfolio/',
    viewport: { width: 1440, height: 900 },
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist'] },
  },
  webServer: deployedURL ? undefined : {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173/portfolio/',
    reuseExistingServer: !process.env.CI,
  },
});
