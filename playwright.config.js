import { defineConfig } from '@playwright/test';

const deployedURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 1,
  timeout: process.env.CI ? 1200000 : 60000,
  expect: { timeout: process.env.CI ? 300000 : 15000 },
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
    trace: { mode: 'retain-on-failure', screenshots: !process.env.CI, snapshots: true },
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist'] },
  },
  webServer: deployedURL ? undefined : {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173/portfolio/',
    reuseExistingServer: !process.env.CI,
  },
});
