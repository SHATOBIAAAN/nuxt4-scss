import type { RouterConfig } from 'nuxt/schema';
import { START_LOCATION, type RouteLocationNormalized } from 'vue-router';

/* Куда прокручивать при переходах. Порядок — как у прокрутки Nuxt по умолчанию, но на другую
   страницу — мгновенно, а плавно — только якорь на той же странице (у html scroll-behavior нет,
   layout.scss):
   - новая страница — сразу с самого верха. Плавное «наверх» с места прежней страницы останавливала
     сама новая страница — она в это время пересчитывает места анимаций (ScrollTrigger), — и
     открывалась она там же, где был человек на прежней;
   - «Назад» и «Вперёд» — на сохранённое место, тоже сразу, как в браузере;
   - якорь на другой странице (/#contacts) — к нему сразу, без пролёта от верха страницы; при первой
     загрузке — когда загрузятся шрифты: до них текст набран запасным шрифтом другой высоты;
   - якорь на той же странице — плавно, если человек не просил уменьшить движение; смена только
     query (?page=2) прокрутку не трогает.
   Прокрутка — когда новая страница уже на экране (page:loading:end), иначе прежняя страница
   прыгнула бы наверх раньше смены */
const marginTop = (selector: string) => {
  try {
    const element = document.querySelector(selector);
    if (!element) return 0;
    const own = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    const page = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return own + (page || 0);
  } catch {
    // Якорь — не CSS-селектор (#1-раздел): места нет, прокрутка — к элементу по id
    return 0;
  }
};

const samePage = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '');

export default {
  scrollBehavior(to, from, savedPosition) {
    if (samePage(to, from) && from !== START_LOCATION) {
      if (to.hash) {
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return { el: to.hash, top: marginTop(to.hash), behavior: still ? 'instant' : 'smooth' };
      }
      if (from.hash) return savedPosition ?? { left: 0, top: 0 };
      return false;
    }

    const scrollToTop =
      typeof to.meta.scrollToTop === 'function'
        ? to.meta.scrollToTop(to, from)
        : to.meta.scrollToTop;
    if (scrollToTop === false) return false;

    const position = () => {
      if (savedPosition) return { ...savedPosition, behavior: 'instant' as const };
      if (to.hash) return { el: to.hash, top: marginTop(to.hash), behavior: 'instant' as const };
      return { left: 0, top: 0, behavior: 'instant' as const };
    };

    /* Первая загрузка: страница уже на экране. К якорю — когда загрузились шрифты: после замены
       запасного шрифта блок уехал бы от верха */
    if (from === START_LOCATION) {
      return to.hash && !savedPosition ? document.fonts.ready.then(position) : position();
    }

    const nuxtApp = useNuxtApp();
    const router = useRouter();
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        requestAnimationFrame(() => {
          // Пока грузилась страница, человек ушёл дальше — эту прокрутку отменить
          resolve(router.currentRoute.value.fullPath === to.fullPath ? position() : false);
        });
      });
    });
  },
} satisfies RouterConfig;
