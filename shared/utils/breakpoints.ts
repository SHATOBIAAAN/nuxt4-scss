/* Брейкпоинты — единственное место с их числами. nuxt.config.ts передаёт карту в
   _tools.scss (миксины media-up / media-down), JS-код (Swiper, matchMedia) импортирует
   её отсюда. Смысл у всех потребителей один, как у min-width: «md» — экран от 768px
   и шире, всё уже — «меньше md». Поэтому ключи можно отдавать Swiper как есть. */
export const BREAKPOINTS = {
  xs: 375,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;
