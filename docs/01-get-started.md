# С чего начать

## Инструменты

```bash
corepack enable          # pnpm возьмётся из packageManager в package.json
node -v                  # >= 24 (версия для CI — в .node-version)
pnpm install             # postinstall генерирует типы и ставит git-хуки
pnpm exec playwright install chromium   # один раз, для pnpm test:e2e
```

pnpm 11 не запускает postinstall-скрипты зависимостей, пока они не разрешены в
`pnpm-workspace.yaml`. Каждая позиция там — с причиной; «на всякий случай» не добавляем.

## Переменные окружения

`.env.example` → `.env`. Все переменные читает **запущенный сервер**: один собранный `.output`
поднимается и на стенде, и на проде с разными значениями.

| Переменная               | Зачем                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| `NUXT_PUBLIC_SITE_URL`   | canonical, og:url, sitemap.xml, robots.txt; без неё прод не стартует |
| `NUXT_PUBLIC_SITE_NAME`  | название по умолчанию (перекрывает `site.name` из `nuxt.config.ts`)  |
| `NUXT_PUBLIC_SITE_ENV`   | всё, кроме `production`, закрывает сайт от индексации                |
| `NUXT_PUBLIC_API_PREFIX` | адрес API; внешний origin сам попадает в CSP connect-src             |
| `NUXT_CSP_REPORT_ONLY`   | `true` — CSP только в отчёты, на время выката новой политики         |
| `NUXT_CSP_REPORT_URI`    | куда браузер шлёт нарушения CSP                                      |

Исключение — `pnpm generate`: там страницы, sitemap и robots запекаются в статику, и адрес
нужен на сборке. Без него пререндер падает той же проверкой (`server/plugins/site-url.ts`).

## Добавить страницу

1. файл в `app/pages/` (маршрут — из имени);
2. `<PageLayout>` + `<PageSection>` и ровно один видимый `<h1>`;
3. `useSeoMeta({ title, description })` — название сайта к title добавит `app.vue`;
4. ссылка в `app/config/nav.ts`.

## Добавить сущность

1. zod-схема в `shared/schemas/` — она же тип и проверка;
2. моки в `server/mock/`;
3. ручка в `server/api/` (`getValidatedQuery`, `paginate`, `canonicalQueryKey`);
4. адреса записей — в `server/api/__sitemap__/urls.get.ts`;
5. вызов через `useApiFetch<T>` или `await usePagedList<T>(path, { schema })`.

## Когда появится настоящий API

1. `NUXT_PUBLIC_API_PREFIX` → адрес бэкенда;
2. моки и ручки в `server/api/` заменить или удалить; `server/utils/collection.ts` полезен,
   пока пагинация считается на своей стороне;
3. интерсепторы (auth и т. п.) — через свой `$fetch.create` и опцию `$fetch` в `useApiFetch`.
