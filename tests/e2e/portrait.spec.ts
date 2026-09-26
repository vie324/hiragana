import { expect, test } from '@playwright/test';
import { prepare, seedProfile, settled, start } from './helpers';

test.use({ viewport: { width: 820, height: 1180 } });

test('たてむきでも メニュー・50音表・かく画面が つかえる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  for (const id of ['menu-map', 'menu-write', 'menu-play', 'menu-books', 'menu-chart', 'menu-stickers']) {
    await expect(page.getByTestId(id)).toBeInViewport();
  }
  await page.getByTestId('menu-chart').click({ force: true });
  await settled(page);
  // たてむきでは 「あ」 が ひだりうえ、「お」 が そのみぎ に ならぶ
  const a = (await page.getByTestId('chart-あ').boundingBox())!;
  const o = (await page.getByTestId('chart-お').boundingBox())!;
  const n = (await page.getByTestId('chart-ん').boundingBox())!;
  expect(o.x).toBeGreaterThan(a.x);
  expect(Math.abs(o.y - a.y)).toBeLessThan(5);
  expect(n.y).toBeGreaterThan(a.y);
  await expect(page.getByTestId('chart-ん')).toBeInViewport();

  await page.evaluate(() => window.__hiragana!.navigate({ name: 'writeKana', kana: 'あ' }));
  await settled(page);
  const pad = (await page.getByTestId('writing-pad').boundingBox())!;
  expect(pad.width).toBeGreaterThan(560);
});
