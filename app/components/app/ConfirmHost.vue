<script setup lang="ts">
/* Висит один раз в layout. Промис из useConfirm().ask() разрешается только здесь:
   «Да», «Отмена» или Escape. AlertDialog, а не Dialog: роль alertdialog, фокус
   на безопасном действии, а клик мимо окна вопрос не закрывает. */
const confirm = useConfirm();

const onOpenChange = (open: boolean) => {
  if (!open) confirm.answer(false);
};
</script>

<template>
  <AlertDialogRoot :open="confirm.isOpen" @update:open="onOpenChange">
    <!-- ClientOnly: портал на SSR рендерится в пустоту — см. тот же паттерн в NavDrawer -->
    <ClientOnly>
      <AlertDialogPortal>
        <AlertDialogOverlay class="_Overlay" />

        <AlertDialogContent class="_Dialog">
          <AlertDialogTitle class="_Title">{{ confirm.options.title }}</AlertDialogTitle>

          <!-- Описание рендерится всегда: без него reka-ui предупреждает о неполном
               диалоге. Пустой текст уходит только из визуала. -->
          <AlertDialogDescription
            class="_Text"
            :class="{ 'visually-hidden': !confirm.options.text }"
          >
            {{ confirm.options.text }}
          </AlertDialogDescription>

          <div class="_Actions">
            <UiButton
              variant="secondary"
              :label="confirm.options.cancelLabel"
              @click="confirm.answer(false)"
            />
            <UiButton :label="confirm.options.confirmLabel" @click="confirm.answer(true)" />
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </ClientOnly>
  </AlertDialogRoot>
</template>

<style scoped lang="scss">
._Overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  background: var(--overlay);
}

._Dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: var(--z-dialog);
  display: flex;
  flex-direction: column;
  gap: var(--gap-16);
  width: min(420px, calc(100vw - var(--gap-40)));
  padding: var(--gap-24);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-dialog);
  transform: translate(-50%, -50%);
}

._Title {
  font-size: 20px;
  font-weight: 700;
}

._Text {
  font-size: 15px;
  color: var(--text-secondary);
}

._Actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-12);
}
</style>
