import { defineStore } from 'pinia';

/* Подтверждение через Promise: код страницы читается как обычный вопрос —
     if (!(await useConfirm().ask({ title: 'Удалить файл?' }))) return;
   а диалог рисует единственный <AppConfirmHost> в layout. */

export interface ConfirmOptions {
  title?: string;
  text?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const DEFAULTS: Required<ConfirmOptions> = {
  title: 'Подтвердить действие?',
  text: '',
  confirmLabel: 'Да',
  cancelLabel: 'Отмена',
};

export const useConfirm = defineStore('confirm', () => {
  const isOpen = ref(false);
  const options = ref<Required<ConfirmOptions>>({ ...DEFAULTS });

  /* Разрешитель промиса — функция, а не данные: в state его не кладём, потому что
     state уезжает в payload SSR. Замыкание живёт в экземпляре стора, а стор свой
     у каждого запроса, так что между пользователями на сервере ничего не течёт. */
  let settle: ((accepted: boolean) => void) | undefined;

  const ask = (payload: ConfirmOptions = {}): Promise<boolean> => {
    // Прежний вопрос без ответа считаем отказом: иначе его await не завершится никогда
    settle?.(false);
    options.value = { ...DEFAULTS, ...payload };
    isOpen.value = true;

    return new Promise((resolve) => {
      settle = resolve;
    });
  };

  const answer = (accepted: boolean) => {
    settle?.(accepted);
    settle = undefined;
    isOpen.value = false;
  };

  return { isOpen, options, ask, answer };
});
