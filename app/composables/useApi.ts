/* Клиент API шаблона. createUseFetch (Nuxt 4.2+) — официальная фабрика своего
   useFetch: автоключи по месту вызова и типы опций остаются такими же, как у
   useFetch. Адрес берётся из runtimeConfig при каждом вызове, поэтому
   NUXT_PUBLIC_API_PREFIX переключает API у запущенного сервера без пересборки.

   Вне компонентов (обработчики событий, middleware) — обычный $fetch с тем же адресом:
     $fetch(path, { baseURL: useRuntimeConfig().public.apiPrefix }) */
export const useApiFetch = createUseFetch((options) => ({
  baseURL: options.baseURL ?? useRuntimeConfig().public.apiPrefix,
}));
