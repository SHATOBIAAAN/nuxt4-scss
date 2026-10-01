<script setup lang="ts">
/* Главная — витрина каркаса: заголовок с навигацией, карусель и последние
   материалы — три блока, которые повторяются почти на каждой странице проекта. */
import { NAV } from '~/config/nav';
import type { Post } from '#shared/schemas/post';
import type { ListResponse } from '#shared/types/content';

const { data } = await useApiFetch<ListResponse<Post>>('/posts', { query: { limit: 3 } });
const posts = computed(() => data.value?.data ?? []);

const SLIDES = [1, 2, 3, 4, 5, 6];

const cards = useTemplateRef('cards');
useReveal(cards);
</script>

<template>
  <PageLayout>
    <PageSection>
      <div class="content-wrapper _Hero">
        <h1 class="caption-48">
          Чистый каркас Nuxt 4:<br />
          токены, слои и BFF-граница
        </h1>
        <p class="text-18 _Lead">
          Шаблон без предметной логики: навигация в <code>app/config/nav.ts</code>, данные в
          <code>server/mock</code>, всё остальное пишется под проект.
        </p>

        <div class="_Actions">
          <UiButton
            v-for="link in NAV"
            :key="link.to"
            :to="link.to"
            :label="link.label"
            variant="secondary"
          />
        </div>
      </div>
    </PageSection>

    <PageSection>
      <div class="content-wrapper">
        <UiCarousel label="Демо-карусель" :items="SLIDES">
          <template #slide="{ item }">
            <div class="_Slide radius-md">Слайд {{ item }}</div>
          </template>
        </UiCarousel>
      </div>
    </PageSection>

    <PageSection>
      <div class="content-wrapper _Latest">
        <h2 class="caption-24">Последние материалы</h2>

        <div ref="cards" class="grid-cards">
          <UiCardArticle
            v-for="post in posts"
            :key="post.id"
            data-reveal
            :title="post.title"
            :lead="post.lead"
            :tags="post.tags"
            :to="`/posts/${post.slug}`"
          />
        </div>
      </div>
    </PageSection>
  </PageLayout>
</template>

<style scoped lang="scss">
._Hero {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
}

._Hero > * {
  max-width: 720px;
}

._Lead {
  color: var(--text-secondary);
}

._Actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-12);
}

._Latest {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
}

._Slide {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  background: var(--brand-accent);
  color: var(--brand-primary-dark);
  font-weight: 600;
}
</style>
