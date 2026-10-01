import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NAV } from '~/config/nav';

/* Правила из AGENTS.md, которые не видит ни одна другая проверка: oxlint не разбирает
   <template> и <style>, а дерево файлов, зависимости и документацию не видит никто.
   Один тест — одно правило; при провале в сообщении список нарушителей. */

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKIP = new Set(['node_modules', '.nuxt', '.output', '.data', 'dist', '.git']);

function walk(dir: string): string[] {
  if (!existsSync(join(ROOT, dir))) return [];
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');
const withExt = (files: string[], ...exts: string[]) =>
  files.filter((file) => exts.includes(extname(file)));
const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const stripComments = (code: string) =>
  code
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const styleBlocks = (file: string) =>
  [...read(file).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) =>
    stripComments(match[1] ?? ''),
  );

/** Селекторы с :hover, над которыми нет @media (pointer: fine). */
function unguardedHovers(css: string): string[] {
  const stack: string[] = [];
  const found: string[] = [];
  let prelude = '';

  for (const char of css) {
    if (char === '{') {
      const selector = prelude.trim();
      const guarded = stack.some((outer) => /@media[^{]*pointer\s*:\s*fine/.test(outer));
      if (/:hover\b/.test(selector) && !guarded) found.push(selector);
      stack.push(selector);
      prelude = '';
    } else if (char === '}') {
      stack.pop();
      prelude = '';
    } else if (char === ';') {
      prelude = '';
    } else {
      prelude += char;
    }
  }
  return found;
}

/** Команды, которые пакет кладёт в node_modules/.bin. */
function binsOf(dep: string): string[] {
  const manifest = join(ROOT, 'node_modules', dep, 'package.json');
  if (!existsSync(manifest)) return [];
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  if (!bin) return [];
  return typeof bin === 'string' ? [basename(dep)] : Object.keys(bin);
}

const appFiles = walk('app');
const vueFiles = withExt(appFiles, '.vue');
const sourceFiles = withExt([...appFiles, ...walk('server'), ...walk('shared')], '.ts', '.vue');
const configFiles = readdirSync(ROOT).filter((file) => file.endsWith('.config.ts'));

/* Префиксы компонентов берутся из nuxt.config.ts, а не дублируются здесь. */
const PREFIXES = new Map(
  [...read('nuxt.config.ts').matchAll(/path: '~\/components\/(\w+)', prefix: '(\w+)'/g)].map(
    ([, dir = '', prefix = '']) => [dir, prefix],
  ),
);
const componentFiles = vueFiles.filter((file) => file.startsWith('app/components/'));

/** app/components/ui/Card/Article.vue → UiCardArticle */
const tagOf = (file: string) => {
  const [dir = '', ...rest] = file.replace('app/components/', '').split('/');
  return [PREFIXES.get(dir) ?? '', ...rest.map((part) => basename(part, '.vue'))].join('');
};
const kebab = (name: string) => name.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();

describe('разметка и стили', () => {
  it('v-html — только в ui/ContentHtml.vue', () => {
    const offenders = vueFiles.filter(
      (file) => file !== 'app/components/ui/ContentHtml.vue' && /\sv-html=/.test(read(file)),
    );
    const innerHtml = withExt(appFiles, '.ts', '.vue').filter((file) =>
      /\.innerHTML\s*=/.test(stripComments(read(file))),
    );

    expect([...offenders, ...innerHtml]).toEqual([]);
  });

  it('в стилях компонентов нет литералов цвета — только переменные из assets/styles', () => {
    const COLOR = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
    const offenders = vueFiles.flatMap((file) =>
      styleBlocks(file).flatMap((css) =>
        css
          .split('\n')
          .filter(
            (line) => /^\s*[\w-]+\s*:/.test(line) && COLOR.test(line.split(':').slice(1).join(':')),
          )
          .map((line) => `${file}: ${line.trim()}`),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it(':hover — только под @media (pointer: fine) или через @include hover', () => {
    const styles = [
      ...vueFiles.flatMap((file) => styleBlocks(file).map((css) => [file, css] as const)),
      ...withExt(walk('app/assets/styles'), '.scss').map(
        (file) => [file, stripComments(read(file))] as const,
      ),
    ];
    const offenders = styles.flatMap(([file, css]) =>
      unguardedHovers(css).map((selector) => `${file}: ${selector}`),
    );

    expect(offenders).toEqual([]);
  });

  it('на каждой странице ровно один <h1>', () => {
    const pages = [...withExt(walk('app/pages'), '.vue'), 'app/error.vue'];
    const offenders = pages
      .map((file) => `${file}: ${(stripComments(read(file)).match(/<h1[\s>]/g) ?? []).length}`)
      .filter((line) => !line.endsWith(': 1'));

    expect(offenders).toEqual([]);
  });

  it('NuxtLink не передаётся строкой в <component :is> — только через resolveComponent', () => {
    const offenders = vueFiles.filter((file) =>
      /["'`]NuxtLink["'`]/.test(
        stripComments(read(file)).replace(/resolveComponent\(\s*["'`]NuxtLink["'`]\s*\)/g, ''),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it('process.env не читается в коде приложения', () => {
    const offenders = withExt(appFiles, '.ts', '.vue').filter((file) =>
      /process\.env/.test(stripComments(read(file))),
    );

    expect(offenders).toEqual([]);
  });
});

describe('дерево файлов', () => {
  it('имя файла компонента — имя тега: PascalCase, без index.vue и Component.vue', () => {
    const offenders = componentFiles.filter((file) => {
      const name = basename(file, '.vue');
      return !/^[A-Z][A-Za-z\d]*$/.test(name) || name === 'Index' || name === 'Component';
    });

    expect(offenders).toEqual([]);
  });

  it('каждая папка app/components зарегистрирована в nuxt.config.ts с префиксом', () => {
    const entries = readdirSync(join(ROOT, 'app/components'), { withFileTypes: true });
    const offenders = entries
      .filter((entry) => !entry.isDirectory() || !PREFIXES.has(entry.name))
      .map((entry) => entry.name);

    expect(offenders).toEqual([]);
  });

  it('у каждого компонента есть потребитель (кроме набора иконок)', () => {
    // Иконки — набор, как шрифт: их держат про запас, и неиспользуемая иконка — не мусор
    const KIT = 'app/components/ui/Icon/';
    const corpus = vueFiles.map((file) => ({ file, text: read(file) }));

    const unused = componentFiles.filter((file) => {
      if (file.startsWith(KIT)) return false;
      const tag = tagOf(file);
      const usage = new RegExp(
        `<(?:${tag}|${kebab(tag)})[\\s/>]|resolveComponent\\(['"]${tag}['"]`,
      );
      return !corpus.some((other) => other.file !== file && usage.test(other.text));
    });

    expect(unused).toEqual([]);
  });

  it('у каждого экспорта из composables, stores и utils есть потребитель вне тестов', () => {
    const modules = withExt(
      [
        ...walk('app/composables'),
        ...walk('app/stores'),
        ...walk('app/utils'),
        ...walk('server/utils'),
        ...walk('shared/utils'),
      ],
      '.ts',
    );
    const corpus = sourceFiles.map((file) => ({ file, text: read(file) }));

    const unused = modules.flatMap((module) =>
      [...read(module).matchAll(/export\s+(?:async\s+)?(?:function|const|let)\s+(\w+)/g)]
        .map(([, name = '']) => name)
        .filter((name) => {
          const usage = new RegExp(`\\b${name}\\b`);
          return !corpus.some((other) => other.file !== module && usage.test(other.text));
        })
        .map((name) => `${module}: ${name}`),
    );

    expect(unused).toEqual([]);
  });

  it('каждая ссылка навигации ведёт на существующую страницу', () => {
    const pages = walk('app/pages');
    const broken = NAV.filter(({ to }) => {
      const path = to === '/' ? '' : to;
      return ![`app/pages${path}/index.vue`, `app/pages${path}.vue`].some((file) =>
        pages.includes(file),
      );
    }).map(({ to }) => to);

    expect(broken).toEqual([]);
  });

  it('имена файлов в public/ — только латиница, цифры, точка, дефис и подчёркивание', () => {
    expect(walk('public').filter((file) => !/^[\w./-]+$/.test(file))).toEqual([]);
  });
});

describe('зависимости', () => {
  const pkg = JSON.parse(read('package.json')) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    'lint-staged'?: Record<string, string[]>;
    'simple-git-hooks'?: Record<string, string>;
  };
  const deps = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];

  /* Пакеты, которые работают без import, без записи в конфиге и без команды в
     scripts, — каждый с причиной. Новая строка здесь — осознанное решение. */
  const IMPLICIT: Record<string, string> = {
    sass: 'компилирует <style lang="scss">, его вызывает Vite',
    'vue-tsc': 'его запускает nuxt typecheck',
    '@types/node': 'типы Node для тестов и конфигов (tsconfig.tooling.json)',
    '@vue/test-utils': 'peer-зависимость @nuxt/test-utils: через него работает mountSuspended',
  };

  const FORBIDDEN = new Set([
    'axios',
    'qs',
    'lodash',
    '@vueuse/nuxt',
    '@vueuse/components',
    'tailwindcss',
    '@nuxtjs/tailwindcss',
    'prettier',
    'eslint',
  ]);

  it('у каждой зависимости есть место потребления', () => {
    const code = [...sourceFiles, ...withExt(walk('test'), '.ts'), ...configFiles]
      .map(read)
      .join('\n');
    const configs = configFiles.map(read).join('\n');
    const commands = JSON.stringify([pkg.scripts, pkg['lint-staged'], pkg['simple-git-hooks']]);

    const unused = deps.filter((dep) => {
      if (dep in IMPLICIT) return false;
      const name = escapeRe(dep);
      const imported = new RegExp(`from ['"]${name}(?:/[^'"]*)?['"]|import\\(['"]${name}`).test(
        code,
      );
      // модуль в nuxt.config.ts, окружение в vitest.config.ts и т. п.
      const configured = new RegExp(`['"]${name}(?:/[^'"]*)?['"]`).test(configs);
      const invoked = binsOf(dep).some((bin) =>
        new RegExp(`(?:^|[\\s"])${escapeRe(bin)}(?:[\\s"]|$)`).test(commands),
      );
      return !imported && !configured && !invoked;
    });

    expect(unused).toEqual([]);
  });

  it('запрещённые пакеты не установлены', () => {
    const found = deps.filter((dep) => FORBIDDEN.has(dep) || dep.startsWith('lodash.'));

    expect(found).toEqual([]);
  });
});

describe('документация', () => {
  const docs = [
    ...readdirSync(ROOT).filter((file) => file.endsWith('.md')),
    ...withExt(walk('docs'), '.md'),
  ];
  const tags = new Set(componentFiles.map(tagOf));

  it('пути в документации существуют', () => {
    const PATH = /`((?:app|server|shared|test|docs|scripts|public|\.github)\/[\w./[\]-]*)`/g;
    const missing = docs.flatMap((doc) =>
      [...read(doc).matchAll(PATH)]
        .map(([, path = '']) => path.replace(/\/$/, ''))
        .filter((path) => !path.includes('..') && !existsSync(join(ROOT, path)))
        .map((path) => `${doc}: ${path}`),
    );

    expect(missing).toEqual([]);
  });

  it('компоненты, названные в документации, существуют', () => {
    const missing = docs.flatMap((doc) =>
      [...read(doc).matchAll(/<((?:Ui|App|Page)[A-Z]\w*)>/g)]
        .map(([, tag = '']) => tag)
        .filter((tag) => !tags.has(tag))
        .map((tag) => `${doc}: <${tag}>`),
    );

    expect(missing).toEqual([]);
  });
});
