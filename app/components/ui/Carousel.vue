<script setup lang="ts" generic="T">
/* Карусель на Swiper — единственное место, где проект знает про Swiper: сменить
   библиотеку значит переписать этот файл, а не страницы. Стили Swiper подключены
   здесь, а не списком css в nuxt.config.ts: они едут только на страницы с каруселью.

   Компоненты берутся из 'swiper/vue' явным импортом: обёртка nuxt-swiper их не
   регистрирует, и на SSR карусель превращалась в комментарий — рассогласование
   гидрации. Модуль A11y озвучивает слайды и прокручивает к слайду с фокусом. */
import { Swiper, SwiperSlide } from 'swiper/vue';
import { A11y } from 'swiper/modules';
import { BREAKPOINTS } from '#shared/utils/breakpoints';
import 'swiper/css';
import 'swiper/css/a11y';

defineProps<{
  /** Что это за карусель — для скринридера. */
  label: string;
  items: T[];
}>();

defineSlots<{ slide(props: { item: T; index: number }): unknown }>();

const MODULES = [A11y];
// Swiper сравнивает ширину окна как min-width — так же, как media-up в стилях
const SLIDES_BY_WIDTH = {
  [BREAKPOINTS.md]: { slidesPerView: 2 },
  [BREAKPOINTS.xl]: { slidesPerView: 3 },
};
</script>

<template>
  <Swiper
    class="_Carousel"
    role="region"
    :aria-label="label"
    :modules="MODULES"
    :slides-per-view="1"
    :space-between="16"
    :breakpoints="SLIDES_BY_WIDTH"
    loop
  >
    <SwiperSlide v-for="(item, index) in items" :key="index">
      <slot name="slide" :item="item" :index="index" />
    </SwiperSlide>
  </Swiper>
</template>

<style scoped lang="scss">
._Carousel {
  width: 100%;
  overflow: hidden;
}
</style>
