/** ゲームで つかう もじ・ことばの えらびかた */
import { getData } from '../../state/store';
import { knownKana } from '../../state/actions';
import { stageOfNode, kanaUpToStage } from '../../data/curriculum';
import { BASIC_KANA, SEION } from '../../lib/kana';
import { WORDS, wordsWithin, type Word } from '../../data/words';
import { pickForReview } from '../../lib/srs';
import { shuffle, sample } from '../../lib/random';

const FALLBACK = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];

/** おぼえた もじ (すくなければ あ行・か行) */
export function knownPool(): string[] {
  const k = [...knownKana(getData())].filter((c) => BASIC_KANA.includes(c));
  return k.length >= 3 ? k : FALLBACK;
}

/** ゲームの もんだいに する もじ */
export function targetKana(explicit: string[] | undefined, count: number): string[] {
  const d = getData();
  const now = Date.now();
  if (explicit && explicit.length) {
    // ノードの もじ + ふくしゅう を すこし
    const base: string[] = [];
    while (base.length < count) base.push(...shuffle(explicit));
    const reviewPool = knownPool().filter((k) => !explicit.includes(k));
    const reviewN = reviewPool.length ? Math.min(2, Math.floor(count / 3)) : 0;
    const review = pickForReview(d.kana, reviewPool, reviewN, now);
    return shuffle([...base.slice(0, count - review.length), ...review]);
  }
  const pool = knownPool();
  const picked = pickForReview(d.kana, pool, Math.min(count, pool.length), now);
  const out = [...picked];
  while (out.length < count) out.push(...shuffle(pool));
  return out.slice(0, count);
}

/** まちがいの せんたくし */
export function distractors(target: string, n: number, prefer: string[] = []): string[] {
  const known = knownPool();
  const first = shuffle(prefer.filter((k) => k !== target));
  const rest = shuffle(known.filter((k) => k !== target && !first.includes(k)));
  const more = shuffle(SEION.filter((k) => k !== target && !first.includes(k) && !rest.includes(k)));
  return [...first, ...rest, ...more].slice(0, n);
}

/** ことばゲームで つかえる もじ */
export function wordKanaSet(nodeId?: string): Set<string> {
  const stage = nodeId ? stageOfNode(nodeId) : undefined;
  const set = new Set<string>(stage ? kanaUpToStage(stage.id) : [...knownKana(getData())]);
  if (!stage && set.size < 8) FALLBACK.forEach((k) => set.add(k));
  return set;
}

/** ことばを えらぶ (さいきん まちがえた ことばを おおめに) */
export function pickWords(nodeId: string | undefined, n: number, opts: { maxUnits?: number; minUnits?: number } = {}): Word[] {
  const set = wordKanaSet(nodeId);
  let words = wordsWithin(set, opts);
  if (words.length < n) words = wordsWithin(new Set([...set, ...FALLBACK, ...SEION]), opts);
  if (words.length < n) words = WORDS.filter((w) => [...w.w].length <= (opts.maxUnits ?? 4));
  const stats = getData().words;
  const scored = shuffle(words).sort((a, b) => {
    const sa = stats[a.w];
    const sb = stats[b.w];
    const va = sa ? sa.ok - sa.ng * 2 : -1;
    const vb = sb ? sb.ok - sb.ng * 2 : -1;
    return va - vb;
  });
  // すこし ランダムに
  return sample(scored.slice(0, Math.max(n * 3, 8)), n);
}

export function starsFromMistakes(mistakes: number, rounds: number): 1 | 2 | 3 {
  if (mistakes <= Math.floor(rounds / 5)) return 3;
  if (mistakes <= Math.ceil(rounds / 2)) return 2;
  return 1;
}
