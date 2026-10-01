import { postSchema } from '#shared/schemas/post';
import { POSTS } from '../../mock/posts';

export default defineCachedEventHandler(
  (event) => {
    const slug = getRouterParam(event, 'slug', { decode: true });
    const post = POSTS.find((item) => item.slug === slug);

    /* 404 статусом, а не undefined: страница детали превращает его в 404 страницы.
       Текст — в message: statusMessage уходит в строку статуса HTTP, где кириллица
       недопустима, и h3 её вырезает. */
    if (!post) throw createError({ status: 404, message: 'Пост не найден' });

    // Проверка на выходе: объект без поля падает здесь, а не пустой страницей в браузере
    return postSchema.parse(post);
  },
  { name: 'post', maxAge: 60, swr: true },
);
