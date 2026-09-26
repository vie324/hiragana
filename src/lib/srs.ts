/**
 * おぼえぐあいの きろく (かんたんな ライトナー方式)。
 * 箱 (box) 0〜5。ただしく こたえると 箱が あがり、つぎに でるまでの 間隔が のびる。
 */
import { weightedSample, type Rng, defaultRng } from './random';

export interface KanaProgress {
  /** レッスンで ならった */
  intro: boolean;
  box: number;
  /** さいごに こたえた じかん (ms) */
  last: number;
  ok: number;
  ng: number;
  /** かいた かいすう */
  write: number;
  /** かいた ほしの さいこう (0〜3) */
  writeBest: number;
}

export const emptyProgress = (): KanaProgress => ({ intro: false, box: 0, last: 0, ok: 0, ng: 0, write: 0, writeBest: 0 });

const HOUR = 3600_000;
/** 箱ごとの つぎに だすまでの じかん */
const INTERVAL = [0, 0, 10 * HOUR, 20 * HOUR, 68 * HOUR, 160 * HOUR];

export function isDue(p: KanaProgress | undefined, now: number): boolean {
  if (!p || p.box <= 1) return true;
  return now - p.last >= INTERVAL[Math.min(p.box, 5)];
}

export function introduce(p: KanaProgress | undefined, now: number): KanaProgress {
  const b = p ?? emptyProgress();
  return { ...b, intro: true, box: Math.max(b.box, 1), last: b.last || now };
}

export function answer(p: KanaProgress | undefined, correct: boolean, now: number): KanaProgress {
  const b = p ?? emptyProgress();
  if (correct) {
    const box = isDue(b, now) ? Math.min(5, b.box + 1) : Math.max(b.box, 1);
    return { ...b, box, ok: b.ok + 1, last: now };
  }
  return { ...b, box: Math.max(1, b.box - 1), ng: b.ng + 1, last: now };
}

export function recordWrite(p: KanaProgress | undefined, stars: number, now: number): KanaProgress {
  const b = p ?? emptyProgress();
  return { ...b, write: b.write + 1, writeBest: Math.max(b.writeBest, stars), last: b.last || now };
}

/** 50音表などに だす ほし (0〜3) */
export function masteryStars(p: KanaProgress | undefined): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  if (p.box >= 4 && p.writeBest >= 1) return 3;
  if (p.box >= 2 && p.ok >= 3) return 2;
  if (p.intro || p.box >= 1 || p.write > 0) return 1;
  return 0;
}

/** よめる と みなす (えほんの 「よめる!」 マークに つかう) */
export function isKnown(p: KanaProgress | undefined): boolean {
  return !!p && p.box >= 2;
}

/** ふくしゅうに だす もじを えらぶ */
export function pickForReview(
  progress: Record<string, KanaProgress | undefined>,
  pool: readonly string[],
  n: number,
  now: number,
  rng: Rng = defaultRng,
): string[] {
  return weightedSample(
    pool,
    n,
    (k) => {
      const p = progress[k];
      if (!p) return 2;
      const due = isDue(p, now) ? 3 : 1;
      const weak = p.ng > p.ok ? 2 : 0;
      return due * (6 - Math.min(p.box, 5)) + weak;
    },
    rng,
  );
}
