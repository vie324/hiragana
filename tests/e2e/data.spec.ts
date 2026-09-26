import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { passGate, prepare, seedProfile, start } from './helpers';

const played = () =>
  seedProfile({
    stickers: { '🐶': 2 },
    days: { '2026-09-01': { sec: 300, acts: 3, stamp: true }, '2026-09-02': { sec: 200, acts: 2, stamp: true } },
  });

test('バックアップを ファイルに ほぞんして よみこみ、もとに もどせる', async ({ page }) => {
  page.on('dialog', (d) => void d.accept());
  await prepare(page, played());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  await passGate(page);

  // まだ バックアップが ないので おすすめが でる
  await expect(page.getByTestId('backup-remind')).toBeVisible();
  await page.getByTestId('ptab-data').click();
  await expect(page.getByTestId('save-status')).toContainText('Safari');

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('backup-save').click()]);
  expect(download.suggestedFilename()).toMatch(/^hiragana-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const text = readFileSync((await download.path())!, 'utf8');
  expect(JSON.parse(text)).toMatchObject({ app: 'hiragana-bouken', data: { profile: { name: 'ゆい' } } });

  // きろくが かわったあと、バックアップを よみこむ
  await page.evaluate(() =>
    window.__hiragana!.update((d) => {
      d.profile.name = 'かわった';
      d.stickers = {};
    }),
  );
  await page.getByTestId('backup-input').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.getByTestId('restore-confirm')).toContainText('ゆい');
  await page.getByTestId('restore-ok').click();
  await expect.poll(() => page.evaluate(() => window.__hiragana!.getData().profile.name)).toBe('ゆい');
  expect(await page.evaluate(() => window.__hiragana!.getData().stickers['🐶'])).toBe(2);

  // よみこむ まえに もどせる
  await page.getByTestId('undo').click();
  await expect.poll(() => page.evaluate(() => window.__hiragana!.getData().profile.name)).toBe('かわった');

  // バックアップ したので、つぎに ひらいたときは おすすめが でない
  await page.getByTestId('parent-close').click();
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  await passGate(page);
  await expect(page.getByTestId('ptab-settings')).toBeVisible();
  await expect(page.getByTestId('backup-remind')).toHaveCount(0);
});

test('こわれた ファイルは よみこまない', async ({ page }) => {
  await prepare(page, played());
  await start(page);
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  await passGate(page);
  await page.getByTestId('ptab-data').click();
  await page.getByTestId('backup-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"foo":1}') });
  await expect(page.getByText('読み込めませんでした')).toBeVisible();
  await expect(page.getByTestId('restore-confirm')).toHaveCount(0);
});
