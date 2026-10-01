import type { z } from 'zod';

/* Разбор и канонический вид query по zod-схеме. Одна схема описывает параметры
   списка для всех сторон: сервер валидирует ими запрос (400 на мусор), страница
   читает адресную строку, кеш Nitro строит ключ. Канонический вид один: без значений
   по умолчанию и с ключами по алфавиту, поэтому «?page=1» и отсутствие page — это
   одна страница, один URL и один слот кеша. */

type QuerySchema = z.ZodObject;

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const isBlank = (value: unknown) => value === undefined || value === null || value === '';

/** Мягкий разбор query из адресной строки: невалидный параметр получает значение
    по умолчанию, а не роняет страницу — `?page=abc` это первая страница, а не 500.
    Требование к схеме: у каждого поля есть `.default()` или `.optional()`. */
export function parseQueryLoose<S extends QuerySchema>(
  schema: S,
  raw: Record<string, unknown>,
): z.output<S> {
  const input: Record<string, unknown> = {};
  for (const key of Object.keys(schema.shape)) {
    const value = firstValue(raw[key]);
    if (!isBlank(value)) input[key] = value;
  }

  const result = schema.safeParse(input);
  if (result.success) return result.data;

  for (const issue of result.error.issues) delete input[String(issue.path[0])];
  return schema.parse(input);
}

/** Канонический query: только значения, отличные от значений по умолчанию.
    `omit` убирает ключи, которые задаёт страница, а не URL (например, limit). */
export function toCanonicalQuery<S extends QuerySchema>(
  schema: S,
  value: Partial<z.output<S>>,
  omit: readonly string[] = [],
): Record<string, string> {
  const defaults = schema.parse({}) as Record<string, unknown>;
  const current = value as Record<string, unknown>;
  const canonical: Record<string, string> = {};

  for (const key of Object.keys(schema.shape).toSorted()) {
    const item = current[key];
    if (omit.includes(key) || isBlank(item) || item === defaults[key]) continue;
    canonical[key] = String(item);
  }

  return canonical;
}
