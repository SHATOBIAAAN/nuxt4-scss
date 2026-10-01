import type { ListResponse } from '#shared/types/content';

/* Помощники ручек: из server/utils Nitro подключает их в хендлеры без импорта. */

const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е');

/** Поиск по подстроке без индексов — для моков и небольших коллекций. Регистр и
    «ё/е» не различаются. С настоящим бэкендом её заменяет параметр поиска API. */
export const matchesSearch = (haystack: string[], needle?: string) => {
  if (!needle) return true;
  const query = normalize(needle);
  return haystack.some((part) => normalize(part).includes(query));
};

/** Срез и честная пагинация. totalPages считается от полного совпадения, а номер
    за пределами списка прижимается к последней странице: пустого списка человек
    не видит, а страница приводит адрес к выданному номеру (usePagedList). */
export const paginate = <T>(items: T[], page: number, limit: number): ListResponse<T> => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, totalPages);

  return {
    data: items.slice((current - 1) * limit, current * limit),
    meta: { pagination: { page: current, limit, total, totalPages } },
  };
};
