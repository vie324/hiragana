// 自動生成: vite.config.ts
const CACHE = 'hiragana-muj0jmp5';
const VOICE_CACHE = 'hiragana-voice';
const FILES = ["./","./assets/index-jrNPSGDM.js","./assets/KleeOne-SemiBold-kana-C_kdNL4m.woff2","./assets/index-Bitfx6kW.css","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./manifest.webmanifest","./voice/zundamon/index.json"];
const PACKS = ["./voice/zundamon/book.04cd316e94.bin","./voice/zundamon/kana.b965c9e8c8.bin","./voice/zundamon/ui.b73b0d43bd.bin","./voice/zundamon/word.447f9f6c1f.bin"];
const isPack = (url) => {
  const path = new URL(url).pathname;
  return path.includes('/voice/') && path.endsWith('.bin');
};
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
