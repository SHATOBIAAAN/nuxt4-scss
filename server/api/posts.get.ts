import { listQuerySchema, postSchema } from '#shared/schemas/post';
import { POSTS } from '../mock/posts';

/* Список постов с кешем Nitro (lruCache из nuxt.config.ts). Для моков кеш избыточен,
   но показывает границу: когда здесь появится внешний бэкенд, maxAge — вся настройка
   «не бить по API на каждый хит». Ключ — канонический query, см. server/utils/cache-key.ts. */
export default defineCachedEventHandler(
  async (event) => {
    // Невалидный query — 400 с описанием от zod, а не 500 от необработанного ZodError
    const query = await getValidatedQuery(event, (input) => listQuerySchema.parse(input));

    const found = POSTS.filter((post) =>
      matchesSearch([post.title, post.lead, ...post.tags], query.q),
    ).toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    const page = paginate(found, query.page, query.limit);

    // Проверка на выходе: объект без поля падает здесь, а не пустой карточкой в браузере
    return { ...page, data: postSchema.array().parse(page.data) };
  },
  {
    name: 'posts',
    maxAge: 60,
    swr: true,
    getKey: (event) => canonicalQueryKey(listQuerySchema, getQuery(event)),
  },
);
