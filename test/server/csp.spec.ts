import { describe, expect, it } from 'vitest';
import { applyNonce, buildCsp, createNonce, externalOrigin } from '../../server/utils/csp';

const directive = (policy: string, name: string) =>
  policy.split('; ').find((item) => item.startsWith(`${name} `)) ?? '';

describe('buildCsp', () => {
  it('script-src держится на nonce и не разрешает inline и eval', () => {
    const scriptSrc = directive(buildCsp({ nonce: 'abc' }), 'script-src');

    expect(scriptSrc).toContain("'nonce-abc'");
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('плагины, подмена base и встраивание сайта в чужие фреймы закрыты', () => {
    const policy = buildCsp({ nonce: 'abc' });

    expect(directive(policy, 'object-src')).toBe("object-src 'none'");
    expect(directive(policy, 'base-uri')).toBe("base-uri 'none'");
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'self'");
  });

  it('внешний API попадает в connect-src, относительный — нет', () => {
    expect(externalOrigin('/api')).toBeUndefined();

    const api = externalOrigin('https://api.example.com/v1');
    expect(api).toBe('https://api.example.com');
    expect(directive(buildCsp({ nonce: 'n', connectSrc: [api!] }), 'connect-src')).toContain(api);
  });
});

describe('createNonce', () => {
  it('каждый ответ получает новый nonce не короче 128 бит', () => {
    const nonces = new Set(Array.from({ length: 200 }, () => createNonce()));

    expect(nonces.size).toBe(200);
    for (const nonce of nonces) expect(atob(nonce)).toHaveLength(16);
  });
});

/** HTML-ответ в разрезе хука render:html: теги фреймворка и разметка приложения. */
const render = () => ({
  head: ['<script type="importmap">{}</script><link rel="modulepreload" href="/a.js">'],
  body: [
    '<div id="__nuxt"><script>alert("из v-html")</script></div>',
    '<div id="teleports"><script>alert("из телепорта")</script></div>',
    '<script>window.__MODULE_STATE__={}</script>',
  ],
  bodyAppend: [
    '<script type="application/json" id="__NUXT_DATA__">[]</script><script>go()</script>',
  ],
});

describe('applyNonce', () => {
  it('каждый script и link фреймворка получает nonce', () => {
    const html = applyNonce(render(), 'N');
    const tags = [...html.head, ...html.bodyAppend].join('').match(/<(script|link)\b[^>]*>/g) ?? [];

    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toContain('nonce="N"');
  });

  it('HTML приложения не получает nonce — внедрённый скрипт остаётся недоверенным', () => {
    const html = applyNonce(render(), 'N');

    expect(html.body.slice(0, 2)).toEqual(render().body.slice(0, 2));
  });

  it('скрипт, который модуль дописал после приложения, получает nonce', () => {
    const html = applyNonce(render(), 'N');

    expect(html.body[2]).toContain('<script nonce="N">');
  });

  it('существующий nonce не дублируется', () => {
    const html = applyNonce(
      { head: ['<script nonce="old">x()</script>'], body: [], bodyAppend: [] },
      'N',
    );

    expect(html.head.join('')).toContain('<script nonce="old">');
    expect(html.head.join('')).not.toContain('<script nonce="N"');
  });

  it('Vite получает nonce для подгружаемых чанков', () => {
    expect(applyNonce(render(), 'N').head[0]).toBe('<meta property="csp-nonce" nonce="N">');
  });
});
