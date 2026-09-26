import { expect, test } from '@playwright/test';
import { prepare, seedProfile, start } from './helpers';

test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

test('えほんを よんで ろくおんし、きいてみる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'book', id: 'doubutsu' }));
  await page.getByTestId('read-self').click({ force: true });
  const rec = page.getByTestId('record');
  await expect(rec).toBeVisible();
  await rec.click({ force: true });
  await expect(rec).toHaveClass(/recording/);
  await page.waitForTimeout(1200);
  await rec.click({ force: true });
  // さいせいが おわると ほめてくれる
  await expect(rec).not.toHaveClass(/recording/);
  await expect
    .poll(() => page.evaluate(() => window.__HIRAGANA_SPOKEN__?.includes('じょうずに よめたね!')), { timeout: 15_000 })
    .toBe(true);
  await expect(rec).not.toHaveClass(/playing/);
});
