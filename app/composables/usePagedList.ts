import type { z } from 'zod';
import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { listQuerySchema } from '#shared/schemas/post';
import type { ListResponse, Pagination } from '#shared/types/content';
import { parseQueryLoose, toCanonicalQuery } from '#shared/utils/query';

type ListSchema = typeof listQuerySchema;

interface PagedListOptions<S extends ListSchema> {
  /** Схема параметров списка — та же, что валидирует запрос на сервере. */
  schema: S;
  /** Параметры, которые задаёт страница, а не адресная строка (например, limit). */
  fixed?: Partial<z.output<S>>;
}

/* Список, у которого страница, поиск и фильтры живут в адресной строке: ссылку можно
   переслать, SSR знает, что рисовать, а «Назад» возвращает прежнюю выборку.

   Адрес всегда канонический. Мусор и значения по умолчанию (?page=abc, ?page=1, ?q=)
   убираются редиректом 301, номер за пределами списка (?page=99) — редиректом 302 на
   последнюю страницу. Посторонние параметры (utm_*) остаются как есть.

   Вызывается с await: на сервере редирект должен случиться до рендера. */
export function usePagedList<T, S extends ListSchema = ListSchema>(
  path: string,
  { schema, fixed = {} }: PagedListOptions<S>,
) {
  const route = useRoute();
  const nuxtApp = useNuxtApp();
  const keys = Object.keys(schema.shape);
  const fixedKeys = Object.keys(fixed);

  /** Состояние списка: адресная строка плюс то, что задала страница. */
  const state = computed(
    () => ({ ...parseQueryLoose(schema, route.query), ...fixed }) as z.output<S>,
  );

  const request = useApiFetch<ListResponse<T>>(path, {
    query: computed(() => toCanonicalQuery(schema, state.value)),
  });
  const { data, pending, error, refresh } = request;

  /* Пока грузится новая выборка, на экране остаётся прежняя: список не мигает
     «Загрузкой» на каждой смене страницы или букве в поиске. */
  const lastSeen = shallowRef<ListResponse<T>>();
  watch(data, (value) => {
    if (value) lastSeen.value = value;
  });
  /* computed, а не только watch: на сервере обычные watch не выполняются, и список
     из SSR разошёлся бы с клиентским при гидрации. */
  const shown = computed(() => data.value ?? lastSeen.value);

  const items = computed(() => shown.value?.data ?? []);
  const pagination = computed<Pagination>(
    () =>
      shown.value?.meta.pagination ?? {
        page: state.value.page,
        limit: state.value.limit,
        total: 0,
        totalPages: 1,
      },
  );

  const toQuery = (next: z.output<S>): LocationQueryRaw => ({
    ...foreignParams(route.query, keys),
    ...toCanonicalQuery(schema, next, fixedKeys),
  });

  /** Адрес страницы списка — для ссылок пагинации. */
  const pageLink = (page: number): RouteLocationRaw => ({
    query: toQuery({ ...state.value, page }),
  });

  /** Меняет параметры списка. Любой фильтр, кроме самой страницы, сбрасывает её на
      первую: иначе поиск со второй страницы ведёт на обрезанную последнюю. */
  const setParams = (patch: Partial<z.output<S>>, { replace = false } = {}) =>
    nuxtApp.runWithContext(() =>
      navigateTo({ query: toQuery({ ...state.value, page: 1, ...patch }) }, { replace }),
    );

  const canonicalize = async () => {
    const served = data.value?.meta.pagination.page ?? state.value.page;
    const target = toCanonicalQuery(schema, { ...state.value, page: served }, fixedKeys);
    if (sameQuery(pickParams(route.query, keys), target)) return;

    await nuxtApp.runWithContext(() =>
      navigateTo(
        { query: { ...foreignParams(route.query, keys), ...target } },
        { replace: true, redirectCode: served === state.value.page ? 301 : 302 },
      ),
    );
  };

  const list = { items, pagination, state, pending, error, refresh, setParams, pageLink };

  return Object.assign(
    request.then(async () => {
      await canonicalize();
      return list;
    }),
    list,
  );
}

const firstValue = (value: LocationQuery[string] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Параметры списка из адреса — строками, как их видит URL. */
function pickParams(query: LocationQuery, keys: string[]): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = firstValue(query[key]);
    if (value != null) picked[key] = value;
  }
  return picked;
}

/** Посторонние параметры (utm_* и прочие) — список их не трогает. */
function foreignParams(query: LocationQuery, keys: string[]): LocationQuery {
  return Object.fromEntries(Object.entries(query).filter(([key]) => !keys.includes(key)));
}

function sameQuery(a: Record<string, string>, b: Record<string, string>) {
  const aKeys = Object.keys(a);
  return aKeys.length === Object.keys(b).length && aKeys.every((key) => a[key] === b[key]);
}
