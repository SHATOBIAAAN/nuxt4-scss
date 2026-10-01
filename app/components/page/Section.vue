<template>
  <section class="_Section">
    <slot />
  </section>
</template>

<style scoped lang="scss">
._Section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-24);
}
</style>
