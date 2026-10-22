import { expect, test, type Page } from '@playwright/test';
import strokes from '../../src/data/strokes.json' with { type: 'json' };
import { flattenPath } from '../../src/lib/stroke';
import type { Letter } from '../../src/state/letters';
import { collectReward, drawKana, passGate, prepare, seedProfile, settled, start } from './helpers';

type StrokeData = Record<string, { s: string[] }>;

/** れんしゅうで かいた もじ (ギャラリー) を いれておく */
async function seedGallery(page: Page, kana: string[]): Promise<void> {
  const g = { kana: {} as Record<string, unknown>, names: [] };
  for (const k of kana) {
    const s = (strokes as unknown as StrokeData)[k].s.map((d) =>
      flattenPath(d, 8).map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]),
    );
    g.kana[k] = [{ at: 1, stars: 3, strokes: s }];
  }
  await page.addInitScript((gallery) => {
    if (!localStorage.getItem('hiragana-bouken:gallery')) localStorage.setItem('hiragana-bouken:gallery', JSON.stringify(gallery));
  }, g);
}

const letters = (page: Page): Promise<Letter[]> => page.evaluate(() => window.__hiragana!.letters());

/** いま かいている もじ (ことばの ならびで きいろい もじ) */
const currentChar = async (page: Page) => (await page.locator('.lw-tile.now').innerText()).trim();

test('かいた もじが てがみに なって、ふうとうに いれて ポストへ', async ({ page }) => {
  await prepare(page, seedProfile({ stickers: { '🐰': 1 } }));
  await seedGallery(page, ['ま', 'へ', 'あ', 'り', 'が', 'と']);
  await start(page);

  // かく → てがみ
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'write' }));
  await page.getByTestId('write-letter').click({ force: true });
  await expect(page.getByTestId('letter-new')).toBeVisible();
  await page.getByTestId('letter-new').click({ force: true });

  // だれに → ママ、なんて → ありがとう (なまえは かかない)
  await page.getByTestId('to-mama').click({ force: true });
  await expect(page.getByTestId('msg-from')).toBeVisible();
  await page.getByTestId('msg-from').click({ force: true });
  await page.getByTestId('phrase-arigatou').click({ force: true });
  await expect(page.getByTestId('msg-count')).toContainText('8');
  await page.getByTestId('msg-next').click({ force: true });

  // 1もじめは じぶんで かく
  await expect(page.getByTestId('writing-pad')).toBeVisible();
  await settled(page);
  expect(await currentChar(page)).toBe('ま');
  await drawKana(page, 'ま');
  await expect(page.getByTestId('write-progress')).toHaveAttribute('data-done', '1', { timeout: 10_000 });

  // れんしゅうした もじを ぜんぶ いれる → のこりは「う」だけ
  await page.getByTestId('fill-practice').click({ force: true });
  await expect(page.getByTestId('write-progress')).toHaveAttribute('data-done', '7', { timeout: 10_000 });
  await expect.poll(() => currentChar(page), { timeout: 10_000 }).toBe('う');
  await page.waitForTimeout(1200);
  await drawKana(page, 'う');
  await expect(page.getByTestId('write-done')).toBeVisible({ timeout: 15_000 });

  let [letter] = await letters(page);
  expect(letter.to).toBe('まま');
  expect(letter.from).toBe('');
  expect(letter.lines).toEqual(['ありがとう']);
  const ink = letter.ink;
  expect(Object.keys(ink).length).toBe(8);
  expect(ink.t0.practice).toBeFalsy();
  expect(ink['b0.4'].ch).toBe('う');
  expect(ink.t1.practice).toBe(true);
  // かく れんしゅうにも なる
  const data = await page.evaluate(() => window.__hiragana!.getData());
  expect(data.kana['ま'].write).toBeGreaterThanOrEqual(1);
  expect(data.kana['う'].write).toBeGreaterThanOrEqual(1);

  // かざる: よぞらの びんせん (もじは きんいろに なる)・シール
  await page.getByTestId('write-deco').click({ force: true });
  await page.getByTestId('paper-yozora').click({ force: true });
  await page.getByTestId('deco-tab-sticker').click({ force: true });
  await page.getByTestId('deco-sticker-🐰').click({ force: true });
  await expect.poll(async () => (await letters(page))[0].stickers.length).toBe(1);
  [letter] = await letters(page);
  expect(letter.paper).toBe('yozora');
  expect(letter.color).toBe('kin');
  await page.getByTestId('deco-done').click({ force: true });

  // ふうとう → シール → ポスト
  await expect(page.getByTestId('seal-picker')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('seal-🌸').click({ force: true });
  await expect(page.getByTestId('post-box')).toHaveClass(/in/, { timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.getByTestId('post-box').click({ force: true });
  await collectReward(page);

  // てがみばこに はいっている
  await expect(page.getByTestId('letter-env')).toHaveCount(1);
  [letter] = await letters(page);
  expect(letter.posted).toBeGreaterThan(0);
  expect(letter.seal).toBe('🌸');

  // ひらいて よむ
  await page.getByTestId('letter-env').click({ force: true });
  await page.getByTestId('open-letter').click({ force: true });
  await expect(page.getByTestId('read-letter')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('read-letter').click({ force: true });
  await expect.poll(() => page.evaluate(() => window.__HIRAGANA_SPOKEN__!.includes('ありがとう'))).toBe(true);

  // おうちの方: 画像に して ほぞん (共有が できない ブラウザでは ダウンロード)
  await page.getByTestId('share-letter').click({ force: true });
  await passGateOnly(page);
  const download = await page.waitForEvent('download', { timeout: 20_000 });
  expect(download.suggestedFilename()).toMatch(/^tegami-\d{8}\.jpg$/);
  const path = await download.path();
  const { statSync } = await import('node:fs');
  expect(statSync(path).size).toBeGreaterThan(50_000);
});

/** てがみの 画面の なかの けいさん ゲート */
async function passGateOnly(page: Page): Promise<void> {
  await expect(page.getByTestId('gate-question')).toBeVisible();
  const ans = (await page.getByTestId('gate-question').getAttribute('data-answer'))!;
  for (const ch of ans) await page.getByTestId(`gate-${ch}`).click();
  await page.getByTestId('gate-ok').click();
}

test('じぶんで あて名を いれて、かきかけを あとから つづける', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'letterTo' }));
  await page.getByTestId('to-custom').click({ force: true });
  await expect(page.getByTestId('kana-keyboard')).toBeVisible();
  for (const k of ['け', 'ん', 'た']) await page.getByTestId(`key-${k}`).click();
  await expect(page.getByTestId('kk-display')).toContainText('けんた');
  await page.getByTestId('kk-done').click({ force: true });

  // じぶんで ことばを つくる
  await page.getByTestId('phrase-custom').click({ force: true });
  for (const k of ['ま', 'た', 'ね']) await page.getByTestId(`key-${k}`).click();
  await page.getByTestId('kk-tab-mark').click();
  await page.getByTestId('key-♡').click();
  await page.getByTestId('kk-done').click({ force: true });
  let [letter] = await letters(page);
  expect(letter.to).toBe('けんた');
  expect(letter.lines).toEqual(['またね♡']);
  await page.getByTestId('msg-next').click({ force: true });

  // 1もじ かいて やめる
  await expect(page.getByTestId('writing-pad')).toBeVisible();
  await drawKana(page, 'け');
  await expect(page.getByTestId('write-progress')).toHaveAttribute('data-done', '1', { timeout: 10_000 });
  await page.reload();
  await page.getByTestId('start-button').click({ force: true });
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'letters' }));
  await expect(page.getByTestId('letter-draft')).toHaveCount(1);
  await page.getByTestId('letter-draft').click({ force: true });
  await expect(page.getByTestId('write-progress')).toHaveAttribute('data-done', '1');
  expect(await currentChar(page)).toBe('ん');
  [letter] = await letters(page);
  expect(letter.posted).toBeUndefined();
  // つぎから あて名の こうほに でる
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'letterTo' }));
  await expect(page.getByTestId('to-recent')).toContainText('けんた');
});

test('おうちの方の 画面に てがみが でて、リセットで きえる', async ({ page }) => {
  const ink = {
    ch: 'ま',
    ink: [
      [
        [20, 30],
        [80, 30],
      ],
    ],
  };
  await prepare(page, seedProfile());
  await page.addInitScript((ink) => {
    if (localStorage.getItem('hiragana-bouken:letters')) return;
    localStorage.setItem(
      'hiragana-bouken:letters',
      JSON.stringify({
        letters: [
          {
            id: 'L1',
            created: 1,
            updated: 1,
            posted: 2,
            to: 'まま',
            from: '',
            lines: [],
            ink: { t0: ink, t1: ink, t2: { ...ink, ch: 'へ' } },
            paper: 'sora',
            color: 'ao',
            pen: 'pen',
            tate: true,
            stickers: [],
            seal: '⭐',
          },
        ],
        recent: [],
      }),
    );
  }, ink);
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  await passGate(page);
  await page.getByTestId('ptab-gallery').click();
  await expect(page.getByTestId('parent-letters')).toContainText('ままへ');
  await page.getByTestId('ptab-data').click();
  page.on('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: '記録をすべて消す' }).click();
  await expect.poll(async () => (await letters(page)).length).toBe(0);
});
