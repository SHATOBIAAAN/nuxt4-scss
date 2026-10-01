<script setup lang="ts">
import type { Post } from '#shared/schemas/post';

const route = useRoute();
const slug = String(route.params.slug);

const { data: post, error } = await useApiFetch<Post>(`/posts/${encodeURIComponent(slug)}`);

/* 404 — только когда API ответил 404. Упавший бэкенд должен остаться ошибкой 5xx:
   на 404 поисковик выкидывает живую статью из индекса на время аварии. */
if (!post.value) {
  const status = error.value?.status ?? 500;
  throw createError({
    status,
    message: status === 404 ? 'Пост не найден' : 'Не удалось загрузить пост',
    fatal: true,
  });
}

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.lead,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.lead,
  ogType: 'article',
  articlePublishedTime: () => post.value?.publishedAt,
});
</script>

<template>
  <PageLayout v-if="post">
    <PageSection>
      <div class="content-wrapper _Head">
        <nav aria-label="Хлебные крошки">
          <ol class="_Crumbs">
            <li class="_Crumb">
              <NuxtLink to="/posts" class="_CrumbLink">Статьи</NuxtLink>
              <UiIconArrowRight :size="14" />
            </li>
            <li class="_Crumb _Crumb--current" aria-current="page">{{ post.title }}</li>
          </ol>
        </nav>

        <h1 class="caption-32">{{ post.title }}</h1>

        <!-- NuxtTime, а не Intl.DateTimeFormat в шаблоне: сервер форматирует в своём часовом
             поясе, браузер — в своём, и около полуночи тексты расходятся при гидрации. -->
        <p class="text-16 _Meta">
          <NuxtTime
            :datetime="post.publishedAt"
            locale="ru-RU"
            day="numeric"
            month="long"
            year="numeric"
          />
        </p>

        <p class="text-18 _Lead">{{ post.lead }}</p>
      </div>
    </PageSection>

    <PageSection>
      <div class="content-wrapper">
        <!-- Разметка из админки: единственный v-html в проекте, граница доверия
             описана внутри компонента. -->
        <UiContentHtml class="_Body" :html="post.body" />
      </div>
    </PageSection>
  </PageLayout>
</template>

<style scoped lang="scss">
._Head {
  display: flex;
  flex-direction: column;
  gap: var(--gap-16);
}

._Head,
._Body {
  max-width: 760px;
}

._Crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-8);
  font-size: 14px;
  color: var(--text-muted);
}

._Crumb {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-8);

  &--current {
    color: var(--text-primary);
  }
}

._CrumbLink {
  color: inherit;

  @include hover {
    color: var(--brand-primary);
  }
}

._Meta {
  color: var(--text-muted);
}

._Lead {
  color: var(--text-secondary);
}

._Body {
  font-size: 18px;
}
</style>
