import { expect, test } from '@playwright/test';
import { collectReward, drawKana, prepare, seedProfile, start } from './helpers';

test('はじめての セットアップから ホームまで', async ({ page }) => {
  await prepare(page);
  await page.goto('./');
  await page.getByTestId('start-button').click({ force: true });
  await page.getByTestId('setup-name').fill('ゆい');
  await page.getByTestId('setup-next').click();
  await page.getByTestId('buddy-kuma').click({ force: true });
  await page.getByTestId('buddy-ok').click({ force: true });
  await expect(page.getByTestId('menu-map')).toBeVisible();
  await expect(page.getByTestId('menu-map')).toContainText('つぎは');

  // よみこみなおしても おぼえている
  await page.reload();
  await page.getByTestId('start-button').click({ force: true });
  await expect(page.getByTestId('menu-map')).toBeVisible();
  const buddy = await page.evaluate(() => window.__hiragana!.getData().profile.buddy);
  expect(buddy).toBe('kuma');
});

test('ひらがなを かかない なまえは エラー', async ({ page }) => {
  await prepare(page);
  await page.goto('./');
  await page.getByTestId('start-button').click({ force: true });
  await page.getByTestId('setup-name').fill('Yui');
  await expect(page.getByTestId('setup-next')).toBeDisabled();
});

test('「あ」の レッスンを さいごまで すすめる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.getByTestId('menu-map').click({ force: true });
  await page.getByTestId('node-a:lesson:あ').click({ force: true });

  await page.getByTestId('next').click({ force: true }); // もじ
  await page.getByTestId('next').click({ force: true }); // ことば
  await page.getByTestId('next').click({ force: true, timeout: 20_000 }); // かきじゅん

  await expect(page.getByTestId('writing-pad')).toBeVisible();
  await drawKana(page, 'あ');

  // さがす (2かい)
  for (let i = 0; i < 2; i++) {
    const right = page.locator('[data-testid^="choice-"][data-answer="yes"]');
    await right.first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(300);
  }
  await collectReward(page);

  // マップに もどって つぎの ノードが ひらく
  await expect(page.getByTestId('node-a:lesson:あ')).toHaveClass(/done/);
  await expect(page.getByTestId('node-a:lesson:い')).toHaveClass(/current/);
  const data = await page.evaluate(() => window.__hiragana!.getData());
  expect(data.kana['あ'].intro).toBe(true);
  expect(data.kana['あ'].write).toBe(1);
  expect(Object.values(data.stickers).reduce((a, b) => a + b, 0)).toBe(1);
});

test('かきじゅんと ちがう 線は はねられる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'writeKana', kana: 'い' }));
  const pad = page.getByTestId('writing-pad');
  await expect(pad).toHaveAttribute('data-stroke-index', '0');
  // みぎの 画を さきに かく → まちがい
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + (72 / 109) * box.width, box.y + (36 / 109) * box.height);
  await page.mouse.down();
  await page.mouse.move(box.x + (90 / 109) * box.width, box.y + (70 / 109) * box.height, { steps: 10 });
  await page.mouse.up();
  await expect(pad).toHaveAttribute('data-stroke-index', '0');
  // ただしく かけば すすむ
  await drawKana(page, 'い');
  await expect(page.locator('.write-result')).toBeVisible();
  const best = await page.evaluate(() => window.__hiragana!.getData().kana['い'].writeBest);
  expect(best).toBeGreaterThanOrEqual(2);
});

test('ふうせん わり ゲーム', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'balloon', kana: ['あ', 'い'] }));
  for (let i = 0; i < 6; i++) {
    await page.locator('.balloon[data-answer="yes"]:not(.popped)').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(400);
  }
  await collectReward(page);
});

test('ことばづくり と よめるかな', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'wordbuild', nodeId: 'sa:wordbuild:1' }));
  for (let round = 0; round < 4; round++) {
    const word = await page.locator('.wb-body').getAttribute('data-word', { timeout: 20_000 });
    expect(word).toBeTruthy();
    const units = await page.locator('.wb-body').getAttribute('data-units');
    for (const u of JSON.parse(units!)) {
      await page.locator(`.wb-tile:not(.used)[data-testid="tile-${u}"]`).first().click({ force: true });
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(600);
  }
  await collectReward(page);

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'readquiz', nodeId: 'sa:readquiz:1' }));
  for (let i = 0; i < 5; i++) {
    await page.locator('.pic-card[data-answer="yes"]').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(500);
  }
  await collectReward(page);
});

test('はじめの おと と カードめくり', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'firstsound', kana: ['か', 'き', 'く'] }));
  for (let i = 0; i < 5; i++) {
    await page.locator('.pic-card[data-answer="yes"]').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(500);
  }
  await collectReward(page);

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'memory', nodeId: 'ka:memory:1' }));
  const kanaCards = page.locator('[data-testid^="mem-kana-"]');
  const n = await kanaCards.count();
  for (let i = 0; i < n; i++) {
    const id = await kanaCards.nth(i).getAttribute('data-testid');
    const k = id!.replace('mem-kana-', '');
    await page.getByTestId(`mem-kana-${k}`).click({ force: true });
    await page.getByTestId(`mem-pic-${k}`).click({ force: true });
    await page.waitForTimeout(700);
  }
  await collectReward(page);
});

test('えほんを じぶんで さいごまで よむ', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.getByTestId('menu-books').click({ force: true });
  await page.getByTestId('book-osanpo').click({ force: true });
  await page.getByTestId('read-self').click({ force: true });
  await expect(page.getByTestId('page-text')).toContainText('ゆいちゃんと');
  await expect(page.getByTestId('page-text')).toContainText('もこは');
  for (let i = 0; i < 8; i++) {
    await page.getByTestId('page-next').click({ force: true });
    await page.waitForTimeout(200);
  }
  await expect(page.getByText('おしまい')).toBeVisible();
  const reads = await page.evaluate(() => window.__hiragana!.getData().books['osanpo']?.reads);
  expect(reads).toBe(1);
});

test('おうちの方の画面は けいさんで ひらく', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  // まちがえると ひらかない
  await page.getByTestId('gate-1').click();
  await page.getByTestId('gate-ok').click();
  await expect(page.getByTestId('gate-question')).toBeVisible();
  const ans = (await page.getByTestId('gate-question').getAttribute('data-answer'))!;
  for (const ch of ans) await page.getByTestId(`gate-${ch}`).click();
  await page.getByTestId('gate-ok').click();
  await expect(page.getByTestId('ptab-settings')).toBeVisible();
  await page.getByTestId('ptab-settings').click();
  const input = page.getByTestId('settings-name');
  await input.fill('はな');
  await input.blur();
  const name = await page.evaluate(() => window.__hiragana!.getData().profile.name);
  expect(name).toBe('はな');
});

test('シールを ドラッグして はる', async ({ page }) => {
  await prepare(page, seedProfile({ stickers: { '🐶': 2 } }));
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'stickers' }));
  const item = page.getByTestId('tray-🐶');
  const scene = page.getByTestId('sticker-scene');
  const a = (await item.boundingBox())!;
  const b = (await scene.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.5, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.sb-placed')).toHaveCount(1);
  const placed = await page.evaluate(() => window.__hiragana!.getData().placed['meadow']?.length);
  expect(placed).toBe(1);
});

test('しりとり', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.getByTestId('menu-play').click({ force: true });
  await page.getByTestId('game-shiritori').click({ force: true });
  for (let i = 0; i < 5; i++) {
    await page.locator('.sh-choice[data-answer="yes"]').first().click({ force: true, timeout: 20_000 });
    await page.waitForTimeout(500);
  }
  await collectReward(page);
});

test('たからばこで きせかえが もらえる', async ({ page }) => {
  const done = ['a:lesson:あ', 'a:lesson:い', 'a:balloon:1', 'a:lesson:う', 'a:lesson:え', 'a:lesson:お', 'a:firstsound:1', 'a:balloon:2'];
  const nodes = Object.fromEntries(done.map((id) => [id, { stars: 3, at: 1, plays: 1 }]));
  await prepare(page, seedProfile({ nodes }));
  await start(page);
  await page.getByTestId('menu-map').click({ force: true });
  await page.getByTestId('node-a:treasure').click({ force: true });
  await collectReward(page);
  const d = await page.evaluate(() => window.__hiragana!.getData());
  expect(d.outfits).toContain('ribbon');
  expect(d.wear).toBe('ribbon');
  await expect(page.getByTestId('node-a:treasure')).toHaveClass(/done/);
});

test('「みないで」モードでも かける', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'writeKana', kana: 'く' }));
  await page.getByTestId('mode-blank').click({ force: true });
  // さいしょは ヒント(みどりの まる)が でない
  await expect(page.locator('.start-dot')).toHaveCount(0);
  await drawKana(page, 'く');
  await expect(page.locator('.write-result')).toBeVisible();
});
