import { POSTS } from '../../mock/posts';

/* Динамические адреса для @nuxtjs/sitemap (nuxt.config.ts → sitemap.sources).
   Статические страницы модуль находит сам, а про записи из API ему неоткуда узнать:
   без этой ручки в карте сайта нет ни одной статьи. */
export default defineSitemapEventHandler(() =>
  POSTS.map((post) => ({ loc: `/posts/${post.slug}`, lastmod: post.publishedAt })),
);
