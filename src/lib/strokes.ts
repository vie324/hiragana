import data from '../data/strokes.json';
import { SYMBOL_STROKES } from '../data/symbolStrokes';
import { flattenPath, type Pt } from './stroke';

/**
 * 書き順データ。KanjiVG (https://kanjivg.tagaini.net) © Ulrich Apel, CC BY-SA 3.0
 * (てがみで つかう きごう ♡ ！ など は src/data/symbolStrokes.ts の オリジナル)
 */
interface RawStroke {
  s: string[];
  n: [number, number][];
  alt?: (string | null)[];
}

export interface KanaStrokes {
  kana: string;
  /** SVG path (109x109) */
  paths: string[];
  /** 折れ線に した 画 */
  points: Pt[][];
  /** 画番号を おく 位置 */
  numbers: Pt[];
  /** はんたいまわりでも よい 画 (まる など) */
  alts?: (Pt[] | null)[];
}

const raw: Record<string, RawStroke> = { ...(data as unknown as Record<string, RawStroke>), ...SYMBOL_STROKES };
const cache = new Map<string, KanaStrokes>();

export function hasStrokes(kana: string): boolean {
  return !!raw[kana];
}

export function getStrokes(kana: string): KanaStrokes | null {
  const hit = cache.get(kana);
  if (hit) return hit;
  const r = raw[kana];
  if (!r) return null;
  const v: KanaStrokes = {
    kana,
    paths: r.s,
    points: r.s.map((d) => flattenPath(d)),
    numbers: r.n.map(([x, y]) => ({ x, y })),
    alts: r.alt?.map((d) => (d ? flattenPath(d) : null)),
  };
  cache.set(kana, v);
  return v;
}
