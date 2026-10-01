<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { listQuerySchema, type Post } from '#shared/schemas/post';

/* Список целиком живёт в usePagedList: страница и поиск — в адресной строке,
   поэтому ссылка «?q=кеш&page=2» открывает у получателя ту же выборку. */
const { items, pagination, state, pending, error, refresh, setParams, pageLink } =
  await usePagedList<Post>('/posts', { schema: listQuerySchema, fixed: { limit: 3 } });

/* Поле поиска — черновик, адресная строка — источник правды. Ввод уходит в URL
   через 350 мс и через replace: история не копит каждую букву, а десять нажатий
   не превращаются в десять запросов к API. «Назад» возвращает в поле то, что в адресе. */
const search = ref(state.value.q ?? '');
let pushed: string | undefined;

const applySearch = (value: string) => {
  const q = value.trim();
  if (q === (state.value.q ?? '')) return;
  pushed = q;
  return setParams({ q }, { replace: true });
};
const applySearchLater = useDebounceFn(applySearch, 350);

watch(search, applySearchLater);
watch(
  () => state.value.q ?? '',
  (q) => {
    // Своя навигация: в поле уже этот текст или более свежий — ввод не перетираем
    if (q === pushed) return;
    pushed = undefined;
    search.value = q;
  },
);

/* Сброс не стирает введённое молча: ask() возвращает Promise, и код читается как
   обычный вопрос. Диалог рисует единственный <AppConfirmHost> в layout. */
const confirm = useConfirm();

const resetSearch = async () => {
  const accepted = await confirm.ask({
    title: 'Сбросить поиск?',
    text: 'Строка поиска очистится, список покажет все материалы.',
  });
  if (!accepted) return;

  search.value = '';
  await setParams({ q: undefined });
};

useSeoMeta({
  title: 'Статьи',
  description: 'Материалы шаблона: архитектура, стили, данные и зависимости.',
  // Результаты поиска по сайту дублируют сам список — в индекс их не пускаем
  robots: () => (state.value.q ? 'noindex, follow' : undefined),
});

/* У страниц списка свой canonical: вторая страница — это другой контент,
   а не дубль первой. */
const route = useRoute();
useCanonicalLink(() =>
  pagination.value.page > 1 ? `${route.path}?page=${pagination.value.page}` : route.path,
);
</script>

<template>
  <PageLayout>
    <PageSection>
      <div class="content-wrapper _Head">
        <h1 class="caption-32">Статьи</h1>
        <!-- aria-live: скринридер узнаёт, сколько нашлось, не уходя из поля поиска -->
        <p class="text-16 _Muted" aria-live="polite">Всего: {{ pagination.total }}</p>
      </div>
    </PageSection>

    <PageSection>
      <div class="content-wrapper">
        <form role="search" class="_Search" @submit.prevent="applySearch(search)">
          <UiField
            v-model="search"
            class="_SearchField"
            type="search"
            label="Поиск по статьям"
            hide-label
            placeholder="Поиск по заголовку и тексту"
          >
            <template #icon>
              <UiIconSearch />
            </template>
          </UiField>

          <UiButton v-if="state.q" variant="ghost" label="Сбросить" @click="resetSearch" />
        </form>
      </div>
    </PageSection>

    <PageSection>
      <div class="content-wrapper _Results">
        <!-- Ошибка отдельным состоянием: без неё пустой список неотличим от упавшего
             API, и человек решает, что материалов нет. -->
        <p v-if="error" class="text-16 _State _State--error" role="alert">
          Не удалось загрузить список.
          <UiButton variant="ghost" label="Повторить" @click="refresh()" />
        </p>

        <p v-else-if="!items.length" class="text-16 _Muted">
          {{ pending ? 'Загрузка…' : 'Ничего не найдено.' }}
        </p>

        <div v-else class="grid-cards" :aria-busy="pending">
          <UiCardArticle
            v-for="post in items"
            :key="post.id"
            :level="2"
            :title="post.title"
            :lead="post.lead"
            :tags="post.tags"
            :to="`/posts/${post.slug}`"
          />
        </div>

        <UiPagination :page="pagination.page" :total-pages="pagination.totalPages" :to="pageLink" />
      </div>
    </PageSection>
  </PageLayout>
</template>

<style scoped lang="scss">
._Head,
._Results {
  display: flex;
  flex-direction: column;
  gap: var(--gap-12);
}

._Results {
  gap: var(--gap-24);
}

._Muted {
  color: var(--text-secondary);
}

._Search {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-12);
}

._SearchField {
  flex: 1;
  max-width: 420px;
}

._State--error {
  display: flex;
  align-items: center;
  gap: var(--gap-12);
  color: var(--danger);
}

[aria-busy='true'] {
  opacity: 0.6;
}
</style>
