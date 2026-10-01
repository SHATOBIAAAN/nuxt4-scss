/* Прод-сервер без адреса сайта не стартует. Без NUXT_PUBLIC_SITE_URL canonical,
   og:url, sitemap.xml и robots.txt строятся из заголовка Host, а за прокси это
   внутренний адрес — поисковик получает ссылки на него. Предупреждение в логе
   здесь не вариант: его читают ровно один раз.

   Проверка в рантайме, а не в nuxt.config.ts: сборка от адреса не зависит (один
   .output едет на стенд и на прод), а Nuxt ставит NODE_ENV=production и для
   typecheck, и для prepare. `pnpm generate` запускает этот же плагин при
   пререндере, поэтому статическая сборка без адреса тоже падает. */
export default defineNitroPlugin(() => {
  if (import.meta.dev) return;
  if (process.env.NUXT_PUBLIC_SITE_URL || process.env.NUXT_SITE_URL) return;

  throw new Error(
    'NUXT_PUBLIC_SITE_URL не задан: без него canonical, sitemap.xml и robots.txt ' +
      'получат адрес из заголовка Host. Пример: NUXT_PUBLIC_SITE_URL=https://example.com',
  );
});
