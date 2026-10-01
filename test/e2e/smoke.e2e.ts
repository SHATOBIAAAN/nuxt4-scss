import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/* Смоук прод-сборки в настоящем браузере. Ловит то, что не видят линтер, типы и
   юнит-тесты: ошибки гидрации, нарушения CSP, ссылки без href, сломанный поиск.
   Данные не захардкожены — тесты берут посты из API и проверяют правила. */

interface PostItem {
  slug: string;
  title: string;
  lead: string;
  tags: string[];
}

interface ListBody {
  data: PostItem[];
  meta: { pagination: { page: number; totalPages: number; total: number } };
}

/** Любая ошибка или предупреждение в консоли — провал: туда пишут гидрация, CSP и reka-ui. */
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

async function list(request: APIRequestContext, query = 'limit=50'): Promise<ListBody> {
  const response = await request.get(`/api/posts?${query}`);
  expect(response.ok()).toBe(true);
  return (await response.json()) as ListBody;
}

const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е');
const textOf = (post: PostItem) => normalize([post.title, post.lead, ...post.tags].join(' '));

/** Самое длинное слово заголовка, которого нет в тексте других постов. */
function distinctiveWord(post: PostItem, others: PostItem[]) {
  return post.title
    .split(/[^\p{L}\d]+/u)
    .filter(
      (word) =>
        word.length >= 4 && !others.some((other) => textOf(other).includes(normalize(word))),
    )
    .toSorted((a, b) => b.length - a.length)[0];
}

test.describe('страницы', () => {
  test('открываются без ошибок в консоли: один h1, title и canonical на домене сайта', async ({
    page,
    request,
    baseURL,
  }) => {
    const problems = watchConsole(page);
    const [post] = (await list(request)).data;
    const paths = ['/', '/posts', ...(post ? [`/posts/${post.slug}`] : [])];

    for (const path of paths) {
      const response = await page.goto(path);
      await page.waitForLoadState('networkidle');

      expect(response?.status(), path).toBe(200);
      await expect(page.locator('h1'), path).toHaveCount(1);
      expect(await page.title(), path).not.toBe('');
      await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute(
        'href',
        `${baseURL}${path === '/' ? '/' : path}`,
      );
    }

    expect(problems).toEqual([]);
  });

  test('кнопки и ссылки — настоящие <a href>, неизвестных тегов в разметке нет', async ({
    page,
  }) => {
    for (const path of ['/', '/posts', '/missing-page']) {
      await page.goto(path);

      const unknown = await page.evaluate(() =>
        [...document.body.querySelectorAll('*')]
          .filter((element) => element instanceof HTMLUnknownElement)
          .map((element) => element.tagName.toLowerCase()),
      );
      expect(unknown, path).toEqual([]);
      await expect(page.locator('a:not([href])'), path).toHaveCount(0);
    }
  });

  test('кнопка раздела на главной ведёт в раздел', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'Статьи' }).click();

    await expect(page).toHaveURL(/\/posts$/);
  });

  test('с клавиатуры первым идёт переход к содержимому', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Перейти к содержимому' })).toBeFocused();
  });
});

test.describe('ошибки', () => {
  test('несуществующая страница и пост отдают 404, выход на главную работает', async ({ page }) => {
    for (const path of ['/missing-page', '/posts/missing-post']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }

    await page.getByRole('link', { name: 'На главную' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).not.toHaveText('Страница не найдена');
  });

  test('мусор в query API — 400, а не 500', async ({ request }) => {
    for (const query of ['page=0', 'page=-1', 'page=abc', 'limit=1000']) {
      const response = await request.get(`/api/posts?${query}`);
      expect(response.status(), query).toBe(400);
    }
  });
});

test.describe('поиск', () => {
  test('разные кириллические запросы не делят один слот кеша', async ({ request }) => {
    const posts = (await list(request)).data;
    const probes = posts
      .map((post) => ({
        post,
        word: distinctiveWord(
          post,
          posts.filter((other) => other !== post),
        ),
      }))
      .filter((probe): probe is { post: PostItem; word: string } => Boolean(probe.word));

    expect(probes.length).toBeGreaterThanOrEqual(2);

    for (const { post, word } of probes) {
      const found = (await list(request, `q=${encodeURIComponent(word)}`)).data;

      expect(
        found.map((item) => item.slug),
        word,
      ).toContain(post.slug);
      for (const item of found) expect(textOf(item), word).toContain(normalize(word));
    }
  });

  test('запрос уходит в адрес, «Сбросить» спрашивает подтверждение и очищает', async ({
    page,
    request,
  }) => {
    const posts = (await list(request)).data;
    const [first] = posts;
    const word = first && distinctiveWord(first, posts.slice(1));
    test.skip(!word, 'нет поста с уникальным словом в заголовке');

    await page.goto('/posts');
    await page.getByRole('searchbox', { name: 'Поиск по статьям' }).fill(word!);
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(word!)}`));
    await expect(page.getByRole('main').getByRole('heading', { level: 2 }).first()).toContainText(
      word!,
      { ignoreCase: true },
    );

    await page.getByRole('button', { name: 'Сбросить' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Да' }).click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByRole('searchbox', { name: 'Поиск по статьям' })).toHaveValue('');
  });
});

test.describe('пагинация', () => {
  test('страницы — ссылки для краулера, у каждой свой canonical', async ({ page, request }) => {
    const { totalPages } = (await list(request, 'limit=3')).meta.pagination;
    test.skip(totalPages < 2, 'постов на одну страницу');

    await page.goto('/posts');
    const next = page.getByRole('link', { name: 'Следующая страница' });
    await expect(next).toHaveAttribute('href', /page=2/);

    const firstTitle = await page
      .getByRole('main')
      .getByRole('heading', { level: 2 })
      .first()
      .textContent();
    await next.click();

    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('main').getByRole('heading', { level: 2 }).first()).not.toHaveText(
      firstTitle ?? '',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/posts\?page=2$/);
  });

  test('неканонический адрес списка уводится редиректом', async ({ request }) => {
    const cases = [
      { from: '/posts?page=1', status: 301, to: /\/posts$/ },
      { from: '/posts?page=abc', status: 301, to: /\/posts$/ },
      { from: '/posts?q=', status: 301, to: /\/posts$/ },
      { from: '/posts?page=999', status: 302, to: /\/posts(\?page=\d+)?$/ },
    ];

    for (const { from, status, to } of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(status);
      expect(response.headers().location, from).toMatch(to);
    }
  });
});

test.describe('мобильное меню', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('диалог открывается, закрывается по Escape и возвращает фокус', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Открыть меню' });
    const dialog = page.getByRole('dialog', { name: 'Меню' });

    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog.getByRole('link', { name: 'Статьи' }).click();
    await expect(page).toHaveURL(/\/posts$/);
    await expect(dialog).toBeHidden();
  });
});

test.describe('часовой пояс браузера отличается от серверного', () => {
  test.use({ timezoneId: 'Pacific/Honolulu' });

  test('даты публикации не ломают гидрацию', async ({ page, request }) => {
    const problems = watchConsole(page);

    for (const post of (await list(request)).data) {
      await page.goto(`/posts/${post.slug}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('time')).toBeVisible();
    }

    expect(problems).toEqual([]);
  });
});

test.describe('уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });

  test('контент не прячется ради анимации появления', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const opacities = await page
      .locator('[data-reveal]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).opacity));
    expect(opacities.length).toBeGreaterThan(0);
    expect(opacities.every((opacity) => opacity === '1')).toBe(true);
  });
});

test.describe('сервер', () => {
  test('CSP на nonce: без unsafe-inline в script-src, у каждого ответа свой nonce', async ({
    request,
  }) => {
    const policies = await Promise.all(
      ['/', '/', '/missing-page'].map(
        async (path) => (await request.get(path)).headers()['content-security-policy'] ?? '',
      ),
    );
    const nonces = policies.map((policy) => /'nonce-([^']+)'/.exec(policy)?.[1]);

    for (const policy of policies) {
      const scriptSrc = policy.split('; ').find((item) => item.startsWith('script-src')) ?? '';
      expect(scriptSrc).toContain("'strict-dynamic'");
      expect(scriptSrc).not.toContain('unsafe-inline');
    }
    expect(new Set(nonces).size).toBe(nonces.length);
  });

  test('заголовки безопасности на месте', async ({ request }) => {
    const headers = (await request.get('/')).headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBeTruthy();
  });

  test('sitemap.xml перечисляет каждую статью на домене сайта', async ({ request, baseURL }) => {
    const xml = await (await request.get('/sitemap.xml')).text();

    for (const post of (await list(request)).data) {
      expect(xml).toContain(`${baseURL}/posts/${post.slug}`);
    }
  });
});
