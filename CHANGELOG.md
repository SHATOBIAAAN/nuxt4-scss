# Changelog

Формат — Keep a Changelog, версии — semver. Заполняется при каждом изменении каркаса: живой
проект подтягивает шаблон через `git merge upstream/main`, и без этого файла не с чем сверять,
что именно поехало.

## [0.3.0] — 2026-10-01

### Fixed

- щель между `media-down` и `media-up`: пара `max-width: X` / `min-width: X + 1px` при дробной
  ширине окна (масштаб 110–125%) не срабатывала вовсе — `.only-mobile` и `.only-desktop`
  прятались одновременно. Теперь `width < X` / `width >= X`
- карусель переключалась на 2 слайда на 768px, а вёрстка считала 768px мобильной: числа
  Swiper были захардкожены отдельно от SCSS
- брейкпоинт `xs: 320px` не срабатывал на реальных телефонах (`html` не уже 320px) → `375px`

### Added

- `shared/utils/breakpoints.ts` — один источник чисел для SCSS (через `additionalData`) и JS
- `fluid($min, $max)` в `_tools.scss` — плавный `clamp()` от xs до xl, границы в rem
- тест: `@media` с шириной — только миксинами

### Changed

- **поведение брейкпоинтов**: `media-down(md)` — теперь «уже 768px» (было «до 768px
  включительно»), `media-up(md)` — «от 768px» (было «от 769px»), как у min-width в Swiper и
  Bootstrap. Сдвиг на 1px, вёрстку на реальных устройствах не меняет
- `caption-*`, `text-18`, `--gap-24/32/48/64` растут плавно через `fluid()` вместо ступеней
- зависимости: swiper 14, @vueuse/core 15, TypeScript 6.0, патчи модулей Nuxt, sass, oxc;
  GitHub Actions: checkout, setup-node, upload-artifact v7, pnpm/action-setup v6
- Dependabot не предлагает мажор `@types/node` (идёт за `.node-version`) и TypeScript 7

## [0.2.0] — 2026-09-28

### Fixed

- `<UiButton to>` рендерился неизвестным тегом без `href` (строка `'NuxtLink'` в `:is`) —
  кнопки на главной и «На главную» на 404 никуда не вели; теперь `resolveComponent`
- кеш списка: свой `getKey` после `escapeKey` Nitro терял кириллицу, и разные запросы делили
  один слот; ключ — hex-дайджест канонического query (`canonicalQueryKey`)
- мусор в query давал 500 (необработанный ZodError); теперь `getValidatedQuery` → 400
- деталь поста отдавала 404 при любой ошибке API; теперь 404 только на 404, иначе 5xx
- CSP нельзя было перевести в enforce: Nuxt кладёт в HTML inline-скрипты. Политика на nonce
  (`server/plugins/csp.ts`), сразу в enforce, HTML приложения nonce не получает
- в sitemap не было статей: источник `server/api/__sitemap__/urls.get.ts`
- пагинация была кнопками — краулер не видел страниц дальше первой; теперь ссылки
- поиск со второй страницы не сбрасывал номер страницы; адрес списка всегда канонический
  (301 для мусора и значений по умолчанию, 302 за пределами списка)
- дата публикации через `Intl` расходилась при гидрации в другом часовом поясе → `<NuxtTime>`
- год в футере мог разойтись при гидрации в новогоднюю ночь → `useState`
- контраст: фокус-кольцо 1.24:1 → outline 6.9:1, `--text-muted` 2.9:1 → 4.8:1,
  `--danger` 4.2:1 → 5.2:1; у стрелок пагинации появились доступные имена
- скрытый `h1` дублировал видимый `h2`; теперь на странице один видимый `h1`
- у мобильного меню не было `DialogDescription` и `aria-expanded`; блокировку прокрутки
  делает reka-ui, ручная (конфликтовала между стором меню и диалога) удалена
- `useReveal`: gsap грузится после монтирования, анимации снимаются `revert()`, контент на
  экране не мигает
- `import/no-cycle` не работал: плагин `import` не был включён

### Added

- `test/architecture` — правила AGENTS.md проверяются машиной: `v-html`, литералы цвета,
  hover, один `h1`, NuxtLink, `process.env`, имена компонентов, мёртвые компоненты и экспорты,
  зависимости без потребителя, запрещённые пакеты, пути и компоненты в документации
- компонентные тесты на `@nuxt/test-utils` + happy-dom (`test/nuxt/`)
- Playwright-смоук против прод-сборки (`test/e2e/`): консоль, гидрация, CSP, навигация,
  поиск, пагинация, меню, 404, sitemap, заголовки
- `<UiCarousel>` — единственная точка знакомства со Swiper, стили Swiper только на её страницах
- `useCanonicalLink`, `titleTemplate`, canonical со своей страницей у списков
- заголовки безопасности (nosniff, Referrer-Policy, Permissions-Policy, COOP)
- `server/plugins/site-url.ts`: прод без `NUXT_PUBLIC_SITE_URL` не стартует
- брейкпоинты и миксины `media-down`, `media-up`, `hover`, `motion` в `_tools.scss`;
  токены слоёв, теней и подложек
- skip-link «Перейти к содержимому», `role="search"` и подпись у поля поиска
- CI: `permissions`, `concurrency`, `timeout-minutes`, Node из `.node-version`, e2e;
  Dependabot для npm и GitHub Actions
- `tsconfig.tooling.json`: typecheck проверяет тесты и конфиги

### Changed

- формат: 2 пробела, 100 колонок
- стили переехали в `app/assets/styles`
- oxlint: плагины `import`, `node`, `vue`, `vitest`; предупреждения валят проверку
- `useApiFetch` — на `createUseFetch` (Nuxt 4.2+): типы опций и ключи по месту вызова
- название, описание и адрес сайта — один источник, `site` в `nuxt.config.ts`
- кеш Nitro ограничен по байтам (`maxSize`), а не по числу записей
- сторы Pinia — на `ref` без `useState` внутри: Pinia сама переносит состояние с SSR
- lint-staged: сначала `oxlint --fix`, потом `oxfmt`; покрыты `.mjs` и `.yml`

### Removed

- scripts/check-prod-env.mjs — адрес проверяется у запущенного сервера, сборка от
  окружения не зависит
- глобальный `swiper/css` из `nuxt.config.ts`
- `useScroll` — прокрутку блокирует reka-ui

## [0.1.0] — 2026-09-28

Первая версия каркаса: Nuxt 4.5, Vue 3.5, Pinia, SCSS-токены, BFF-слой с zod и lruCache,
reka-ui, Swiper, GSAP, CSP в Report-Only, sitemap и robots, oxlint + oxfmt, GitHub Actions,
инвариантные тесты пагинации и поиска, документация `docs/01–05`.
