import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Local-only workaround: this host may not have the OS libraries/fonts
// Playwright's bundled Chromium needs. In CI we use:
//   playwright install --with-deps chromium
// Locally, run:
//   pnpm test:e2e:local
if (process.env.PW_LOCAL_DEPS === '1') {
  const repoRoot = path.resolve(import.meta.dirname, '../../');
  const envFile = path.join(repoRoot, '.cache/playwright-deps.env');
  if (fs.existsSync(envFile)) {
    const previousLd = process.env.LD_LIBRARY_PATH;
    const env = fs.readFileSync(envFile, 'utf8');
    for (const line of env.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2];
    }
    if (previousLd && process.env.LD_LIBRARY_PATH) {
      process.env.LD_LIBRARY_PATH = `${process.env.LD_LIBRARY_PATH}:${previousLd}`;
    }
  }
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',

  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  fullyParallel: true,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['github'],
  ],

  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4321',

    // Determinism
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,

    // Debuggability
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    launchOptions: {
      args: ['--disable-dev-shm-usage', '--force-color-profile=srgb'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm preview',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
});
