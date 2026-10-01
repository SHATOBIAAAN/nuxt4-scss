<script setup lang="ts">
import type { NuxtError } from '#app';

/* error.vue рендерится вне app.vue и вне layout. Отсюда два следствия:
   1. глобальные стили подключены списком `css` в nuxt.config.ts, а не импортом
      в app.vue — иначе 404 приезжала бы без стилей;
   2. шапки здесь нет, поэтому выход со страницы — кнопка «На главную». Переход по
      ссылке сам сбрасывает ошибку (роутер Nuxt вызывает clearError). */
const props = defineProps<{ error: NuxtError }>();

const site = useSiteConfig();
const router = useRouter();

const status = computed(() => props.error.status ?? 500);
const isNotFound = computed(() => status.value === 404);

/* Не computed с проверкой window: на SSR истории нет, и первый клиентский рендер
   разошёлся бы с серверным. Кнопка «Назад» появляется после монтирования. */
const canGoBack = ref(false);
onMounted(() => {
  canGoBack.value = window.history.length > 1;
});

const title = computed(() => (isNotFound.value ? 'Страница не найдена' : 'Что-то пошло не так'));
const text = computed(() =>
  isNotFound.value
    ? 'Возможно, страницу удалили или перенесли, либо в адресе опечатка.'
    : 'Попробуйте обновить страницу или вернуться на главную.',
);

useSeoMeta({
  title: () => `${title.value} — ${site.name}`,
  // битая страница не должна попадать в индекс
  robots: 'noindex',
});
</script>

<template>
  <main class="_Error">
    <div class="content-wrapper _Inner">
      <p class="_Code">{{ status }}</p>
      <h1 class="caption-32">{{ title }}</h1>
      <p class="text-16 _Text">{{ text }}</p>

      <div class="_Actions">
        <UiButton to="/" label="На главную" />
        <UiButton v-if="canGoBack" variant="secondary" label="Назад" @click="router.back()" />
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
._Error {
  display: flex;
  align-items: center;
  min-height: 100dvh;
  padding: var(--gap-48) 0;
}

._Inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--gap-16);
  max-width: 560px;
}

._Code {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  color: var(--brand-primary);
}

._Text {
  color: var(--text-secondary);
}

._Actions {
  display: flex;
  gap: var(--gap-12);
  margin-top: var(--gap-8);
}
</style>
