/* Пагинация и форма ответа списка — единственные контракты, которые не выводятся
   из zod-схем. Сами сущности объявлены в shared/schemas: тип и проверка одного
   поля не должны разъезжаться по двум файлам. */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: { pagination: Pagination };
}
