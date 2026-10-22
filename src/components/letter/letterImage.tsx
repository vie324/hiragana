/**
 * てがみを 画像 (JPEG / PNG) に する。おうちの方が 共有シートで おくったり、写真 App に のこしたり できる。
 * びんせんと もじは SVG を そのまま 画像に して (data URL なら canvas が よごれない)、
 * シール (えもじ・かおしゃしん) は canvas で うえから えがく。
 */
import { useLayoutEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import LetterPaper, { EMOJI_FONT, STICKER_SIZE, stickerPos } from './LetterPaper';
import { PAPER_H, PAPER_W } from '../../data/letters';
import type { Letter } from '../../state/letters';
import { getData } from '../../state/store';

/** えがきおわったら しらせる */
function Ready({ onReady, children }: { onReady: () => void; children: ReactNode }) {
  useLayoutEffect(() => onReady(), [onReady]);
  return <>{children}</>;
}

/** べつの ところで LetterPaper を えがいて、SVG の もじれつに する */
function svgMarkup(letter: Letter, width: number): Promise<string> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    const root = createRoot(host);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const el = host.querySelector('svg');
      resolve(el ? new XMLSerializer().serializeToString(el) : '');
      // えがいている とちゅうに けさないように つぎの タスクで
      setTimeout(() => root.unmount(), 0);
    };
    root.render(
      <Ready onReady={finish}>
        <LetterPaper letter={letter} mode="export" width={width} />
      </Ready>,
    );
    setTimeout(finish, 3000);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** てがみを canvas に えがく (width は よこの ピクセル) */
export async function renderLetterCanvas(letter: Letter, width = 1600): Promise<HTMLCanvasElement | null> {
  const height = Math.round((width * PAPER_H) / PAPER_W);
  const svg = await svgMarkup(letter, width);
  if (!svg) return null;
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  // Safari は よみこんだ すぐあとだと まだ えがけないことが あるので 1コマ まつ
  await frame();
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);

  const k = width / PAPER_W;
  const faces = getData().faces;
  for (const s of letter.stickers) {
    const p = stickerPos(s);
    ctx.save();
    ctx.translate(p.x * k, p.y * k);
    ctx.rotate((s.r * Math.PI) / 180);
    ctx.scale(s.k, s.k);
    if (s.s.startsWith('face:')) {
      const face = faces.find((f) => f.id === s.s.slice(5));
      if (face) {
        try {
          const im = await loadImage(face.img);
          const r = STICKER_SIZE * 0.5 * k;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, r + 7 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.clip();
          const side = Math.min(im.naturalWidth, im.naturalHeight);
          ctx.drawImage(im, (im.naturalWidth - side) / 2, (im.naturalHeight - side) / 2, side, side, -r, -r, r * 2, r * 2);
        } catch {
          /* よめない しゃしんは とばす */
        }
      }
    } else {
      ctx.font = `${STICKER_SIZE * k}px ${EMOJI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.s, 0, 0);
    }
    ctx.restore();
  }
  return c;
}

export async function renderLetterBlob(letter: Letter, width = 1600, type = 'image/png'): Promise<Blob | null> {
  try {
    const c = await renderLetterCanvas(letter, width);
    if (!c) return null;
    return await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), type, 0.92));
  } catch {
    return null;
  }
}

export function letterFileName(letter: Letter): string {
  const d = new Date(letter.posted ?? letter.created);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `tegami-${ymd}.jpg`;
}
