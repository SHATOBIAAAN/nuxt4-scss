import { describe, expect, it } from 'vitest';
import { listQuerySchema } from '#shared/schemas/post';
import { parseQueryLoose, toCanonicalQuery } from '#shared/utils/query';

const defaults = listQuerySchema.parse({});

describe('parseQueryLoose', () => {
  it('невалидный параметр получает значение по умолчанию, остальные сохраняются', () => {
    for (const page of ['abc', '0', '-3', '1.5', '']) {
      const state = parseQueryLoose(listQuerySchema, { page, q: 'токены' });

      expect(state.page).toBe(defaults.page);
      expect(state.q).toBe('токены');
    }
  });

  it('результат всегда проходит строгую схему', () => {
    const garbage = [
      {},
      { page: 'x', limit: '1000', q: 'а'.repeat(500) },
      { page: ['2', '3'] },
      { utm_source: 'mail' },
    ];

    for (const raw of garbage) {
      expect(listQuerySchema.safeParse(parseQueryLoose(listQuerySchema, raw)).success).toBe(true);
    }
  });
});

describe('toCanonicalQuery', () => {
  it('значения по умолчанию в канонический вид не попадают', () => {
    expect(toCanonicalQuery(listQuerySchema, defaults)).toEqual({});
  });

  it('канонический вид не зависит от формы исходного query', () => {
    const plain = parseQueryLoose(listQuerySchema, { q: 'кеш', page: '2' });
    const noisy = parseQueryLoose(listQuerySchema, { page: ['2'], q: '  кеш ', utm_source: 'x' });

    expect(toCanonicalQuery(listQuerySchema, noisy)).toEqual(
      toCanonicalQuery(listQuerySchema, plain),
    );
  });

  it('разбор канонического вида возвращает то же состояние', () => {
    const states = [defaults, { ...defaults, page: 4 }, { ...defaults, q: 'ёлка', limit: 3 }];

    for (const state of states) {
      const canonical = toCanonicalQuery(listQuerySchema, state);
      expect(parseQueryLoose(listQuerySchema, canonical)).toEqual(state);
    }
  });

  it('omit убирает ключи, которые задаёт страница, а не URL', () => {
    const canonical = toCanonicalQuery(listQuerySchema, { ...defaults, limit: 3 }, ['limit']);

    expect(canonical).not.toHaveProperty('limit');
  });
});
