/** てがみの もじ (こどもが かいた 画) を えがく。109 x 109 の ざひょうの まま つかう */
import { polylineLength, resample, type Pt } from '../../lib/stroke';
import { RAINBOW, type PenId } from '../../data/letters';
import type { Strokes } from '../../state/letters';

type Tuple = readonly [number, number];

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** なめらかな せん (かく パッドと おなじ くふう: てんと てんの あいだを 2じ ベジェで つなぐ) */
export function smoothPath(pts: readonly Tuple[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${f1(pts[0][0])},${f1(pts[0][1])}l0.01,0`;
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${f1(pts[i][0])},${f1(pts[i][1])} ${f1(mx)},${f1(my)}`;
  }
  const l = pts[pts.length - 1];
  return `${d}L${f1(l[0])},${f1(l[1])}`;
}

/** とじた かたちを なめらかに */
function closedSmooth(pts: readonly Pt[]): string {
  const n = pts.length;
  if (n < 3) return '';
  const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${f1(start.x)},${f1(start.y)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += `Q${f1(p.x)},${f1(p.y)} ${f1(m.x)},${f1(m.y)}`;
  }
  return `${d}Z`;
}

/**
 * ふでの せん: はじめは すこし おさえて、まんなかは ふとく、おわりは すうっと ほそく。
 * ぬりつぶす かたち (アウトライン) を かえす
 */
export function brushPath(stroke: readonly Tuple[], width: number): string {
  const raw = stroke.map(([x, y]) => ({ x, y }));
  const len = polylineLength(raw);
  if (raw.length < 2 || len < 1) {
    const p = raw[0] ?? { x: 0, y: 0 };
    const r = width * 0.5;
    return `M${f1(p.x - r)},${f1(p.y)}a${f1(r)},${f1(r)} 0 1 0 ${f1(r * 2)},0a${f1(r)},${f1(r)} 0 1 0 ${f1(-r * 2)},0Z`;
  }
  const n = Math.max(4, Math.min(80, Math.ceil(len / 1.6)));
  const pts = resample(raw, n);
  // かるく ならす (てぶれを おさえる)
  const sm = pts.map((p, i) => {
    if (i === 0 || i === n - 1) return p;
    return { x: (pts[i - 1].x + p.x * 2 + pts[i + 1].x) / 4, y: (pts[i - 1].y + p.y * 2 + pts[i + 1].y) / 4 };
  });
  const short = len < 16;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = sm[Math.max(0, i - 1)];
    const b = sm[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const f = short ? 1 - t * 0.55 : t < 0.12 ? 0.78 + (t / 0.12) * 0.27 : t > 0.68 ? 1.05 - ((t - 0.68) / 0.32) * 0.8 : 1.05;
    const hw = (width / 2) * f;
    left.push({ x: sm[i].x + nx * hw, y: sm[i].y + ny * hw });
    right.push({ x: sm[i].x - nx * hw, y: sm[i].y - ny * hw });
  }
  // おわりは とがらせる
  const e = sm[n - 1];
  const e0 = sm[n - 2];
  const el = Math.hypot(e.x - e0.x, e.y - e0.y) || 1;
  const tip = { x: e.x + ((e.x - e0.x) / el) * width * 0.25, y: e.y + ((e.y - e0.y) / el) * width * 0.25 };
  // はじめは まるく
  const s = sm[0];
  const s1 = sm[1];
  const sl = Math.hypot(s1.x - s.x, s1.y - s.y) || 1;
  const back = { x: s.x - ((s1.x - s.x) / sl) * width * 0.42, y: s.y - ((s1.y - s.y) / sl) * width * 0.42 };
  return closedSmooth([...left, tip, ...right.reverse(), back]);
}

/** ペンの ふとさ (109 ざひょう) */
export const PEN_WIDTH: Record<PenId, number> = { crayon: 8.8, pen: 7.6, fude: 11 };

interface InkProps {
  strokes: Strokes;
  pen: PenId;
  color: string;
  /** にじいろ (1画ずつ いろを かえる)。offset で もじごとに ずらす */
  rainbow?: boolean;
  offset?: number;
  /** ちいさく した わりあい (せんの ふとさを そろえる) */
  k?: number;
}

export function InkStrokes({ strokes, pen, color, rainbow, offset = 0, k = 1 }: InkProps) {
  const w = PEN_WIDTH[pen] / k;
  return (
    <>
      {strokes.map((s, i) => {
        const c = rainbow ? RAINBOW[(offset + i) % RAINBOW.length] : color;
        return pen === 'fude' ? (
          <path key={i} d={brushPath(s, w)} fill={c} />
        ) : (
          <path key={i} d={smoothPath(s)} fill="none" stroke={c} strokeWidth={f1(w)} strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
    </>
  );
}

/**
 * クレヨン (なかは すこし かすれて、ふちは すこし ざらざら) と、よぞらで ひかる フィルター。
 * id-crayon / id-glow で つかう。w, h は つかう SVG の ざひょうの おおきさ
 */
export function InkFilters({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <>
      <filter id={`${id}-crayon`} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="4" result="fine" />
        <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.45" result="holes" />
        <feComposite in="SourceGraphic" in2="holes" operator="in" result="tex" />
        <feComponentTransfer in="SourceGraphic" result="soft">
          <feFuncA type="linear" slope="0.62" />
        </feComponentTransfer>
        <feMerge result="waxy">
          <feMergeNode in="soft" />
          <feMergeNode in="tex" />
        </feMerge>
        <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="9" result="edge" />
        <feDisplacementMap in="waxy" in2="edge" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id={`${id}-glow`} x="0" y="0" width={w} height={h} filterUnits="userSpaceOnUse">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </>
  );
}
