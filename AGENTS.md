# Правила для ИИ-агентов

Работаешь в этом репозитории или в проекте, клонированном из него. Ниже — что для чего
и что запрещено. Большинство правил проверяет машина (`pnpm test` → `test/architecture`),
поэтому нарушение видно сразу, а не на ревью.

## Стек

Nuxt 4.5 · Vue 3.5 · TypeScript 6 strict (7 ждёт поддержки в vue-tsc) · Pinia (UI-состояние) · SCSS-токены, Tailwind нет ·
reka-ui (headless) · Swiper через `<UiCarousel>` · GSAP через `useReveal` · `@nuxt/scripts` для
сторонних скриптов · ofetch (`useApiFetch`), axios нет · zod на обеих сторонах · oxlint + oxfmt,
Prettier и ESLint нет · vitest (unit + компоненты через `@nuxt/test-utils`) · Playwright (e2e) ·
pnpm 11, Node 24.

## Карта папок

| Путь                   | Что здесь                                                                  | Куда не лезет                          |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `app/components/ui/`   | атомы: `<UiButton>`, `<UiField>`, `<UiCarousel>`, `<UiContentHtml>`        | сторы, предметные поля, тексты проекта |
| `app/components/app/`  | каркас: `<AppHeader>`, `<AppFooter>`, `<AppNavDrawer>`, `<AppConfirmHost>` | доменная логика                        |
| `app/components/page/` | примитивы страницы: `<PageLayout>`, `<PageSection>`                        | данные                                 |
| `app/composables/`     | `useApiFetch`, `usePagedList`, `useReveal`, `useCanonicalLink`             | разметка                               |
| `app/stores/`          | только UI-состояние: `confirm`, `overlay`                                  | бизнес-данные (они приходят из API)    |
| `app/utils/`           | чистые функции для UI (`paginationItems`)                                  | обращения к API                        |
| `app/config/nav.ts`    | навигация и контакты                                                       | что-либо ещё                           |
| `app/assets/styles/`   | токены (`--gap-*`, `--radius-*`, `--brand-*`), брейкпоинты и миксины       | значения внутри компонентов            |
| `server/api/`          | ручки BFF (`*.get.ts`), `defineCachedEventHandler`                         | ключи и секреты                        |
| `server/plugins/`      | CSP на nonce, проверка адреса сайта при старте                             | бизнес-логика                          |
| `server/utils/`        | пагинация, поиск, ключ кеша, правила CSP                                   | обращения к внешним API                |
| `server/mock/`         | демо-данные                                                                | логика                                 |
| `shared/schemas/`      | zod-схема = тип = проверка                                                 | дубль типов в `shared/types/`          |
| `shared/utils/`        | разбор и канонический вид query по схеме                                   | код, завязанный на Vue или h3          |
| `test/`                | unit, архитектура, компоненты (`test/nuxt/`), e2e (`test/e2e/`)            | сниппеты «проверить глазами»           |

## Как писать компонент

1. **Имя файла = имя тега.** `ui/Button.vue` → `<UiButton>`. `index.vue` и `Component.vue`
   запрещены (тест): Nuxt съедает `index` и не съедает `Component`.
2. Новая папка верхнего уровня в `app/components/` = новый `{ path, prefix }` в
   `nuxt.config.ts` (тест сверяет).
3. `<script setup lang="ts">` + `defineProps<{…}>()` / `withDefaults` — runtime-форма
   запрещена линтером (`vue/define-props-declaration`).
4. Локальные классы — с префиксом `_` (`._Button`).
5. Цвет — только переменной из `app/assets/styles/colors.scss`: литерал цвета в `.vue` роняет тест.
6. Брейкпоинт — только миксином: `@include media-down(lg)` (уже lg), `@include media-up(lg)` (lg и
   шире), тест ловит `@media` с шириной в обход них. Числа — в `shared/utils/breakpoints.ts`, в JS
   импортируй оттуда. Размер «меньше на мобильном» — `fluid(20px, 24px)`, без лесенки медиазапросов.
7. Hover — `@include hover { … }` (тест ловит `:hover` вне `@media (pointer: fine)`),
   движение — `@include motion { … }`.
8. Динамический NuxtLink — `resolveComponent('NuxtLink')`, не строка в `:is` (тест).
9. На странице ровно один видимый `<h1>` (тест).
10. Портал reka-ui — в `<ClientOnly>` с пустым `<template #fallback />` (тест). Окно на весь экран
    (`position: fixed; inset: 0`) — `data-covers-page` на его подложке и фон `--page-bg`: пока оно
    открыто, страница под ним спрятана (`layout.scss`) — Safari на iOS 26 не рисует fixed под
    своими панелями, и там проступала бы страница (e2e).
11. Плавная прокрутка — только в `app/router.options.ts` (якорь на той же странице), не стилем
    (тест).

## Как добавлять сущность

1. `shared/schemas/<сущность>.ts` — zod-схема, `export type X = z.infer<…>`; параметры
   списка — `listQuerySchema.extend({ … })`, у каждого поля default или optional;
2. `server/mock/<сущность>.ts` — данные, типизированные схемой;
3. `server/api/…` — ручка: query через `getValidatedQuery(event, schema.parse)` (мусор → 400),
   список через `paginate(…)`, кеш с `getKey: (event) => canonicalQueryKey(schema, getQuery(event))`;
4. адреса записей — в источник sitemap (`server/api/__sitemap__/urls.get.ts`);
5. страница: `useApiFetch<X>()` или `await usePagedList<X>(path, { schema })`;
6. ссылка в `app/config/nav.ts` (тест проверяет, что страница существует).

Никогда не выдумывай форму ответа на клиенте: контракт `{ data, meta: { pagination } }`.

## Состояние

- влияет на содержимое экрана (страница, фильтры, поиск) → **в URL** через `usePagedList`
  (`setParams`, `pageLink`); адрес всегда канонический, значения по умолчанию в него не попадают;
- чисто локальное для одного компонента → `ref`;
- общее UI-состояние → стор Pinia в `app/stores/` с `ref` внутри (Pinia сама переносит его с SSR);
- стор нельзя деструктурировать без `storeToRefs` — теряется реактивность.

## Запрещено

- **`v-html` где-либо, кроме `app/components/ui/ContentHtml.vue`** (тест). Источник HTML —
  только своя админка; UGC — отдельная задача с санитайзером.
- `'unsafe-inline'` в `script-src` и кеш HTML-страниц через `routeRules` swr/isr: nonce CSP
  замёрзнет в кеше и станет одним на всех.
- новая зависимость с той же ролью, что уже есть (два HTTP-клиента, два слайдера);
  пакет без места потребления — тест `test/architecture` его не пропустит.
- `axios`, `qs`, `lodash.*`, `@vueuse/nuxt`, `@vueuse/components`, Tailwind, Prettier, ESLint (тест).
- `process.env` в `app/` (линтер и тест) и в `runtimeConfig` — настройки приходят через
  `NUXT_*`-переменные в рантайме.
- ключи и токены дефолтами в `nuxt.config.ts`.
- `git push`, выкатка и правка `.env` без явного запроса человека.

## Известные ловушки

| Ловушка                                                                                   | Что делать                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Строка `'NuxtLink'` в `<component :is>`                                                   | рендерится неизвестным тегом без `href`, молча. Только `resolveComponent('NuxtLink')`                                                                                                             |
| Свой `getKey` у `defineCachedEventHandler`                                                | Nitro режет ключ `replace(/\W/g, '')`: кириллица пропадает. Ключ — `canonicalQueryKey` (hex)                                                                                                      |
| `schema.parse(getQuery(event))` в ручке                                                   | ZodError даёт 500. Нужен `getValidatedQuery` — он отвечает 400                                                                                                                                    |
| `Intl.DateTimeFormat` в шаблоне                                                           | часовые пояса сервера и браузера разные → гидрация. Используй `<NuxtTime>`                                                                                                                        |
| `watch` без `immediate` как источник данных для разметки                                  | на сервере не выполняется → SSR и клиент расходятся. Данные для рендера — через `computed`                                                                                                        |
| Композабл внутри ленивого геттера (`title: () => useRuntimeConfig()…`)                    | снимай значение в setup, в геттере — переменную. Иначе `NUXT_E1001`                                                                                                                               |
| Композабл после `await` внутри своего async-композабла                                    | контекст Nuxt потерян. Всё — до первого `await`, навигация — через `nuxtApp.runWithContext`                                                                                                       |
| Портал reka-ui без `<ClientOnly>`                                                         | SSR рендерит пустоту → «Hydration completed but contains mismatches»                                                                                                                              |
| `DialogContent` без `DialogDescription`                                                   | рендери описание всегда, пустое — с классом `visually-hidden`                                                                                                                                     |
| Модуль дописывает inline-скрипт в HTML                                                    | CSP-плагин ставит nonce и ему; если скрипт всё же заблокирован — e2e покажет это в консоли                                                                                                        |
| Проверка окружения в `nuxt.config.ts`                                                     | нельзя: `NODE_ENV=production` и в typecheck, и в prepare. Адрес сайта проверяет `server/plugins/site-url.ts`                                                                                      |
| Алиасы в `server/`                                                                        | `#shared/…` работает с обеих сторон и в vitest; `nitro.alias` в типы не попадает                                                                                                                  |
| Кириллица в именах файлов `public/`                                                       | запрещена (тест)                                                                                                                                                                                  |
| `pnpm install` молча не запускает postinstall                                             | разреши сборку в `pnpm-workspace.yaml → allowBuilds` с причиной                                                                                                                                   |
| `<ClientOnly>` без `#fallback`                                                            | до монтирования ставит пустой `<span>`: во flex-строке лишний элемент, после гидрации соседи прыгают. Пустой `<template #fallback />` (тест)                                                      |
| Замок прокрутки reka-ui (`body` overflow: hidden) при своём `overflow` у `html`           | `body` становится контейнером прокрутки: страница под окном листается, липкая шапка уезжает к началу страницы. Запирать окно (`html`), `body` не трогать — `layout.scss` (e2e)                    |
| Окно на весь экран (`position: fixed; inset: 0`) в Safari на iOS 26                       | под плашкой адреса и часами проступает страница: fixed там не рисуется. `data-covers-page` на подложке — страница прячется, под панелями фон `html`; фон окна — `--page-bg` (e2e)                 |
| `scroll-behavior: smooth` у `html`                                                        | новая страница открывается с места прежней, якорь при загрузке не доезжает: ScrollTrigger сбивает плавную прокрутку. Плавно — только `app/router.options.ts` (тест)                               |
| `import { z } from 'zod'`                                                                 | zod 4 пробует `Function('')` — под CSP сайта это нарушение, Firefox пишет его в консоль. Только `shared/utils/zod.ts` с jitless (тест, e2e в Firefox)                                             |
| Поле ввода мельче 16 px                                                                   | iPhone приближает страницу при фокусе и сам не отдаляет. Кегль полей — от 16 (e2e на iPhone)                                                                                                      |
| `focus()` из кода после асинхронного действия (окно «Отправлено»)                         | Firefox рисует такой фокус как с клавиатуры: свечение на кнопке при каждом открытии. `focus({ focusVisible: false })`; в типах TypeScript опции нет — `FocusOptions & { focusVisible?: boolean }` |
| `context` из `gsap.context()` в `onEnter` ScrollTrigger                                   | блок уже позади старта («Назад» вернул место раньше GSAP) — onEnter зовётся при создании, context ещё не готов: ReferenceError. В onEnter — без него                                              |
| `clip-path`, `letter-spacing`, маска SVG в анимации первого экрана или слоя во весь экран | перерисовка на каждом кадре, рывки под гидрацией. Анимировать `transform` и `opacity`, декор — на своём слое (`will-change`)                                                                      |
| `getPointAtLength` в цикле                                                                | каждый вызов проходит путь с начала: сотни мс главного потока, рывок прокрутки. Точки — один раз, проходом по пути                                                                                |
| `useScript` для скрипта с ключом, ограниченным по Referer                                 | unhead ставит чужому скрипту `no-referrer` и `crossorigin`: сервис (Яндекс Карты) отклонит ключ. Такой скрипт — своим `<script>`, источник — в CSP                                                |
| `border-radius` с `overflow` у холста WebGL и чужого iframe                               | Firefox их не обрезает: холст рисует видеокарта, iframe — в своём процессе. Углы — закраской цветом страницы поверх                                                                               |
| Ключ `useStorage` с адресом и query (`/posts?page=2`)                                     | unstorage отбрасывает всё после «?» и делит ключ по «/» и «:» — все порции списка ложатся в один слот. Адрес в ключе — `encodeURIComponent`                                                       |
| Бренд-шрифт без preload и подогнанного запасного                                          | Firefox рисует первый кадр запасным шрифтом, и строка перестраивается на глазах. Шаги — в `fonts.scss`; ширина групп в строке — из макета, а не по тексту                                         |

## Проверки и их слепые зоны

```bash
pnpm fmt:check   # формат
pnpm lint        # <script>, с предупреждениями как ошибками; <template> и <style> не видит
pnpm typecheck   # типы и props в шаблонах + тесты и конфиги (tsconfig.tooling.json)
pnpm test        # unit, правила дерева (test/architecture), компоненты (test/nuxt)
pnpm build       # собираемость
pnpm test:e2e    # браузер против прод-сборки: консоль, гидрация, CSP, навигация, поиск;
                 # engines.e2e.ts — ещё в Firefox, WebKit и WebKit с эмуляцией iPhone
```

E2E — единственное, что видит ошибки гидрации и нарушения CSP. После правки, которая меняет
рендер, гоняй `pnpm build && pnpm test:e2e`, а не только `lint` и `typecheck`. Чего не видит и
он: панелей настоящего Safari на iPhone — их проверяют руками (`docs/04-before-prod.md`, п. 9).

## Тесты

Пиши правила, а не значения: «сумма длин страниц равна `total`», «у каждой ссылки есть
`href`», «регистр не влияет на поиск». Данные в e2e берутся из API, а не хардкодятся.
Расположение: `test/server/` — для `server/utils/`, `test/shared/` — для `shared/`,
`test/app/` — чистые функции `app/utils/`, `test/nuxt/` — компоненты, `test/e2e/` — Playwright.

## Чего в шаблоне нет, и появление этого — решение человека

auth и транспорт токенов, формы с валидацией на клиенте, i18n, аналитика и consent,
`@nuxt/image`, страница-витрина UI. Сначала согласование, потом код.
