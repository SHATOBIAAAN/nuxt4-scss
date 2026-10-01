<script setup lang="ts">
/* Обёртка всех иконок. Иконка — компонент с единственным корнем <UiIconBase>,
   поэтому `<UiIconMenu :size="20" class="x" />` доходит до <svg> без ручного
   v-bind="$attrs": Vue переносит атрибуты на корень сам, а size здесь — проп. */
withDefaults(
  defineProps<{
    size?: number | string;
    viewBox?: string;
    /** false — если иконка несёт смысл и её нужно озвучить скринридеру. */
    decorative?: boolean;
  }>(),
  { size: 16, viewBox: '0 0 16 16', decorative: true },
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :aria-hidden="decorative ? 'true' : undefined"
    :role="decorative ? undefined : 'img'"
    focusable="false"
  >
    <slot />
  </svg>
</template>

<style scoped lang="scss">
svg {
  display: block;
  flex-shrink: 0;
}
</style>
