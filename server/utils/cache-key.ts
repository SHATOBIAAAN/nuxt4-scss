import type { z } from 'zod';
import { toCanonicalQuery } from '#shared/utils/query';

/** Ключ кеша для defineCachedEventHandler, построенный из query.

    Nitro прогоняет ключ через escapeKey — `replace(/\W/g, '')` — и вырезает всё,
    кроме [A-Za-z0-9_]: кириллица, пробелы и минус исчезают, и «?q=токены» с
    «?q=архитектура» ложатся в один слот. Поэтому ключ — hex-дайджест канонического
    query: escapeKey его не меняет, а порядок параметров, значения по умолчанию и
    посторонние метки (utm_*) на него не влияют.

    Невалидный запрос получает пустой ключ: Nitro возьмёт свой (хеш полного URL),
    ручка ответит 400, а ошибки в кеш не попадают. */
export async function canonicalQueryKey(
  schema: z.ZodObject,
  raw: Record<string, unknown>,
): Promise<string> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return '';

  const canonical = new URLSearchParams(toCanonicalQuery(schema, parsed.data)).toString();
  return sha256Hex(canonical);
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
