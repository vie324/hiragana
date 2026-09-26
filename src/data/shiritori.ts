/** しりとりの ことばの つながりを つくる */
import { WORDS, lastSound, type Word } from './words';
import { pick, sample, defaultRng, type Rng } from '../lib/random';

const endsWithN = (w: Word) => w.w.endsWith('ん');

const POOL = WORDS.filter((w) => w.cat !== 'color' && w.cat !== 'shape' && [...w.w].length <= 6);

const byFirst = new Map<string, Word[]>();
for (const w of POOL) {
  const f = w.w[0];
  byFirst.set(f, [...(byFirst.get(f) ?? []), w]);
}

/** n かい つなげられる ことばの ならび (n+1 こ) */
export function makeChain(n: number, rng: Rng = defaultRng): Word[] {
  for (let attempt = 0; attempt < 300; attempt++) {
    const start = pick(
      POOL.filter((w) => !endsWithN(w)),
      rng,
    );
    const chain = [start];
    const used = new Set([start.w]);
    while (chain.length < n + 1) {
      const s = lastSound(chain[chain.length - 1].w);
      const cands = (byFirst.get(s) ?? []).filter((w) => !used.has(w.w) && !endsWithN(w));
      if (!cands.length) break;
      const next = pick(cands, rng);
      chain.push(next);
      used.add(next.w);
    }
    if (chain.length === n + 1) return chain;
  }
  throw new Error('しりとりの ことばが たりません');
}

/** まちがいの えらびかた: さいごの おとで はじまらない ことば */
export function shiritoriDistractors(sound: string, exclude: Set<string>, n: number, rng: Rng = defaultRng): Word[] {
  return sample(
    POOL.filter((w) => w.w[0] !== sound && !exclude.has(w.w)),
    n,
    rng,
  );
}
