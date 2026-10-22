/**
 * てがみの もじを びんせんに ならべる。
 * もじは マス (原稿用紙の ように 1もじ 1マス) に いれ、できるだけ おおきく、ことばの とちゅうで
 * ぎょうを かえないように する。よこがき (ひだり → みぎ、うえ → した) と たてがき
 * (うえ → した、みぎ → ひだり) に たいおう。
 */
import { getStrokes } from './strokes';
import type { Rect } from '../data/letters';

export interface LetterText {
  /** あて名 (「へ」は つけない)。くうはくなら かかない */
  to: string;
  /** ぶん (ことばの あいだは くうはく) */
  lines: string[];
  /** さしだしにん (「より」は つけない) */
  from: string;
}

export type PartKind = 'to' | 'body' | 'from';

/** てがみの 1もじ。key は ぎょうと なんもじめか (くうはくも かぞえる) */
export interface Slot {
  key: string;
  ch: string;
  part: PartKind;
}

export const toLine = (to: string): string => (to ? `${to}へ` : '');
export const fromLine = (from: string): string => (from ? `${from}より` : '');

interface Para {
  part: PartKind;
  prefix: string;
  text: string;
  end?: boolean;
}

function paras(t: LetterText): Para[] {
  const out: Para[] = [];
  if (t.to) out.push({ part: 'to', prefix: 't', text: toLine(t.to) });
  t.lines.forEach((text, n) => {
    if (text.trim()) out.push({ part: 'body', prefix: `b${n}.`, text });
  });
  if (t.from) out.push({ part: 'from', prefix: 'f', text: fromLine(t.from), end: true });
  return out;
}

/** かく じゅんばんに もじを ならべる (くうはくは のぞく) */
export function letterSlots(t: LetterText): Slot[] {
  return paras(t).flatMap((p) => [...p.text].flatMap((ch, i) => (ch === ' ' ? [] : [{ key: `${p.prefix}${i}`, ch, part: p.part }])));
}

/** ぎょうの はじめに こない もじ (ちいさい もじ・のばす ぼう・てん まる など) */
const NO_START = new Set([...'ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶー〜、。！？']);

export interface Cell extends Slot {
  x: number;
  y: number;
  /** マスの おおきさ */
  s: number;
  line: number;
  pos: number;
}

export interface Layout {
  tate: boolean;
  /** マスの おおきさ */
  s: number;
  /** ぎょう (たてがきは れつ) の かず */
  lines: number;
  /** 1ぎょうの マスの かず */
  per: number;
  /** ぎょうの かんかく */
  pitch: number;
  /** ぜんぶの ぎょうを かこむ しかく */
  grid: Rect;
  /** ぎょうごとの しかく */
  lineRects: Rect[];
  cells: Cell[];
  /** はいりきらなかった もじが ある */
  overflow: boolean;
}

export interface LayoutOptions {
  maxS?: number;
  minS?: number;
  /** ぎょうの あいだ (マスの おおきさに たいする わりあい) */
  gap?: number;
}

type Item = { slot: Slot | null; pos: number };
type GridLine = { items: Item[]; para: Para };

/** ぎょうに わける。breakWords が false なら ことばを わらない (はいらなければ null) */
function flow(list: Para[], per: number, breakWords: boolean): GridLine[] | null {
  const out: GridLine[] = [];
  for (const p of list) {
    const chars = [...p.text];
    // ことば (くうはくで くぎる) の はじまりと ながさ
    const words: { start: number; len: number }[] = [];
    let i = 0;
    while (i < chars.length) {
      if (chars[i] === ' ') {
        i++;
        continue;
      }
      let j = i;
      while (j < chars.length && chars[j] !== ' ') j++;
      words.push({ start: i, len: j - i });
      i = j;
    }
    let line: Item[] = [];
    let used = 0;
    const flush = () => {
      if (line.length) out.push({ items: line, para: p });
      line = [];
      used = 0;
    };
    const put = (idx: number) => {
      line.push({ slot: { key: `${p.prefix}${idx}`, ch: chars[idx], part: p.part }, pos: used });
      used++;
    };
    for (const w of words) {
      const gap = used > 0 ? 1 : 0;
      if (used + gap + w.len <= per) {
        used += gap;
        for (let k = 0; k < w.len; k++) put(w.start + k);
        continue;
      }
      if (w.len <= per) {
        flush();
        for (let k = 0; k < w.len; k++) put(w.start + k);
        continue;
      }
      if (!breakWords) return null;
      // ながい ことばは わる (ちいさい もじ などが ぎょうの はじめに こないように)
      flush();
      let k = 0;
      while (k < w.len) {
        let take = Math.min(per, w.len - k);
        if (k + take < w.len && NO_START.has(chars[w.start + k + take]) && take > 1) take--;
        for (let m = 0; m < take; m++) put(w.start + k + m);
        k += take;
        if (k < w.len) flush();
      }
    }
    flush();
  }
  return out;
}

/**
 * てがみを ならべる。area は もじを かく ところ (びんせんの ざひょう)。
 * いちばん おおきい マスで、ことばを わらずに はいる ならべかたを えらぶ。
 */
export function layoutLetter(t: LetterText, area: Rect, tate: boolean, opts: LayoutOptions = {}): Layout {
  const maxS = opts.maxS ?? 156;
  const minS = opts.minS ?? 44;
  const gapRatio = opts.gap ?? 0.3;
  const list = paras(t);
  const along = tate ? area.h : area.w;
  const across = tate ? area.w : area.h;

  let chosen: { s: number; per: number; lines: number; flow: GridLine[] } | null = null;
  for (const breakWords of [false, true]) {
    for (let s = maxS; s >= minS && !chosen; s -= 2) {
      const per = Math.floor(along / s);
      const lines = Math.floor((across + s * gapRatio) / (s * (1 + gapRatio)));
      if (per < 2 || lines < 1) continue;
      const f = flow(list, per, breakWords);
      if (f && f.length <= lines) chosen = { s, per, lines, flow: f };
    }
    if (chosen) break;
  }
  let overflow = false;
  if (!chosen) {
    // どうしても はいらない ときは いちばん ちいさい マスで はいる ぶんだけ
    const s = minS;
    const per = Math.max(2, Math.floor(along / s));
    const lines = Math.max(1, Math.floor((across + s * gapRatio) / (s * (1 + gapRatio))));
    chosen = { s, per, lines, flow: (flow(list, per, true) ?? []).slice(0, lines) };
    overflow = true;
  }

  const { s, per, lines } = chosen;
  const gap = s * gapRatio;
  const pitch = s + gap;
  const gridAlong = per * s;
  const gridAcross = lines * pitch - gap;
  const grid: Rect = tate
    ? { x: area.x + (area.w - gridAcross) / 2, y: area.y + (area.h - gridAlong) / 2, w: gridAcross, h: gridAlong }
    : { x: area.x + (area.w - gridAlong) / 2, y: area.y + (area.h - gridAcross) / 2, w: gridAlong, h: gridAcross };

  const lineRects: Rect[] = Array.from({ length: lines }, (_, i) =>
    tate ? { x: grid.x + grid.w - s - i * pitch, y: grid.y, w: s, h: grid.h } : { x: grid.x, y: grid.y + i * pitch, w: grid.w, h: s },
  );

  // ぎょうの わりあて: あて名の あとと さしだしにんの まえに あいている ぎょうを いれる
  const f = chosen.flow;
  const toCount = f.filter((g) => g.para.part === 'to').length;
  const fromCount = f.filter((g) => g.para.part === 'from').length;
  let spare = lines - f.length;
  const rows: number[] = [];
  let row = 0;
  f.forEach((_, i) => {
    if (i === toCount && toCount > 0 && spare > 0) {
      row++;
      spare--;
    }
    if (i === f.length - fromCount && fromCount > 0 && spare > 0) {
      // さしだしにんは いちばん さいごの ぎょう
      row = lines - fromCount;
    }
    rows.push(row);
    row++;
  });

  const cells: Cell[] = [];
  f.forEach((g, gi) => {
    const line = rows[gi];
    const len = g.items.length ? g.items[g.items.length - 1].pos + 1 : 0;
    const offset = g.para.end ? per - len : 0;
    const r = lineRects[line];
    for (const it of g.items) {
      if (!it.slot) continue;
      const pos = it.pos + offset;
      cells.push({
        ...it.slot,
        s,
        line,
        pos,
        x: tate ? r.x : r.x + pos * s,
        y: tate ? r.y + pos * s : r.y,
      });
    }
  });

  return { tate, s, lines, per, pitch, grid, lineRects, cells, overflow };
}

/* ---------- もじを マスに おく ---------- */

const SMALL = new Set([...'ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶ']);
const PUNCT = new Set(['、', '。']);
/** たてがきで よこに たおす もじ */
const ROTATE = new Set(['ー', '〜']);

const centers = new Map<string, { x: number; y: number }>();

/** お手本の もじの まんなか (109 ざひょう) */
function refCenter(ch: string): { x: number; y: number } {
  const hit = centers.get(ch);
  if (hit) return hit;
  const pts = getStrokes(ch)?.points.flat() ?? [];
  let c = { x: 54.5, y: 54.5 };
  if (pts.length) {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    c = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }
  centers.set(ch, c);
  return c;
}

/**
 * パッド (109 x 109) に かいた もじを マスに おく ときの SVG の transform (109 ざひょうの なかで)。
 * ちいさい もじ・てん まるは ちいさく して すみに よせ、たてがきの ー は たてに する。
 * k は ちぢめた わりあい (せんの ふとさを そろえる ため)。
 */
export function glyphTransform(ch: string, tate: boolean): { t: string; k: number } {
  if (SMALL.has(ch) || PUNCT.has(ch)) {
    const small = SMALL.has(ch);
    const k = small ? 0.68 : 0.5;
    const target = small ? (tate ? { x: 68, y: 40 } : { x: 44, y: 72 }) : tate ? { x: 80, y: 28 } : { x: 30, y: 82 };
    const c = refCenter(ch);
    return { t: `translate(${r1(target.x)} ${r1(target.y)}) scale(${k}) translate(${r1(-c.x)} ${r1(-c.y)})`, k };
  }
  if (tate && ROTATE.has(ch)) return { t: 'rotate(90 54.5 54.5)', k: 1 };
  return { t: '', k: 1 };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
