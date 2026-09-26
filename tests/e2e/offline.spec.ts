import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('いちど ひらけば オフラインでも つかえる (PWA)', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByTestId('start-button')).toBeVisible();
  // Service Worker が うごきだすまで まつ
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return !!reg.active;
  });
  // 声の パックが キャッシュに はいるまで まつ (アプリが よみこむと SW が ほぞんする)
  const packs = await page.evaluate(async () => {
    const index = (await (await fetch('./voice/zundamon/index.json')).json()) as { packs: { file: string }[] };
    return index.packs.map((p) => new URL(`./voice/zundamon/${p.file}`, location.href).href);
  });
  expect(packs.length).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(async (urls) => {
          const c = await caches.open('hiragana-voice');
          const keys = new Set((await c.keys()).map((r) => r.url));
          return urls.filter((u) => keys.has(u)).length;
        }, packs),
      { timeout: 30_000 },
    )
    .toBe(packs.length);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('start-button')).toBeVisible();
  const ok = await page.evaluate(async (urls) => {
    const manifest = (await fetch('./manifest.webmanifest')).ok;
    const index = (await fetch('./voice/zundamon/index.json')).ok;
    const pack = (await fetch(urls[0])).ok;
    return { manifest, index, pack };
  }, packs);
  expect(ok).toEqual({ manifest: true, index: true, pack: true });
  await context.setOffline(false);
});
