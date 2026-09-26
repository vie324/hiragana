import { expect, test } from '@playwright/test';
import { facePng, openSettings, prepare, seedProfile, start } from './helpers';

test('かおしゃしんを いれると、あいぼう・えほん・シールに なる', async ({ page }) => {
  await prepare(page, seedProfile({ stickers: {} }));
  await start(page);
  await openSettings(page);

  await page.getByTestId('face-add').click();
  await page.getByTestId('face-input').setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: facePng() });
  const adjust = page.getByTestId('face-adjust');
  await expect(adjust).toBeVisible();
  // ゆびで うごかせる
  const box = (await adjust.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 10, { steps: 5 });
  await page.mouse.up();
  await page.getByTestId('face-save').click();

  const d = await page.evaluate(() => window.__hiragana!.getData());
  expect(d.faces).toHaveLength(1);
  expect(d.faces[0].img).toMatch(/^data:image\/jpeg;base64,/);
  // はじめての しゃしんは あいぼうと えほんの こどもに なる
  expect(d.profile.buddyFace).toBe(d.faces[0].id);
  expect(d.profile.avatar).toBe(`face:${d.faces[0].id}`);

  // ホームの あいぼうの かおが しゃしんに なる
  await page.getByTestId('parent-close').click();
  await page.evaluate(() => window.__hiragana!.resetTo({ name: 'home' }));
  await expect(page.locator('.home-screen .mascot .m-photo')).toHaveCount(1);

  // えほんに でてくる こどもが しゃしんに なる
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'book', id: 'osanpo' }));
  await page.getByTestId('read-self').click({ force: true });
  await expect(page.locator('.scene .face-badge').first()).toBeVisible();

  // きせかえで どうぶつの かおに もどせる
  await page.evaluate(() => window.__hiragana!.resetTo({ name: 'dressup' }));
  const faces = page.getByTestId('closet-faces');
  await expect(faces).toBeVisible();
  await faces.getByRole('button', { name: 'どうぶつの かお' }).click();
  await expect(page.locator('.dressup-stage .m-photo')).toHaveCount(0);
  await faces.getByRole('button', { name: 'しゃしんの かお' }).click();
  await expect(page.locator('.dressup-stage .m-photo')).toHaveCount(1);

  // シールちょうで かおの シールを はれる (なんまいでも)
  await page.evaluate(() => window.__hiragana!.resetTo({ name: 'stickers' }));
  const tray = page.getByTestId(`tray-face:${d.faces[0].id}`);
  await tray.click();
  await tray.click();
  await expect(page.locator('.sb-placed .face-badge')).toHaveCount(2);
});
