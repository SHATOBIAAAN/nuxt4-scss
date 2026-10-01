export type PaginationItem =
  | { type: 'page'; page: number }
  | { type: 'gap'; side: 'start' | 'end' };

const page = (value: number): PaginationItem => ({ type: 'page', page: value });

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/** Номера для навигатора страниц: первая, последняя, текущая с соседями и
    многоточия между ними. Длина ряда постоянна (5 + 2 × siblings), поэтому
    навигатор не прыгает по ширине: у краёв окно соседей сдвигается внутрь.
    Многоточие никогда не прячет ровно одну страницу — на её месте стоит номер. */
export function paginationItems(current: number, total: number, siblings = 1): PaginationItem[] {
  const count = Math.max(total, 1);
  if (count <= 5 + siblings * 2) return range(1, count).map(page);

  const active = Math.min(Math.max(current, 1), count);
  const start = Math.min(Math.max(active - siblings, 3), count - 2 - siblings * 2);
  const end = start + siblings * 2;

  return [
    page(1),
    start > 3 ? { type: 'gap', side: 'start' } : page(2),
    ...range(start, end).map(page),
    end < count - 2 ? { type: 'gap', side: 'end' } : page(count - 1),
    page(count),
  ];
}
