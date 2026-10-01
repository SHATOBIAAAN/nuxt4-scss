import { defineStore } from 'pinia';

/* Состояние выезжающей панели меню. Стор, а не локальный ref в компоненте: открыть
   меню можно из любого места (кнопка в контенте, шорткат), а переход по ссылке его
   закрывает. Блокировку прокрутки, ловушку фокуса и возврат фокуса на триггер
   делает сам DialogRoot из reka-ui — вручную их здесь не дублируем. */
export const useOverlay = defineStore('overlay', () => {
  const isOpen = ref(false);

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  return { isOpen, open, close };
});
