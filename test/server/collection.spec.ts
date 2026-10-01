import { describe, expect, it } from 'vitest';
import { matchesSearch, paginate } from '../../server/utils/collection';

/* Проверяются правила, а не конкретные данные: «записей ровно пять» — плохой
   тест, завтра добавят шестую, и он покраснеет без причины. «Сумма страниц
   равна total» — хороший: это обязано выполняться всегда. */

const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: index }));

describe('paginate', () => {
  it('сумма всех страниц равна общему количеству', () => {
    for (const total of [0, 1, 5, 9, 10, 23]) {
      const { totalPages, limit } = paginate(rows(total), 1, 3).meta.pagination;

      let collected = 0;
      for (let page = 1; page <= totalPages; page += 1) {
        collected += paginate(rows(total), page, limit).data.length;
      }

      expect(collected).toBe(total);
    }
  });

  it('страница вне диапазона отдаёт последнюю, а не пустой список', () => {
    const result = paginate(rows(7), 99, 3);

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta.pagination.page).toBe(result.meta.pagination.totalPages);
  });

  it('пустая коллекция даёт одну страницу, а не ноль', () => {
    const result = paginate([], 1, 10);

    expect(result.data).toEqual([]);
    expect(result.meta.pagination.totalPages).toBe(1);
  });
});

describe('matchesSearch', () => {
  it('пустая строка поиска не отсеивает ничего', () => {
    expect(matchesSearch(['что угодно'], undefined)).toBe(true);
    expect(matchesSearch(['что угодно'], '')).toBe(true);
  });

  it('регистр не влияет на результат', () => {
    expect(matchesSearch(['Nitro как граница'], 'NITRO')).toBe(true);
    expect(matchesSearch(['Nitro как граница'], 'нет такого слова')).toBe(false);
  });

  it('«ё» и «е» не различаются ни в запросе, ни в тексте', () => {
    expect(matchesSearch(['Ёлка'], 'елка')).toBe(true);
    expect(matchesSearch(['елка'], 'ЁЛКА')).toBe(true);
  });
});
