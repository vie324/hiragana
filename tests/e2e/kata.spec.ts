import { expect, test } from '@playwright/test';
import { collectReward, drawKana, prepare, seedProfile, start } from './helpers';

const isKata = (s: string) => [...s].every((c) => /[ァ-ヺー]/.test(c));

test('カタカナに きりかえて 「ア」の レッスンを すすめる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.getByTestId('script-kata').click({ force: true });
  await expect(page.getByTestId('menu-chart')).toContainText('アイウエオ');
  await page.getByTestId('menu-map').click({ force: true });
  await page.getByTestId('node-k-a:lesson:ア').click({ force: true });

  await page.getByTestId('next').click({ force: true }); // もじ
  await page.getByTestId('next').click({ force: true }); // ことば
  await page.getByTestId('next').click({ force: true, timeout: 20_000 }); // かきじゅん
  await expect(page.getByTestId('writing-pad')).toBeVisible();
  await drawKana(page, 'ア');
  for (let i = 0; i < 2; i++) {
    const right = page.locator('[data-testid^="choice-"][data-answer="yes"]');
    await expect(right.first()).toBeVisible({ timeout: 20_000 });
    // まちがいの せんたくしも カタカナ
    const choices = await page.locator('[data-testid^="choice-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(7)));
    expect(choices.every(isKata), choices.join()).toBe(true);
    await right.first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(300);
  }
  await collectReward(page);

  await expect(page.getByTestId('node-k-a:lesson:ア')).toHaveClass(/done/);
  await expect(page.getByTestId('node-k-a:lesson:イ')).toHaveClass(/current/);
  const data = await page.evaluate(() => window.__hiragana!.getData());
  expect(data.kana['ア'].intro).toBe(true);
  expect(data.settings.script).toBe('kata');
  // ひらがなの マップは そのまま
  expect(data.nodes['a:lesson:あ']).toBeUndefined();
});

test('カタカナの ふうせんわり と ことばづくり', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'balloon', script: 'kata' }));
  for (let i = 0; i < 6; i++) {
    const kana = await page.locator('.balloon .balloon-kana').allTextContents();
    expect(kana.every(isKata), kana.join()).toBe(true);
    await page.locator('.balloon[data-answer="yes"]:not(.popped)').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(400);
  }
  await collectReward(page);

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'wordbuild', nodeId: 'k-sa:wordbuild:1' }));
  for (let round = 0; round < 4; round++) {
    const word = await page.locator('.wb-body').getAttribute('data-word', { timeout: 20_000 });
    expect(isKata(word!), word!).toBe(true);
    const units = await page.locator('.wb-body').getAttribute('data-units');
    for (const u of JSON.parse(units!)) {
      await page.locator(`.wb-tile:not(.used)[data-testid="tile-${u}"]`).first().click({ force: true });
      await page.waitForTimeout(80);
    }
    if (round < 3) await expect(page.locator('.wb-body')).not.toHaveAttribute('data-word', word!, { timeout: 20_000 });
  }
  await collectReward(page);
});

test('カタカナの とくべつ レッスン (のばす ぼう)', async ({ page }) => {
  await prepare(page, seedProfile({ settings: { script: 'kata' } }));
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'special', lessonId: 'k-long', nodeId: 'k-long:special:k-long' }));
  for (let i = 0; i < 5; i++) await page.getByTestId('next').click({ force: true, timeout: 20_000 });
  for (let i = 0; i < 8; i++) {
    const right = page.locator('[data-testid^="choice-"][data-answer="yes"]:not([disabled])');
    const gift = page.getByTestId('gift');
    await expect(right.or(gift).first()).toBeVisible({ timeout: 20_000 });
    if (await gift.isVisible()) break;
    await right.first().click({ force: true });
    await page.waitForTimeout(400);
  }
  await collectReward(page);
  const data = await page.evaluate(() => window.__hiragana!.getData());
  expect(data.nodes['k-long:special:k-long']).toBeDefined();
});

test('カタカナを かくすと きりかえが でない', async ({ page }) => {
  await prepare(page, seedProfile({ settings: { kata: false, script: 'kata' } }));
  await start(page);
  await expect(page.getByTestId('menu-map')).toBeVisible();
  await expect(page.getByTestId('script-kata')).toHaveCount(0);
  await expect(page.getByTestId('menu-chart')).toContainText('あいうえお');
});
