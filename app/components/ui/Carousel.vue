<script setup lang="ts" generic="T">
/* Карусель на Swiper — единственное место, где проект знает про Swiper: сменить
   библиотеку значит переписать этот файл, а не страницы. Стили Swiper подключены
   здесь, а не списком css в nuxt.config.ts: они едут только на страницы с каруселью.

   Компоненты берутся из 'swiper/vue' явным импортом: обёртка nuxt-swiper их не
   регистрирует, и на SSR карусель превращалась в комментарий — рассогласование
   гидрации. Модуль A11y озвучивает слайды и прокручивает к слайду с фокусом. */
import { Swiper, SwiperSlide } from 'swiper/vue';
import { A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/a11y';

defineProps<{
  /** Что это за карусель — для скринридера. */
  label: string;
  items: T[];
}>();

defineSlots<{ slide(props: { item: T; index: number }): unknown }>();

const MODULES = [A11y];
const BREAKPOINTS = { 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } };
</script>

<template>
  <Swiper
    class="_Carousel"
    role="region"
    :aria-label="label"
    :modules="MODULES"
    :slides-per-view="1"
    :space-between="16"
    :breakpoints="BREAKPOINTS"
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
