import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { UiButton, UiPagination } from '#components';

/* Компоненты в окружении Nuxt: автоимпорты, NuxtLink и роутер работают как в
   приложении. Проверяются правила разметки, которые не видит ни линтер, ни typecheck. */

describe('UiButton', () => {
  it('с `to` рендерит настоящую ссылку с href, а не неизвестный тег', async () => {
    const wrapper = await mountSuspended(UiButton, { props: { to: '/posts', label: 'Статьи' } });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/posts');
  });

  it('без `to` — кнопка, которая не отправляет форму случайно', async () => {
    const wrapper = await mountSuspended(UiButton, { props: { label: 'Повторить' } });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('недоступная ссылка становится выключенной кнопкой, а не кликабельной ссылкой', async () => {
    const wrapper = await mountSuspended(UiButton, {
      props: { to: '/posts', label: 'Статьи', disabled: true },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});

const mountPage = (page: number, totalPages: number) =>
  mountSuspended(UiPagination, {
    props: { page, totalPages, to: (target: number) => ({ query: { page: target } }) },
  });

describe('UiPagination', () => {
  it('каждая страница — ссылка с href и доступным именем', async () => {
    const wrapper = await mountPage(2, 12);
    const links = wrapper.findAll('a');

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.attributes('href')).toMatch(/page=\d+/);
      expect(link.attributes('aria-label')).toBeTruthy();
    }
  });

  it('текущая страница помечена aria-current', async () => {
    const wrapper = await mountPage(3, 12);

    expect(wrapper.find('[aria-current="page"]').text()).toBe('3');
  });

  it('одна страница — навигатор не рендерится', async () => {
    const wrapper = await mountPage(1, 1);

    expect(wrapper.find('nav').exists()).toBe(false);
  });
});
