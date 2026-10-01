// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', 'reka-ui/nuxt', '@nuxt/scripts', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  css: ['~/assets/styles/global.scss'],

  /* Разрешённые папки компонентов. Имена те же, что дал бы Nuxt по умолчанию
     (ui/Button.vue → <UiButton>), но файл в папке, которой нет в списке, не
     зарегистрируется вовсе: новый слой компонентов добавляют сюда осознанно.
     test/architecture сверяет этот список с деревом app/components. */
  components: [
    { path: '~/components/ui', prefix: 'Ui' },
    { path: '~/components/app', prefix: 'App' },
    { path: '~/components/page', prefix: 'Page' },
  ],

  /* Один источник названия, описания и адреса сайта: <title>, og-теги, canonical,
     sitemap.xml и robots.txt. NUXT_PUBLIC_SITE_URL / _NAME / _DESCRIPTION / _ENV
     перекрывают значения и на сборке, и у запущенного сервера (см. .env.example). */
  site: {
    name: 'Nuxt 4 SCSS Template',
    description: 'Минимальный каркас Nuxt 4: слои, токены, BFF-слой и примеры страниц.',
  },

  // Статические страницы модуль находит сам, записи из API — через этот источник.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      // maximum-scale и user-scalable не ставить: запрет масштабирования ломает доступность
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  runtimeConfig: {
    // Content-Security-Policy для HTML (server/plugins/csp.ts)
    csp: {
      // NUXT_CSP_REPORT_ONLY=true — только отчёты, на время выката новой политики
      reportOnly: false,
      // NUXT_CSP_REPORT_URI — куда браузер шлёт нарушения
      reportUri: '',
    },
    public: {
      // '/api' — BFF в server/api; NUXT_PUBLIC_API_PREFIX меняет адрес без пересборки
      apiPrefix: '/api',
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        /* Брейкпоинты и миксины доступны в каждом <style lang="scss">. В @media
           CSS-переменные не работают, поэтому брейкпоинты живут только в SCSS. */
        scss: { additionalData: '@use "~/assets/styles/tools" as *;\n' },
      },
    },
  },

  nitro: {
    /* Кеш cached-хендлеров — память процесса с потолком в байтах: LRU вытесняет
       давно нетронутые ответы. Кеш не общий для нескольких инстансов и обнуляется
       рестартом; при масштабировании драйвер меняют на Redis. */
    storage: {
      cache: { driver: 'lruCache', maxSize: 32 * 1024 * 1024 },
    },
    // В dev Nitro по умолчанию пишет кеш в файлы — локально меряем тот же драйвер, что в проде
    devStorage: {
      cache: { driver: 'lruCache', maxSize: 32 * 1024 * 1024 },
    },
    routeRules: {
      /* Заголовки для всех ответов. CSP ставит server/plugins/csp.ts — ей нужен свой
         nonce на каждый HTML-ответ. HSTS — на прокси или CDN: только там известно,
         что сайт отдаётся исключительно по HTTPS. */
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },
});
