/** ゲームで つかう もじ・ことばの えらびかた */
import { currentScript, getData } from '../../state/store';
import { knownKana } from '../../state/actions';
import { stageOfNode, kanaUpToStage, scriptOfNode } from '../../data/curriculum';
import { basicKanaOf, scriptOf, seionOf, toKata, type Script } from '../../lib/kana';
import { wordsOf, wordsWithin, type Word } from '../../data/words';
import { pickForReview } from '../../lib/srs';
import { shuffle, sample } from '../../lib/random';

const FALLBACK_HIRA = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];
const FALLBACK: Record<Script, string[]> = { hira: FALLBACK_HIRA, kata: FALLBACK_HIRA.map(toKata) };

/**
 * ゲームで つかう もじの しゅるい:
 * はっきり きまっていれば それ、マップの ノードなら その マップ、もじが あれば その もじ、なければ ホームの きりかえ
 */
export function gameScript(explicit?: Script, nodeId?: string, kana?: string[]): Script {
  if (explicit) return explicit;
  if (nodeId) return scriptOfNode(nodeId);
  if (kana && kana.length) return scriptOf(kana.join(''));
  return currentScript();
}

/** おぼえた もじ (すくなければ ア行・カ行) */
export function knownPool(script: Script = 'hira'): string[] {
  const basic = basicKanaOf(script);
  const k = [...knownKana(getData())].filter((c) => basic.includes(c));
  return k.length >= 3 ? k : FALLBACK[script];
}

/** ゲームの もんだいに する もじ */
export function targetKana(explicit: string[] | undefined, count: number, script: Script = 'hira'): string[] {
  const d = getData();
  const now = Date.now();
  if (explicit && explicit.length) {
    // ノードの もじ + ふくしゅう を すこし
    const base: string[] = [];
    while (base.length < count) base.push(...shuffle(explicit));
    const reviewPool = knownPool(script).filter((k) => !explicit.includes(k));
    const reviewN = reviewPool.length ? Math.min(2, Math.floor(count / 3)) : 0;
    const review = pickForReview(d.kana, reviewPool, reviewN, now);
    return shuffle([...base.slice(0, count - review.length), ...review]);
  }
  const pool = knownPool(script);
  const picked = pickForReview(d.kana, pool, Math.min(count, pool.length), now);
  const out = [...picked];
  while (out.length < count) out.push(...shuffle(pool));
  return out.slice(0, count);
}

/** まちがいの せんたくし (こたえと おなじ しゅるいの もじから) */
export function distractors(target: string, n: number, prefer: string[] = []): string[] {
  const script = scriptOf(target);
  const known = knownPool(script);
  const first = shuffle(prefer.filter((k) => k !== target));
  const rest = shuffle(known.filter((k) => k !== target && !first.includes(k)));
  const more = shuffle(seionOf(script).filter((k) => k !== target && !first.includes(k) && !rest.includes(k)));
  return [...first, ...rest, ...more].slice(0, n);
}

/** ことばゲームで つかえる もじ */
export function wordKanaSet(nodeId?: string, script: Script = 'hira'): Set<string> {
  const stage = nodeId ? stageOfNode(nodeId) : undefined;
  const set = new Set<string>(stage ? kanaUpToStage(stage.id) : [...knownKana(getData())]);
  if (!stage && [...set].filter((k) => scriptOf(k) === script).length < 8) FALLBACK[script].forEach((k) => set.add(k));
  // カタカナの ことばは のばす ぼう「ー」が おおいので、いつも つかえる ことに する
  if (script === 'kata') set.add('ー');
  return set;
}

/** ことばを えらぶ (さいきん まちがえた ことばを おおめに) */
export function pickWords(nodeId: string | undefined, n: number, opts: { maxUnits?: number; minUnits?: number } = {}, script: Script = 'hira'): Word[] {
  const set = wordKanaSet(nodeId, script);
  let words = wordsWithin(set, opts, script);
  if (words.length < n) words = wordsWithin(new Set([...set, ...FALLBACK[script], ...seionOf(script), 'ー']), opts, script);
  if (words.length < n) words = wordsOf(script).filter((w) => [...w.w].length <= (opts.maxUnits ?? 4));
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
