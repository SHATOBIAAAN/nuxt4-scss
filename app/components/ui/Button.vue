<script setup lang="ts">
/* Одна кнопка на две роли: ссылка (`to`) и <button>. Внешние адреса NuxtLink
   распознаёт сам, отдельный `href` не нужен.

   NuxtLink не зарегистрирован глобально: строка 'NuxtLink' в <component :is>
   молча рендерится неизвестным тегом <nuxtlink> без href — ни ошибки, ни
   предупреждения в консоли. resolveComponent Nuxt превращает в прямой импорт. */
const props = withDefaults(
  defineProps<{
    label?: string;
    to?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    type?: 'button' | 'submit';
    disabled?: boolean;
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
);

const NuxtLink = resolveComponent('NuxtLink');

/* У ссылки нет атрибута disabled, поэтому недоступная «ссылка» становится
   <button disabled>: она честно не работает, а не только выглядит выключенной. */
const isLink = computed(() => Boolean(props.to) && !props.disabled);
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    class="_Button"
    :class="`_Button--${variant}`"
    v-bind="isLink ? { to } : { type, disabled }"
  >
    <slot>{{ label }}</slot>
  </component>
</template>

<style scoped lang="scss">
._Button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-8);
  min-height: var(--ui-height-44);
  padding: 0 var(--gap-20);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;

  @include motion {
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  &--primary {
    background: var(--brand-primary);
    color: var(--brand-contrast);

    @include hover {
      background: var(--brand-primary-dark);
    }
  }

  &--secondary {
    background: var(--surface);
    border-color: var(--line);
    color: var(--text-primary);

    @include hover {
      border-color: var(--brand-primary);
      color: var(--brand-primary);
    }
  }

  &--ghost {
    background: none;
    color: var(--brand-primary);

    @include hover {
      text-decoration: underline;
    }
  }

  &:disabled {
    background: var(--surface-muted);
    border-color: var(--line);
    color: var(--text-muted);
    cursor: not-allowed;
  }
}
</style>
