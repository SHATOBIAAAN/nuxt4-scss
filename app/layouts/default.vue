<template>
  <div class="_Layout">
    <!-- Первый элемент в порядке Tab: с клавиатуры не нужно проходить всю шапку -->
    <a href="#main" class="_Skip">Перейти к содержимому</a>

    <AppHeader />

    <main id="main" class="_Main" tabindex="-1">
      <slot />
    </main>

    <AppFooter />

    <!-- Один диалог подтверждения на весь сайт: страницы вызывают useConfirm().ask()
         и не занимаются модалками сами. -->
    <AppConfirmHost />
  </div>
</template>

<style scoped lang="scss">
._Layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

._Skip {
  position: absolute;
  top: var(--gap-8);
  left: var(--gap-8);
  z-index: var(--z-dialog);
  padding: var(--gap-8) var(--gap-16);
  border-radius: var(--radius-xs);
  background: var(--brand-primary);
  color: var(--brand-contrast);
  transform: translateY(-200%);

  &:focus-visible {
    transform: none;
  }
}

._Main {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;

  &:focus {
    outline: none;
  }
}
</style>
