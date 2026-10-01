<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

const props = defineProps<{
  page: number;
  totalPages: number;
  /** Адрес страницы. Пагинация — ссылки, а не кнопки: по ним проходит поисковик,
      их открывают в новой вкладке и копируют. */
  to: (page: number) => RouteLocationRaw;
}>();

const items = computed(() => paginationItems(props.page, props.totalPages));
</script>

<template>
  <nav v-if="totalPages > 1" class="_Pagination" aria-label="Страницы">
    <NuxtLink v-if="page > 1" :to="to(page - 1)" class="_Cell" aria-label="Предыдущая страница">
      <UiIconArrowLeft />
    </NuxtLink>
    <span v-else class="_Cell _Cell--disabled" aria-hidden="true"><UiIconArrowLeft /></span>

    <template v-for="item in items" :key="item.type === 'page' ? item.page : item.side">
      <span v-if="item.type === 'gap'" class="_Gap" aria-hidden="true">…</span>
      <NuxtLink
        v-else
        :to="to(item.page)"
        class="_Cell"
        :class="{ '_Cell--current': item.page === page }"
        :aria-current="item.page === page ? 'page' : undefined"
        :aria-label="`Страница ${item.page}`"
      >
        {{ item.page }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < totalPages"
      :to="to(page + 1)"
      class="_Cell"
      aria-label="Следующая страница"
    >
      <UiIconArrowRight />
    </NuxtLink>
    <span v-else class="_Cell _Cell--disabled" aria-hidden="true"><UiIconArrowRight /></span>
  </nav>
</template>

<style scoped lang="scss">
._Pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gap-8);
}

._Cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--ui-height-40);
  min-height: var(--ui-height-40);
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  color: var(--text-primary);

  @include motion {
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  @include hover {
    border-color: var(--brand-primary);
  }

  &--current {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: var(--brand-contrast);
  }

  &--disabled {
    color: var(--text-muted);
    border-color: var(--line);
  }
}

._Gap {
  color: var(--text-muted);
}
</style>
