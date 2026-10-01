<script setup lang="ts">
import { CONTACTS, NAV } from '~/config/nav';

/* Диалог reka-ui, а не самописная шторка: ловушка фокуса, закрытие по Escape,
   блокировка прокрутки, aria-модальность и возврат фокуса на кнопку-триггер.
   Открыто ли меню — в сторе overlay: открыть его можно и не только этой кнопкой. */
const overlay = useOverlay();
const route = useRoute();

// Любой переход закрывает панель: ссылки внутри неё ведут себя как обычные
watch(() => route.fullPath, overlay.close);
</script>

<template>
  <DialogRoot v-model:open="overlay.isOpen">
    <DialogTrigger class="_Toggle" aria-label="Открыть меню">
      <UiIconMenu :size="20" />
    </DialogTrigger>

    <!-- ClientOnly обязателен: портал на SSR рендерится в пустоту, клиент не находит
         серверный DOM и сообщает «Hydration completed but contains mismatches». -->
    <ClientOnly>
      <DialogPortal>
        <DialogOverlay class="_Overlay" />

        <DialogContent class="_Panel">
          <div class="content-wrapper _Inner">
            <div class="_Top">
              <DialogTitle class="_Title">Меню</DialogTitle>

              <DialogClose class="_Close" aria-label="Закрыть меню">
                <UiIconClose :size="20" />
              </DialogClose>
            </div>

            <!-- Описание обязательно: без него reka-ui предупреждает о неполном диалоге -->
            <DialogDescription class="visually-hidden">Разделы сайта и контакты</DialogDescription>

            <nav class="_Nav" aria-label="Разделы">
              <NuxtLink v-for="link in NAV" :key="link.to" :to="link.to" class="_Link">
                {{ link.label }}
              </NuxtLink>
            </nav>

            <div class="_Contacts">
              <a :href="CONTACTS.phoneHref" class="_Link">{{ CONTACTS.phone }}</a>
              <a :href="`mailto:${CONTACTS.email}`" class="_Link">{{ CONTACTS.email }}</a>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </ClientOnly>
  </DialogRoot>
</template>

<style scoped lang="scss">
._Toggle {
  display: none;
  color: var(--text-primary);

  @include media-down(lg) {
    display: inline-flex;
  }
}

._Overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background: var(--overlay);
}

._Panel {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--surface);
}

._Inner {
  display: flex;
  flex-direction: column;
  gap: var(--gap-32);
  min-height: 100%;
  padding-top: var(--gap-20);
  padding-bottom: var(--gap-48);
}

._Top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

._Title {
  font-size: 20px;
  font-weight: 700;
}

._Close {
  display: inline-flex;
  color: var(--text-secondary);

  @include hover {
    color: var(--brand-primary);
  }
}

._Nav,
._Contacts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--gap-12);
}

._Contacts {
  padding-top: var(--gap-24);
  border-top: 1px solid var(--line);
}

._Link {
  font-size: 17px;
  color: var(--text-primary);

  @include hover {
    color: var(--brand-primary);
  }
}
</style>
