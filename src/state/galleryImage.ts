/**
 * こどもが かいた もじ (ギャラリー) を 1まいの 画像に する。
 * 共有シートの「画像を保存」で 写真 App に のこせる (成長の きろく)。
 */
import { galleryKanaList, getNameSamples, getSamples } from './gallery';
import { callName, getData, todayKey } from './store';

const W = 1200;
const PAD = 40;
const CELL = 110;
const KIDS = '"KleeKana", "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif';
const UI = '-apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawInk(ctx: CanvasRenderingContext2D, strokes: [number, number][][], x: number, y: number, size: number) {
  const k = size / 109;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf8';
  ctx.strokeStyle = '#f0e2d0';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, size - 2, size - 2, 12);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#f5dcc0';
  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.lineTo(size / 2, size - 6);
  ctx.moveTo(6, size / 2);
  ctx.lineTo(size - 6, size / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#e2691a';
  ctx.lineWidth = 6 * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.beginPath();
    s.forEach(([px, py], i) => (i ? ctx.lineTo(px * k, py * k) : ctx.moveTo(px * k, py * k)));
    ctx.stroke();
  }
  ctx.restore();
}

const md = (t: number) => `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}`;

export function hasGallery(): boolean {
  return galleryKanaList().length > 0 || getNameSamples().length > 0;
}

export async function renderGalleryImage(): Promise<Blob | null> {
  try {
    await document.fonts?.ready;
  } catch {
    /* noop */
  }
  const kana = galleryKanaList();
  const names = getNameSamples().slice(-6).reverse();
  // 1ぎょうに 2つの もじ (もじ + 4まい)
  const blockW = (W - PAD * 3) / 2;
  const rowH = CELL + 44;
  const nameRowH = 96 + 40;
  const H = PAD + 90 + (names.length ? 50 + names.length * nameRowH : 0) + (kana.length ? 50 + Math.ceil(kana.length / 2) * rowH : 0) + PAD;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#fff8ea';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4a3b33';
  ctx.textBaseline = 'top';
  ctx.font = `700 46px ${KIDS}`;
  ctx.fillText(`${callName(getData().profile)}の かいた もじ`, PAD, PAD);
  ctx.font = `400 22px ${UI}`;
  ctx.fillStyle = '#8d7d72';
  ctx.fillText(`${todayKey().replaceAll('-', '/')} ひらがな ぼうけん`, PAD, PAD + 58);
  let y = PAD + 90;

  if (names.length) {
    ctx.font = `700 28px ${UI}`;
    ctx.fillStyle = '#4a3b33';
    ctx.fillText('なまえ', PAD, y + 10);
    y += 50;
    for (const n of names) {
      n.chars.forEach((ch, i) => drawInk(ctx, ch.strokes, PAD + i * 100, y, 92));
      ctx.font = `400 20px ${UI}`;
      ctx.fillStyle = '#8d7d72';
      ctx.fillText(new Date(n.at).toLocaleDateString('ja-JP'), PAD, y + 100);
      y += nameRowH;
    }
  }

  if (kana.length) {
    ctx.font = `700 28px ${UI}`;
    ctx.fillStyle = '#4a3b33';
    ctx.fillText('もじ(左が はじめて かいた もじ)', PAD, y + 10);
    y += 50;
    kana.forEach((k, i) => {
      const x = PAD + (i % 2) * (blockW + PAD);
      const top = y + Math.floor(i / 2) * rowH;
      ctx.font = `700 64px ${KIDS}`;
      ctx.fillStyle = '#4a3b33';
      ctx.fillText(k, x, top + 18);
      getSamples(k)
        .slice(0, 4)
        .forEach((smp, j) => {
          const sx = x + 86 + j * (CELL + 8);
          drawInk(ctx, smp.strokes, sx, top, CELL);
          ctx.font = `400 18px ${UI}`;
          ctx.fillStyle = '#8d7d72';
          ctx.fillText(`${md(smp.at)} ${'★'.repeat(smp.stars)}`, sx + 4, top + CELL + 6);
        });
    });
  }
  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}
