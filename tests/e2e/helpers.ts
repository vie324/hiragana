import { expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
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

/** 画面が すべりこむ アニメーションが おわるまで まつ (マウスで ざひょうを つかう まえに) */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const s = document.querySelector('.app > .screen');
    return !!s && s.getAnimations().every((a) => a.playState === 'finished');
  });
}

/**
 * 「つぎへ」を おす。ボタンは ポンと でてくる (ちいさい ところから おおきくなる) ので、
 * force で おすと まだ ちいさい うちに はずれることが ある。おちついて から ふつうに おす
 */
export async function tapNext(page: Page): Promise<void> {
  await page.getByTestId('next').click({ timeout: 20_000 });
}

export async function start(page: Page): Promise<void> {
  await page.goto('./');
  await page.getByTestId('start-button').click({ force: true });
}

/** お手本の 線を マウスで なぞる */
export async function drawKana(page: Page, kana: string, opts: { offset?: number } = {}): Promise<void> {
  await settled(page);
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

/** おうちの方の ゲート (けいさん) を とおる */
export async function passGate(page: Page): Promise<void> {
  await expect(page.getByTestId('gate-question')).toBeVisible();
  const ans = (await page.getByTestId('gate-question').getAttribute('data-answer'))!;
  for (const ch of ans) await page.getByTestId(`gate-${ch}`).click();
  await page.getByTestId('gate-ok').click();
  await expect(page.getByTestId('ptab-settings')).toBeVisible();
}

/** おうちの方の 画面の「せってい」を ひらく */
export async function openSettings(page: Page): Promise<void> {
  await page.evaluate(() => window.__hiragana!.navigate({ name: 'parent' }));
  await passGate(page);
  await page.getByTestId('ptab-settings').click();
}

/** テスト用の PNG (まんなかに まるい かお っぽい もよう) */
export function facePng(w = 96, h = 72): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const rows: number[] = [];
  for (let y = 0; y < h; y++) {
    rows.push(0);
    for (let x = 0; x < w; x++) {
      const inFace = (x - w / 2) ** 2 + (y - h / 2) ** 2 < (h / 2.4) ** 2;
      rows.push(...(inFace ? [255, 214, 170] : [120, 180, 255]));
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.from(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
