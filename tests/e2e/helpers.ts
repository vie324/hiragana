import { expect, type Page } from '@playwright/test';
import strokes from '../../src/data/strokes.json' with { type: 'json' };
import { flattenPath } from '../../src/lib/stroke';

type StrokeData = Record<string, { s: string[] }>;

/** よみあげを 一瞬で おわらせ、テスト用の フックを ひらく */
export async function prepare(page: Page, data?: unknown): Promise<void> {
  await page.addInitScript((seed) => {
    window.__HIRAGANA_FAST_SPEECH__ = true;
    window.__HIRAGANA_TEST__ = true;
    window.__HIRAGANA_SPOKEN__ = [];
    if (seed && !sessionStorage.getItem('seeded')) {
      localStorage.setItem('hiragana-bouken:data', JSON.stringify(seed));
      sessionStorage.setItem('seeded', '1');
    }
  }, data ?? null);
}

export function seedProfile(extra: Record<string, unknown> = {}) {
  return {
    v: 1,
    profile: { name: 'ゆい', suffix: 'ちゃん', avatar: '👧', buddy: 'usagi', buddyName: 'もこ', setup: true, created: 0 },
    ...extra,
  };
}

export async function start(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByTestId('start-button').click({ force: true });
}

/** お手本の 線を マウスで なぞる */
export async function drawKana(page: Page, kana: string, opts: { offset?: number } = {}): Promise<void> {
  const pad = page.getByTestId('writing-pad');
  const box = await pad.boundingBox();
  if (!box) throw new Error('pad not found');
  const data = (strokes as unknown as StrokeData)[kana];
  for (const d of data.s) {
    const pts = flattenPath(d, 10);
    const toScreen = (p: { x: number; y: number }) => ({
      x: box.x + ((p.x + (opts.offset ?? 0)) / 109) * box.width,
      y: box.y + ((p.y + (opts.offset ?? 0)) / 109) * box.height,
    });
    const first = toScreen(pts[0]);
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    for (const p of pts.slice(1)) {
      const s = toScreen(p);
      await page.mouse.move(s.x, s.y, { steps: 2 });
    }
    await page.mouse.up();
    await page.waitForTimeout(120);
  }
}

/** ごほうびを うけとって とじる */
export async function collectReward(page: Page): Promise<void> {
  const gift = page.getByTestId('gift');
  await expect(gift).toBeVisible({ timeout: 20_000 });
  await gift.click({ force: true });
  const ok = page.getByTestId('reward-ok');
  await expect(ok).toBeVisible({ timeout: 20_000 });
  await ok.click({ force: true });
}
