<!-- Каркас содержимого страницы: вертикальный ритм секций. Заголовок h1 страница
     ставит сама — видимый и ровно один (test/architecture следит). -->
<template>
  <div class="_PageLayout">
    <slot />
  </div>
</template>

<style scoped lang="scss">
._PageLayout {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  padding: var(--gap-48) 0 var(--gap-64);
}
</style>
