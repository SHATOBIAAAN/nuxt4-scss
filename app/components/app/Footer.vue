<script setup lang="ts">
import { CONTACTS, NAV } from '~/config/nav';

const site = useSiteConfig();

/* Год считает сервер, клиент берёт его из payload. Просто `new Date()` в setup
   выполнился бы дважды — на сервере и в браузере, — и в новогоднюю ночь часовые
   пояса дали бы два разных текста и рассогласование гидрации. */
const year = useState('footer:year', () => new Date().getFullYear());
</script>

<template>
  <footer class="_Footer">
    <div class="content-wrapper _Inner">
      <nav class="_Nav" aria-label="Дополнительная навигация">
        <NuxtLink v-for="link in NAV" :key="link.to" :to="link.to" class="_Link">
          {{ link.label }}
        </NuxtLink>
      </nav>

      <address class="_Contacts">
        <a :href="CONTACTS.phoneHref" class="_Link">{{ CONTACTS.phone }}</a>
        <a :href="`mailto:${CONTACTS.email}`" class="_Link">{{ CONTACTS.email }}</a>
      </address>

      <p class="_Copyright">© {{ year }} {{ site.name }}</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
._Footer {
  padding: var(--gap-40) 0;
  border-top: 1px solid var(--line);
  background: var(--surface-muted);
}

._Inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--gap-24);
}

._Nav,
._Contacts {
  display: flex;
  flex-direction: column;
  gap: var(--gap-8);
}

._Contacts {
  font-style: normal;
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
}

._Copyright {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
