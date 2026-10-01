<script setup lang="ts">
/* Единственное место в шаблоне, где чужой HTML попадает в DOM (test/architecture
   не пропустит v-html в другом файле).

   Граница доверия: сюда кладётся разметка только из своей админки — тексты страниц,
   статей, правовых разделов. Пользовательский ввод (комментарии, заявки, UGC) сюда
   не попадает никогда: для него нужен санитайзер, и это отдельное решение.

   Вторая линия защиты — Content-Security-Policy на nonce (server/plugins/csp.ts):
   внедрённый <script> и inline-обработчик не получают nonce и не выполняются, так
   что инъекция остаётся испорченной вёрсткой, а не угоном сессии. */
defineProps<{ html?: string }>();
</script>

<template>
  <div class="_ContentHtml" v-html="html"></div>
</template>

<style scoped lang="scss">
/* Узлы из v-html не получают scoped-атрибут, поэтому селекторы внутри — через :deep. */
._ContentHtml {
  display: grid;
  gap: var(--gap-16);
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-secondary);

  :deep(:is(h2, h3, h4)) {
    margin-top: var(--gap-24);
    color: var(--text-primary);
    line-height: 1.2;
  }

  :deep(h2) {
    font-size: 24px;
  }

  :deep(h3) {
    font-size: 20px;
  }

  :deep(:is(ul, ol)) {
    display: grid;
    gap: var(--gap-8);
    padding-left: 22px;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(a) {
    color: var(--brand-primary);
    text-decoration: underline;
  }

  :deep(img) {
    border-radius: var(--radius-md);
  }
}
</style>
