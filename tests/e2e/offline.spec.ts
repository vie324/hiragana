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
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('start-button')).toBeVisible();
  const manifest = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).ok);
  expect(manifest).toBe(true);
  await context.setOffline(false);
});
