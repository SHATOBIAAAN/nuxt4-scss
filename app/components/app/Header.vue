<script setup lang="ts">
import { CONTACTS, NAV } from '~/config/nav';

const site = useSiteConfig();
const route = useRoute();

/* Раздел подсвечивается и на вложенных страницах: «Статьи» активны и на /posts/slug.
   NuxtLink сам ставит aria-current="page" только на точное совпадение адреса. */
const isCurrentSection = (to: string) =>
  route.path === to || (to !== '/' && route.path.startsWith(`${to}/`));
</script>

<template>
  <header class="_Header">
    <div class="content-wrapper _Row">
      <NuxtLink class="_Logo" to="/">{{ site.name }}</NuxtLink>

      <nav class="_Nav" aria-label="Основная навигация">
        <NuxtLink
          v-for="link in NAV"
          :key="link.to"
          :to="link.to"
          class="_Link"
          :class="{ '_Link--active': isCurrentSection(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <a class="_Phone only-desktop" :href="CONTACTS.phoneHref">{{ CONTACTS.phone }}</a>

      <AppNavDrawer />
    </div>
  </header>
</template>

<style scoped lang="scss">
._Header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--header-bg);
  border-bottom: 1px solid var(--line);
}

._Row {
  display: flex;
  align-items: center;
  gap: var(--gap-24);
  min-height: var(--header-height);
}

._Logo {
  margin-right: auto;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

._Nav {
  display: flex;
  gap: var(--gap-20);

  /* На узком экране ссылки уходят в панель меню. display: none, а не скрытие
     визуально: иначе скринридер прочитал бы навигацию дважды. */
  @include media-down(lg) {
    display: none;
  }
}

._Link {
  font-size: 15px;
  color: var(--text-secondary);

  @include motion {
    transition: color 0.15s ease;
  }

  @include hover {
    color: var(--brand-primary);
  }

  &--active {
    color: var(--brand-primary);
  }
}

._Phone {
  font-size: 15px;
  font-weight: 600;
}
</style>
