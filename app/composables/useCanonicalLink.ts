import type { MaybeRefOrGetter } from 'vue';

/* <link rel="canonical"> и og:url — абсолютный адрес на домене из site config
   (NUXT_PUBLIC_SITE_URL), а не из заголовка Host. app.vue ставит адрес страницы
   без query; список перекрывает его своим — с номером страницы. */
export function useCanonicalLink(path: MaybeRefOrGetter<string>) {
  const href = withSiteUrl(computed(() => toValue(path)));

  useHead({ link: [{ rel: 'canonical', href }] });
  useSeoMeta({ ogUrl: href });
}
