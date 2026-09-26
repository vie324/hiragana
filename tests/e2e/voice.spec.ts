import { expect, test, type Page } from '@playwright/test';
import { openSettings, prepare, seedProfile } from './helpers';

/** まえもって つくった 声が ない ぶんを きろくする */
async function trackMisses(page: Page) {
  await page.addInitScript(() => {
    window.__HIRAGANA_VOICE_MISSES__ = [];
  });
}

async function startWithVoice(page: Page) {
  await page.goto('./');
  await expect.poll(() => page.evaluate(() => window.__hiragana!.voice()?.slug ?? null), { timeout: 15_000 }).toBe('zundamon');
  await page.getByTestId('start-button').click({ force: true });
}

test('どの 画面の セリフも ずんだもんの 声が ある (なまえ いがい)', async ({ page }) => {
  const known = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'];
  const kana = Object.fromEntries(known.map((k) => [k, { box: 3, ok: 4, ng: 1, last: 1, due: 1, intro: true, write: 1 }]));
  await prepare(page, seedProfile({ kana, stickers: { '🐶': 1 }, outfits: ['crown'], days: { '2026-09-01': { sec: 60, acts: 1, stamp: true } } }));
  await trackMisses(page);
  await startWithVoice(page);

  const routes = [
    { name: 'home' },
    { name: 'map' },
    { name: 'play' },
    { name: 'write' },
    { name: 'books' },
    { name: 'chart' },
    { name: 'stickers' },
    { name: 'dressup' },
    { name: 'stamps' },
    { name: 'tree' },
    { name: 'balloon' },
    { name: 'firstsound' },
    { name: 'wordbuild' },
    { name: 'readquiz' },
    { name: 'memory' },
    { name: 'shiritori' },
    { name: 'lesson', kana: 'か' },
    { name: 'special', lessonId: 'tenten' },
    { name: 'special', lessonId: 'small-tsu' },
    { name: 'name' },
    { name: 'writeKana', kana: 'き' },
    { name: 'buddy' },
    { name: 'sleep' },
  ];
  for (const r of routes) {
    await page.evaluate((route) => window.__hiragana!.resetTo(route as never), r);
    await page.waitForTimeout(500);
  }

  // カタカナ
  await page.evaluate(() => window.__hiragana!.update((d) => void (d.settings.script = 'kata')));
  const kataRoutes = [
    { name: 'home' },
    { name: 'map' },
    { name: 'play' },
    { name: 'write' },
    { name: 'chart' },
    { name: 'tree' },
    { name: 'balloon', script: 'kata' },
    { name: 'firstsound', script: 'kata' },
    { name: 'wordbuild', nodeId: 'k-sa:wordbuild:1' },
    { name: 'readquiz', nodeId: 'k-sa:readquiz:1' },
    { name: 'memory', nodeId: 'k-ta:memory:1' },
    { name: 'lesson', kana: 'カ' },
    { name: 'special', lessonId: 'k-long' },
    { name: 'special', lessonId: 'k-tsu' },
    { name: 'writeKana', kana: 'キ' },
  ];
  for (const r of kataRoutes) {
    await page.evaluate((route) => window.__hiragana!.resetTo(route as never), r);
    await page.waitForTimeout(500);
  }

  // えほんを よんでもらう (なまえ・あいぼうの なまえ いりの ページも)
  await page.evaluate(() => window.__hiragana!.resetTo({ name: 'book', id: 'osanpo' }));
  await page.getByTestId('read-auto').click({ force: true });
  await page.waitForTimeout(3000);

  const misses = await page.evaluate(() => window.__HIRAGANA_VOICE_MISSES__);
  expect(misses).toEqual([]);
});

test('iPad の 声に きりかえられる', async ({ page }) => {
  await prepare(page, seedProfile());
  await startWithVoice(page);
  await openSettings(page);
  await page.getByTestId('voice-tts').click();
  await expect.poll(() => page.evaluate(() => window.__hiragana!.voice())).toBeNull();
  await page.getByTestId('voice-zundamon').click();
  await expect.poll(() => page.evaluate(() => window.__hiragana!.voice()?.name ?? null)).toBe('ずんだもん');
});
