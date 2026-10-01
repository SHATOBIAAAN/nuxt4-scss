<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    lead: string;
    to: string;
    tags?: string[];
    /** Уровень заголовка в структуре страницы: h2 прямо под h1, h3 — внутри секции с h2. */
    level?: 2 | 3;
  }>(),
  { tags: () => [], level: 3 },
);
</script>

<template>
  <article class="_Card card-surface radius-lg">
    <ul v-if="tags.length" class="_Tags" aria-label="Теги">
      <li v-for="tag in tags" :key="tag" class="_Tag">{{ tag }}</li>
    </ul>

    <component :is="`h${level}`" class="caption-24">
      <!-- Единственная ссылка карточки: её ::after растянут на всю карточку, поэтому
           кликабельна вся площадь, а в порядке Tab и у скринридера — одна ссылка. -->
      <NuxtLink :to="to" class="_Link">{{ title }}</NuxtLink>
    </component>

    <p class="text-16 _Lead">{{ lead }}</p>

    <span class="_More" aria-hidden="true">
      Читать
      <UiIconArrowRight :size="15" />
    </span>
  </article>
</template>

<style scoped lang="scss">
._Card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--gap-12);
  padding: var(--gap-24);

  &:has(._Link:focus-visible) {
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
  }

  @include hover {
    ._Link,
    ._More {
      color: var(--brand-primary);
    }
  }
}

._Tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-8);
}

._Tag {
  padding: 2px var(--gap-8);
  border-radius: var(--radius-xs);
  background: var(--brand-accent);
  font-size: 12px;
  color: var(--brand-primary-dark);
}

._Link {
  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  // Кольцо фокуса рисует карточка целиком — см. :has выше
  &:focus-visible {
    outline: none;
  }
}

._Lead {
  color: var(--text-secondary);
}

._More {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-8);
  margin-top: auto;
  font-size: 15px;
  font-weight: 600;
  color: var(--brand-primary);
}
</style>
