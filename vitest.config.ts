import { fileURLToPath } from 'node:url';
import { defineVitestProject } from '@nuxt/test-utils/config';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/* Два проекта с разной ценой запуска:
   - unit — чистые функции и правила дерева файлов, в node, без Nuxt: доли секунды;
   - nuxt — компоненты и композаблы в окружении Nuxt (@nuxt/test-utils, happy-dom):
     автоимпорты, #components и runtimeConfig работают как в приложении.
   Поведение страниц в настоящем браузере проверяет Playwright (test/e2e). */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            // Алиасы Nuxt для чистых модулей: сам Nuxt в unit-проекте не поднимается
            '#shared': fromRoot('./shared'),
            '~': fromRoot('./app'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/{app,architecture,server,shared}/**/*.spec.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['test/nuxt/**/*.spec.ts'],
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
        },
      }),
    ],
  },
});
