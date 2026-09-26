import { expect, test } from '@playwright/test';
import { openSettings, prepare, seedProfile, start } from './helpers';

test.use({
  permissions: ['camera'],
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

test('カメラで かおを とれる', async ({ page }) => {
  await prepare(page, seedProfile());
  await start(page);
  await openSettings(page);
  await page.getByTestId('face-add').click();
  await page.getByTestId('face-live').click();
  const shoot = page.getByTestId('face-shoot');
  await expect(shoot).toBeEnabled({ timeout: 15_000 });
  await shoot.click();
  await expect(page.getByTestId('face-adjust')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('face-save').click();
  await expect.poll(() => page.evaluate(() => window.__hiragana!.getData().faces.length)).toBe(1);
});
