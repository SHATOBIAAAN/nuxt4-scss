import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CI = Boolean(process.env.CI);

/* E2E идёт против прод-сборки (`pnpm build`), а не dev-сервера: CSP, гидрация,
   заголовки и кеш Nitro там такие же, как на хостинге. */
export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 60_000,
    env: {
      HOST: '127.0.0.1',
      PORT: String(PORT),
      NUXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
});
