import { expect, test, type Page } from '@playwright/test';

/* То, что расходится между движками. Идёт в Chromium, Firefox, WebKit (Safari) и WebKit с
   эмуляцией iPhone; остальной смоук — только в Chromium (playwright.config.ts). Примеры
   расхождений: нарушение CSP от пробы eval Firefox пишет в консоль, а Chromium молчит; запертая
   прокрутка и липкая шапка зависят от того, кто из html и body прокручивает окно. Панели
   настоящего Safari на iPhone эмулятор не рисует — их проверяют руками (docs/04-before-prod.md). */

/** Любая ошибка или предупреждение в консоли — провал, как в smoke.e2e.ts */
function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`[${message.type()}] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`[pageerror] ${error.message}`));
  return problems;
}

const visibilityOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element) => getComputedStyle(element).visibility);

/* Каждая страница — в своей вкладке: page.goto обрывает запросы прежней страницы (манифест
   сборки, предзагрузку ссылок), и WebKit пишет оборванный запрос в консоль ошибкой «access
   control checks» — это шум теста, а не сайта */
test('главная, список и статья открываются без ошибок и предупреждений в консоли', async ({
  context,
  request,
}) => {
  const { data } = (await (await request.get('/api/posts?limit=1')).json()) as {
    data: { slug: string }[];
  };
  const problems: string[] = [];

  for (const path of ['/', '/posts', ...data.map((post) => `/posts/${post.slug}`)]) {
    const page = await context.newPage();
    const pageProblems = watchConsole(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    problems.push(...pageProblems.map((problem) => `${path} ${problem}`));
    await page.close();
  }

  expect(problems).toEqual([]);
});

test.describe('телефон', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /* Safari на iOS 26 не рисует position: fixed под своими панелями — под плашкой адреса и часами
     проступала страница под меню. Пока меню открыто, страница спрятана (data-covers-page,
     layout.scss), и под панелями остаётся фон html. Пока окно открыто, шапка стоит на месте:
     reka-ui запирает body, а layout.scss переносит замок на html — иначе body сам становится
     прокручиваемым, и липкая шапка уезжает к началу страницы */
  test('под меню страница спрятана и шапка на месте; после — прокрутка и фокус как были', async ({
    page,
  }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const scrolled = await page.evaluate(() => window.scrollY);

    const trigger = page.getByRole('button', { name: 'Открыть меню' });
    const dialog = page.getByRole('dialog', { name: 'Меню' });
    await trigger.click();
    await expect(dialog).toBeVisible();

    await expect.poll(() => visibilityOf(page, '#__nuxt')).toBe('hidden');
    const headerTop = await page
      .locator('header')
      .first()
      .evaluate((header) => {
        return header.getBoundingClientRect().top;
      });
    expect(headerTop).toBe(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(await visibilityOf(page, '#__nuxt')).toBe('visible');
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });

  /* iOS приближает страницу, когда фокус попадает в поле с кеглем меньше 16 px, и сам её не
     отдаляет: дальше человек листает увеличенную страницу */
  test('поля ввода не мельче 16 px: iPhone не приближает страницу при фокусе', async ({ page }) => {
    await page.goto('/posts');
    const sizes = await page
      .locator('input:not([type="hidden"]), textarea, select')
      .evaluateAll((fields) =>
        fields.map((field) => Number.parseFloat(getComputedStyle(field).fontSize)),
      );

    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter((size) => size < 16)).toEqual([]);
  });
});
