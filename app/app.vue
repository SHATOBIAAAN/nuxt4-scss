<script setup lang="ts">
/* Каркас приложения: то, что существует в одном экземпляре и переживает смену
   страницы, — индикатор загрузки, объявление маршрута для скринридера и мета-теги
   по умолчанию. Общие блоки страниц (шапка, футер) — в app/layouts. */
const site = useSiteConfig();
const route = useRoute();

useHead({
  titleTemplate: (title) => (title ? `${title} — ${site.name}` : site.name),
});

useSeoMeta({
  description: site.description,
  ogSiteName: site.name,
  ogType: 'website',
  ogLocale: 'ru_RU',
  twitterCard: 'summary',
});

useCanonicalLink(() => route.path);
</script>

<template>
  <div class="page-container">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="var(--brand-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
