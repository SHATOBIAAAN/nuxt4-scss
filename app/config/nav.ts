/* Единственный источник навигации и контактов — первый файл, который меняют в новом
   проекте. Каждая ссылка обязана вести на существующую страницу: это проверяет
   test/architecture, а не ручной обход меню. */

export interface NavLink {
  label: string;
  to: string;
}

export const NAV: NavLink[] = [
  { label: 'Главная', to: '/' },
  { label: 'Статьи', to: '/posts' },
];

const phone = '+7 000 000-00-00';

export const CONTACTS = {
  phone,
  phoneHref: `tel:${phone.replace(/[^+\d]/g, '')}`,
  email: 'hello@example.com',
} as const;
