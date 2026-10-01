import { z } from 'zod';

/* Схема живёт в shared/, потому что её читают обе стороны: Nitro валидирует запрос
   и данные на выходе, страница выводит из неё тип и разбирает адресную строку
   (shared/utils/query.ts). Один источник — расхождения между «что обещает бэк» и
   «что ждёт страница» не возникает. */

export const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  lead: z.string(),
  body: z.string(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.iso.datetime(),
  cover: z.string().optional(),
});

export type Post = z.infer<typeof postSchema>;

/* Параметры любого списка. У каждого поля есть значение по умолчанию или optional:
   на этом держится мягкий разбор URL и канонический вид без значений по умолчанию.
   Фильтры конкретного раздела добавляют через listQuerySchema.extend({ ... }). */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  q: z.string().trim().max(120).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
