# Структура

```
app/
  app.vue                     индикатор загрузки, объявление маршрута, мета-теги, canonical
  error.vue                   404 и 5xx, рендерится вне app.vue и вне layout
  layouts/default.vue         skip-link, шапка, футер, <AppConfirmHost>
  pages/
    index.vue                 витрина: заголовок, карусель, последние материалы
    posts/index.vue           список: usePagedList + поиск + пагинация ссылками
    posts/[slug].vue          детальная: useApiFetch + SEO + NuxtTime + UiContentHtml
  components/
    ui/                       атомы, префикс Ui
      Button.vue  Field.vue  Pagination.vue  Carousel.vue  ContentHtml.vue
      Card/Article.vue
      Icon/                   набор иконок, обёртка — Base.vue
    app/                      блоки каркаса, префикс App
      Header.vue  Footer.vue  NavDrawer.vue  ConfirmHost.vue
    page/                     примитивы страницы, префикс Page
      Layout.vue  Section.vue
  composables/
    useApi.ts                 useApiFetch (createUseFetch, адрес из runtimeConfig)
    usePagedList.ts           страница и фильтры в URL, канонический адрес
    useReveal.ts              появление на GSAP, только в браузере
    useCanonicalLink.ts       canonical и og:url на домене сайта
  stores/                     Pinia, только UI-состояние
    confirm.ts                подтверждение через Promise
    overlay.ts                открыто ли меню
  utils/pagination.ts         номера страниц навигатора
  config/nav.ts               навигация и контакты
  assets/styles/              _tools (брейкпоинты, миксины) · colors · ui · fonts · layout · global

server/
  api/posts.get.ts            список: валидация query, кеш по каноническому ключу
  api/posts/[slug].get.ts     деталь, 404 через createError
  api/__sitemap__/urls.get.ts адреса записей для sitemap.xml
  plugins/csp.ts              Content-Security-Policy на nonce
  plugins/site-url.ts         прод без NUXT_PUBLIC_SITE_URL не стартует
  utils/                      collection (пагинация, поиск) · cache-key · csp
  mock/posts.ts               демо-данные

shared/
  schemas/post.ts             zod-схема = тип = проверка
  types/content.ts            Pagination и ListResponse
  utils/query.ts              разбор и канонический вид query по схеме

test/
  server/  shared/  app/      unit: чистые функции
  architecture/               правила AGENTS.md: v-html, цвета, hover, h1, зависимости, доки
  nuxt/                       компоненты в окружении Nuxt (@nuxt/test-utils, happy-dom)
  e2e/                        Playwright против прод-сборки
```

## Что где менять

| Задача                    | Файл                                                       |
| ------------------------- | ---------------------------------------------------------- |
| Название, описание, домен | `nuxt.config.ts` → `site`, переменные `NUXT_PUBLIC_SITE_*` |
| Палитра                   | `app/assets/styles/colors.scss`                            |
| Типографика               | `app/assets/styles/fonts.scss`                             |
| Сетка, отступы, слои      | `app/assets/styles/layout.scss`                            |
| Брейкпоинты               | `app/assets/styles/_tools.scss`                            |
| Меню и контакты           | `app/config/nav.ts`                                        |
| Форма данных              | `shared/schemas/`                                          |
| Политика CSP              | `server/utils/csp.ts`                                      |
| Правила проекта           | `test/architecture/conventions.spec.ts`, `.oxlintrc.json`  |

## Чего в дереве нет сознательно

- папки app/middleware — появится с первой реальной защитой маршрута;
- папок `shared/` и `widgets/` внутри компонентов — только `ui` / `app` / `page` с префиксами;
- файла public/robots.txt — его генерирует `@nuxtjs/robots`, статический файл перекрыл бы его.
