import { describe, expect, it } from 'vitest';
import { paginationItems } from '../../app/utils/pagination';

const cases = Array.from({ length: 40 }, (_, index) => index + 1).flatMap((total) =>
  Array.from({ length: total }, (_, index) => ({ total, current: index + 1 })),
);

const pagesOf = (total: number, current: number) =>
  paginationItems(current, total).flatMap((item) => (item.type === 'page' ? [item.page] : []));

describe('paginationItems', () => {
  it('первая, последняя и текущая страницы видны всегда', () => {
    for (const { total, current } of cases) {
      const pages = pagesOf(total, current);
      expect(pages).toContain(1);
      expect(pages).toContain(total);
      expect(pages).toContain(current);
    }
  });

  it('номера идут по возрастанию без повторов', () => {
    for (const { total, current } of cases) {
      const pages = pagesOf(total, current);
      expect(pages).toEqual([...new Set(pages)].toSorted((a, b) => a - b));
    }
  });

  it('длина ряда не меняется при переходе между страницами', () => {
    for (let total = 1; total <= 40; total += 1) {
      const lengths = new Set(
        Array.from({ length: total }, (_, index) => paginationItems(index + 1, total).length),
      );
      expect(lengths.size).toBe(1);
    }
  });

  it('многоточие прячет не меньше двух страниц', () => {
    for (const { total, current } of cases) {
      const items = paginationItems(current, total);

      items.forEach((item, index) => {
        if (item.type !== 'gap') return;
        const before = items[index - 1];
        const after = items[index + 1];
        if (before?.type !== 'page' || after?.type !== 'page') throw new Error('gap без соседей');
        expect(after.page - before.page).toBeGreaterThan(2);
      });
    }
  });
});
