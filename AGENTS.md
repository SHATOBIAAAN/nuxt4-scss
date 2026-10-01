# Правила для ИИ-агентов

Работаешь в этом репозитории или в проекте, клонированном из него. Ниже — что для чего
и что запрещено. Большинство правил проверяет машина (`pnpm test` → `test/architecture`),
поэтому нарушение видно сразу, а не на ревью.

## Стек

Nuxt 4.5 · Vue 3.5 · TypeScript strict · Pinia (UI-состояние) · SCSS-токены, Tailwind нет ·
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
6. Брейкпоинт — только миксином: `@include media-down(lg)`, `@include media-up(lg)`.
7. Hover — `@include hover { … }` (тест ловит `:hover` вне `@media (pointer: fine)`),
   движение — `@include motion { … }`.
8. Динамический NuxtLink — `resolveComponent('NuxtLink')`, не строка в `:is` (тест).
9. На странице ровно один видимый `<h1>` (тест).

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

| Ловушка                                                                | Что делать                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Строка `'NuxtLink'` в `<component :is>`                                | рендерится неизвестным тегом без `href`, молча. Только `resolveComponent('NuxtLink')`                        |
| Свой `getKey` у `defineCachedEventHandler`                             | Nitro режет ключ `replace(/\W/g, '')`: кириллица пропадает. Ключ — `canonicalQueryKey` (hex)                 |
| `schema.parse(getQuery(event))` в ручке                                | ZodError даёт 500. Нужен `getValidatedQuery` — он отвечает 400                                               |
| `Intl.DateTimeFormat` в шаблоне                                        | часовые пояса сервера и браузера разные → гидрация. Используй `<NuxtTime>`                                   |
| `watch` без `immediate` как источник данных для разметки               | на сервере не выполняется → SSR и клиент расходятся. Данные для рендера — через `computed`                   |
| Композабл внутри ленивого геттера (`title: () => useRuntimeConfig()…`) | снимай значение в setup, в геттере — переменную. Иначе `NUXT_E1001`                                          |
| Композабл после `await` внутри своего async-композабла                 | контекст Nuxt потерян. Всё — до первого `await`, навигация — через `nuxtApp.runWithContext`                  |
| Портал reka-ui без `<ClientOnly>`                                      | SSR рендерит пустоту → «Hydration completed but contains mismatches»                                         |
| `DialogContent` без `DialogDescription`                                | рендери описание всегда, пустое — с классом `visually-hidden`                                                |
| Модуль дописывает inline-скрипт в HTML                                 | CSP-плагин ставит nonce и ему; если скрипт всё же заблокирован — e2e покажет это в консоли                   |
| Проверка окружения в `nuxt.config.ts`                                  | нельзя: `NODE_ENV=production` и в typecheck, и в prepare. Адрес сайта проверяет `server/plugins/site-url.ts` |
| Алиасы в `server/`                                                     | `#shared/…` работает с обеих сторон и в vitest; `nitro.alias` в типы не попадает                             |
| Кириллица в именах файлов `public/`                                    | запрещена (тест)                                                                                             |
| `pnpm install` молча не запускает postinstall                          | разреши сборку в `pnpm-workspace.yaml → allowBuilds` с причиной                                              |

## Проверки и их слепые зоны

```bash
pnpm fmt:check   # формат
pnpm lint        # <script>, с предупреждениями как ошибками; <template> и <style> не видит
pnpm typecheck   # типы и props в шаблонах + тесты и конфиги (tsconfig.tooling.json)
pnpm test        # unit, правила дерева (test/architecture), компоненты (test/nuxt)
pnpm build       # собираемость
pnpm test:e2e    # браузер против прод-сборки: консоль, гидрация, CSP, навигация, поиск
```

E2E — единственное, что видит ошибки гидрации и нарушения CSP. После правки, которая меняет
рендер, гоняй `pnpm build && pnpm test:e2e`, а не только `lint` и `typecheck`.

## Тесты

Пиши правила, а не значения: «сумма длин страниц равна `total`», «у каждой ссылки есть
`href`», «регистр не влияет на поиск». Данные в e2e берутся из API, а не хардкодятся.
Расположение: `test/server/` — для `server/utils/`, `test/shared/` — для `shared/`,
`test/app/` — чистые функции `app/utils/`, `test/nuxt/` — компоненты, `test/e2e/` — Playwright.

## Чего в шаблоне нет, и появление этого — решение человека

auth и транспорт токенов, формы с валидацией на клиенте, i18n, аналитика и consent,
`@nuxt/image`, страница-витрина UI. Сначала согласование, потом код.
