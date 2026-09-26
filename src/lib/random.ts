export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

/** 再現性のある乱数 (テスト用) */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng = defaultRng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: readonly T[], n: number, rng: Rng = defaultRng): T[] {
  return shuffle(arr, rng).slice(0, Math.max(0, n));
}

export function pick<T>(arr: readonly T[], rng: Rng = defaultRng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 重み付きで 1つ えらぶ (重み 0 以下は えらばれない。全部 0 なら 均等) */
export function weightedPick<T>(items: readonly T[], weight: (t: T) => number, rng: Rng = defaultRng): T {
  const ws = items.map((t) => Math.max(0, weight(t)));
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return pick(items, rng);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** 重み付きで 重複なしに n こ えらぶ */
export function weightedSample<T>(items: readonly T[], n: number, weight: (t: T) => number, rng: Rng = defaultRng): T[] {
  const rest = items.slice();
  const out: T[] = [];
  while (out.length < n && rest.length) {
    const t = weightedPick(rest, weight, rng);
    out.push(t);
    rest.splice(rest.indexOf(t), 1);
  }
  return out;
}
