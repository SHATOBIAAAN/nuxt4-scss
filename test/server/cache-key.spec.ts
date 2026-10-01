import { describe, expect, it } from 'vitest';
import { listQuerySchema } from '#shared/schemas/post';
import { canonicalQueryKey } from '../../server/utils/cache-key';

/* То, что Nitro делает с ключом перед записью в хранилище. Ради этой строки
   ключ и строится как hex: всё, что она вырезает, в ключе не должно встречаться. */
const escapeKey = (key: string) => key.replace(/\W/g, '');

const keyOf = (query: Record<string, unknown>) => canonicalQueryKey(listQuerySchema, query);

describe('canonicalQueryKey', () => {
  it('ключ переживает escapeKey Nitro без изменений', async () => {
    for (const q of ['токены', 'a-b', 'пробел внутри', '']) {
      const key = await keyOf({ q });
      expect(escapeKey(key)).toBe(key);
    }
  });

  it('разные запросы дают разные ключи — кириллица и спецсимволы тоже', async () => {
    const queries = ['токены', 'архитектура', 'a-b', 'ab', 'a b', 'ё', 'е'];
    const keys = await Promise.all(queries.map((q) => keyOf({ q })));

    expect(new Set(keys).size).toBe(queries.length);
  });

  it('один смысл — один ключ: порядок, значения по умолчанию и посторонние метки не важны', async () => {
    const same = await Promise.all([
      keyOf({ q: 'кеш', page: '2' }),
      keyOf({ page: '2', q: 'кеш' }),
      keyOf({ page: '2', q: 'кеш', limit: '9', utm_source: 'mail' }),
    ]);

    expect(new Set(same).size).toBe(1);
    expect(await keyOf({})).toBe(await keyOf({ page: '1' }));
  });

  it('невалидный запрос не получает собственного ключа и не делит слот с валидным', async () => {
    for (const page of ['0', '-1', 'abc']) {
      expect(await keyOf({ page })).toBe('');
    }
  });
});
