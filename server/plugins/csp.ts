/* Строгая Content-Security-Policy для HTML-ответов: nonce на каждый ответ,
   без 'unsafe-inline' в script-src (правила — server/utils/csp.ts).

   В dev не включается: Vite и Nuxt DevTools вставляют свои скрипты и websocket,
   а поведение политики проверяет e2e на прод-сборке. В пререндере тоже: у
   статического HTML нет заголовков ответа, и nonce в нём был бы один на всех —
   для `pnpm generate` политику по хешам ставят на CDN.

   HTML с nonce нельзя кешировать целиком (routeRules swr/isr для страниц):
   кешированный ответ отдаст всем один и тот же nonce. */
export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev || import.meta.prerender) return;

  const { csp, public: config } = useRuntimeConfig();
  const api = externalOrigin(config.apiPrefix);
  const header = csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

  /* Хук регистрируется на первом запросе, когда плагины всех модулей уже подключены:
     так он выполняется последним и видит скрипты, которые модули дописывают в HTML. */
  nitroApp.hooks.hookOnce('request', () => {
    nitroApp.hooks.hook('render:html', (html, { event }) => {
      const nonce = createNonce();
      applyNonce(html, nonce);

      setResponseHeader(
        event,
        header,
        buildCsp({ nonce, connectSrc: api ? [api] : [], reportUri: csp.reportUri }),
      );
      if (csp.reportUri) setResponseHeader(event, 'Reporting-Endpoints', `csp="${csp.reportUri}"`);
    });
  });
});
