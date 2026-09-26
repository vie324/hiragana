import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** public/ の ファイル一覧 (Service Worker で キャッシュする) */
function publicFiles(dir = 'public'): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative('public', p).split('\\').join('/'));
    }
  };
  walk(dir);
  return out;
}

/**
 * ビルド結果の全ファイルをプリキャッシュする Service Worker (sw.js) を生成する。
 * iPad でオフラインでも あそべるようにするため。
 * 声の パック (public/voice/<slug>/<pack>.<hash>.bin) は おおきいので、
 * バージョンを こえて のこる べつの キャッシュに いれ、つかったときに ほぞんする。
 */
function serviceWorker(): Plugin {
  return {
    name: 'hiragana-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const all = [...Object.keys(bundle), ...publicFiles()].filter((f) => !f.endsWith('.map'));
      const isPack = (f: string) => f.startsWith('voice/') && f.endsWith('.bin');
      const files = all.filter((f) => !isPack(f));
      const packs = all.filter(isPack);
      const version = Date.now().toString(36);
      const source = `// 自動生成: vite.config.ts
const CACHE = 'hiragana-${version}';
const VOICE_CACHE = 'hiragana-voice';
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])};
const PACKS = ${JSON.stringify(packs.map((f) => './' + f))};
const isPack = (url) => /\/voice\/[^/]+\/[^/]+\.bin$/.test(new URL(url).pathname);
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  const keep = new Set(PACKS.map((f) => new URL(f, self.location).href));
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== VOICE_CACHE).map((k) => caches.delete(k))))
      .then(() => caches.open(VOICE_CACHE))
      .then((c) => c.keys().then((reqs) => Promise.all(reqs.filter((r) => !keep.has(r.url)).map((r) => c.delete(r)))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // ページ本体は ネットワーク優先 (オフライン時は キャッシュ)
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  const store = isPack(req.url) ? VOICE_CACHE : CACHE;
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(store).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), serviceWorker()],
  build: {
    target: ['safari15', 'chrome100'],
    assetsInlineLimit: 0,
  },
});
