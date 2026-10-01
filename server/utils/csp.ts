/* Content-Security-Policy на nonce. Nuxt сам кладёт в HTML inline-скрипты
   (window.__NUXT__.config, importmap, payload), поэтому политика без nonce либо
   ломает гидрацию, либо требует 'unsafe-inline' в script-src и теряет смысл.
   Nonce новый на каждый ответ; 'strict-dynamic' пропускает чанки, которые
   подгружает уже доверенный скрипт. */

export interface CspOptions {
  nonce: string;
  /** Внешние адреса для fetch — например, origin NUXT_PUBLIC_API_PREFIX. */
  connectSrc?: string[];
  reportUri?: string;
}

export function buildCsp({ nonce, connectSrc = [], reportUri }: CspOptions): string {
  const directives = [
    "default-src 'self'",
    // 'self' браузеры с CSP3 при 'strict-dynamic' игнорируют — это запасной путь для старых
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'`,
    // Vue и Nuxt пишут style-атрибуты, а у атрибута nonce не бывает
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    ["connect-src 'self'", ...connectSrc].join(' '),
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  if (reportUri) directives.push(`report-uri ${reportUri}`, 'report-to csp');
  return directives.join('; ');
}

export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/** Origin внешнего API для connect-src; для относительного пути ('/api') — ничего. */
export function externalOrigin(url: string): string | undefined {
  return /^https?:\/\//i.test(url) ? new URL(url).origin : undefined;
}

const TAG_WITHOUT_NONCE_RE = /<(script|link)\b(?![^>]*\snonce=)/gi;

interface HtmlChunks {
  head: string[];
  body: string[];
  bodyAppend: string[];
}

/** Сколько первых кусков body — разметка приложения: HTML Vue и его телепорты.
    Всё, что дальше, дописали хуки модулей (например, состояние nuxt-site-config). */
const APP_BODY_CHUNKS = 2;

/** Проставляет nonce тегам, которые генерирует фреймворк: head, хвост body (payload,
    importmap, скрипты onPrehydrate) и то, что модули дописали после приложения.
    Разметку приложения не трогаем намеренно: туда через v-html может попасть чужой
    HTML, и nonce превратил бы внедрённый <script> в доверенный.
    Meta csp-nonce читает Vite, когда подгружает чанки при навигации. */
export function applyNonce<T extends HtmlChunks>(html: T, nonce: string): T {
  const stamp = (chunks: string[]) =>
    chunks.map((chunk) => chunk.replace(TAG_WITHOUT_NONCE_RE, `<$1 nonce="${nonce}"`));

  html.head = [`<meta property="csp-nonce" nonce="${nonce}">`, ...stamp(html.head)];
  html.body = [...html.body.slice(0, APP_BODY_CHUNKS), ...stamp(html.body.slice(APP_BODY_CHUNKS))];
  html.bodyAppend = stamp(html.bodyAppend);
  return html;
}
