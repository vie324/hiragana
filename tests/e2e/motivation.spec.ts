import { expect, test, type Page } from '@playwright/test';
import { collectReward, prepare, seedProfile, start } from './helpers';
import { missionsFor } from '../../src/data/missions';

function dayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function popBalloons(page: Page, n: number, after?: (i: number) => Promise<void>) {
  for (let i = 0; i < n; i++) {
    await page.locator('.balloon[data-answer="yes"]:not(.popped)').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(400);
    await after?.(i);
  }
}

test('ミッションを クリアして ホームの たからばこを あける', async ({ page }) => {
  const today = dayKey();
  const m: Record<string, number> = Object.fromEntries(missionsFor(today).map((x) => [x.kind, x.goal]));
  m.adventure = 1; // あと 1かい
  await prepare(page, seedProfile({ days: { [today]: { sec: 60, acts: 3, stamp: true, m } } }));
  await start(page);
  await expect(page.getByTestId('mission-adventure')).toHaveAttribute('data-count', '1');
  await expect(page.getByTestId('mission-chest')).toHaveAttribute('data-state', 'locked');

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'balloon', nodeId: 'a:balloon:1', kana: ['あ', 'い'] }));
  await popBalloons(page, 6);
  await page.getByTestId('gift').click({ force: true, timeout: 20_000 });
  await expect(page.getByTestId('reward-mission')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('reward-ok')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('reward-ok').click({ force: true });

  // ホームに もどると たからばこが あけられる
  await expect(page.getByTestId('mission-adventure')).toHaveAttribute('data-done', 'yes');
  await expect(page.getByTestId('mission-chest')).toHaveAttribute('data-state', 'ready');
  const before = await page.evaluate(() => Object.values(window.__hiragana!.getData().stickers).reduce((a, b) => a + b, 0));
  await page.getByTestId('mission-chest').click({ force: true });
  await expect(page.getByTestId('chest-sticker')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('chest-ok')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('chest-ok').click({ force: true });
  await expect(page.getByTestId('chest-overlay')).toHaveCount(0);
  await expect(page.getByTestId('mission-chest')).toHaveAttribute('data-state', 'open');
  const d = await page.evaluate(() => window.__hiragana!.getData());
  expect(d.days[today].chest).toBe(true);
  expect(Object.values(d.stickers).reduce((a, b) => a + b, 0)).toBe(before + 1);

  // もう いちど おしても もらえない
  await page.getByTestId('mission-chest').click({ force: true });
  await expect(page.getByTestId('chest-overlay')).toHaveCount(0);
});

test('もじの きに みが なって、みずを あげられる', async ({ page }) => {
  const p = { intro: true, box: 1, last: 1, ok: 1, ng: 0, write: 0, writeBest: 0 };
  await prepare(page, seedProfile({ kana: { あ: p, い: p, が: p } }));
  await start(page);
  await page.getByTestId('home-tree').click({ force: true });
  await expect(page.getByTestId('tree')).toHaveAttribute('data-count', '2');
  await expect(page.getByTestId('fruit-あ')).toBeVisible();
  await expect(page.getByTestId('flower-が')).toBeVisible();
  await expect(page.getByTestId('bud-う')).toBeVisible();
  await page.getByTestId('fruit-い').click({ force: true });

  await page.getByTestId('water').click({ force: true });
  await expect(page.getByTestId('water')).toHaveAttribute('data-watered', 'yes');
  const d = await page.evaluate(() => window.__hiragana!.getData());
  expect(d.days[dayKey()].water).toBe(true);
  expect(d.days[dayKey()].acts).toBe(0);
  expect(d.treeSeen).toEqual(expect.arrayContaining(['あ', 'い', 'が']));
});

test('れんぞく せいかいで コンボ、ごほうびで レベルアップと れんぞく にっすう', async ({ page }) => {
  await prepare(page, seedProfile({ xp: 6, days: { [dayKey(1)]: { sec: 60, acts: 2, stamp: true } } }));
  await start(page);
  await expect(page.getByTestId('level-badge')).toHaveAttribute('data-level', '1');
  await expect(page.getByTestId('streak-chip')).toHaveAttribute('data-streak', '1');

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'balloon', kana: ['あ', 'い'] }));
  await popBalloons(page, 6, async (i) => {
    if (i === 1) await expect(page.getByTestId('combo')).toHaveAttribute('data-combo', '2');
  });
  await page.getByTestId('gift').click({ force: true, timeout: 20_000 });
  await expect(page.getByTestId('reward-streak')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('levelup')).toHaveAttribute('data-level', '2', { timeout: 20_000 });
  await expect(page.getByTestId('combo')).toHaveCount(0);
  await expect(page.getByTestId('reward-ok')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('reward-ok').click({ force: true });

  await expect(page.getByTestId('level-badge')).toHaveAttribute('data-level', '2');
  await expect(page.getByTestId('streak-chip')).toHaveAttribute('data-streak', '2');
});

test('まちがえると コンボが きれる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'balloon', kana: ['あ', 'い'] }));
  await popBalloons(page, 2);
  await expect(page.getByTestId('combo')).toHaveAttribute('data-combo', '2');
  await page.locator('.balloon:not([data-answer="yes"])').first().click({ force: true });
  await expect(page.getByTestId('combo')).toHaveCount(0);
  await collectRewardLater(page);
});

async function collectRewardLater(page: Page) {
  await popBalloons(page, 4);
  await collectReward(page);
}
