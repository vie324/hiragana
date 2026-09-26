/** がくしゅうの きろくと ごほうびの しょり */
import { update, getData, todayKey, type AppData } from './store';
import { answer, introduce, recordWrite } from '../lib/srs';
import { STICKERS, RARE } from '../data/stickers';
import { findNode, ALL_NODES } from '../data/curriculum';
import { findOutfit, type Outfit } from '../data/outfits';
import { weightedPick } from '../lib/random';

export interface RewardResult {
  stars: number;
  sticker: string;
  rare: boolean;
  /** きょう はじめての かつどう (スタンプ) */
  stamp: boolean;
  outfit?: Outfit;
  /** はじめて クリアした ノード */
  firstClear: boolean;
}

function day(d: AppData) {
  const k = todayKey();
  d.days[k] ??= { sec: 0, acts: 0, stamp: false };
  return d.days[k];
}

function drawSticker(d: AppData, bonusRare: boolean): string {
  const owned = d.stickers;
  return weightedPick(
    STICKERS,
    (x) => {
      const have = owned[x.s] ?? 0;
      const base = x.rare ? (bonusRare ? 6 : 1) : 6;
      // まだ もっていない シールが でやすい
      return base / (1 + have * 1.5);
    },
  ).s;
}

/** かつどうが おわったとき (ほし 1〜3) */
export function completeActivity(opts: { nodeId?: string; stars: number }): RewardResult {
  let result: RewardResult = { stars: opts.stars, sticker: '⭐', rare: false, stamp: false, firstClear: false };
  update((d) => {
    const today = day(d);
    today.acts += 1;
    const stamp = !today.stamp;
    today.stamp = true;

    let outfit: Outfit | undefined;
    let firstClear = false;
    const node = findNode(opts.nodeId);
    if (node && opts.nodeId) {
      const prev = d.nodes[opts.nodeId];
      firstClear = !prev;
      d.nodes[opts.nodeId] = {
        stars: Math.max(prev?.stars ?? 0, opts.stars),
        at: Date.now(),
        plays: (prev?.plays ?? 0) + 1,
      };
      if (node.kind === 'treasure' && node.outfit && !d.outfits.includes(node.outfit)) {
        d.outfits.push(node.outfit);
        outfit = findOutfit(node.outfit);
        d.wear = node.outfit;
      }
    }
    const sticker = drawSticker(d, node?.kind === 'treasure' || opts.stars >= 3);
    d.stickers[sticker] = (d.stickers[sticker] ?? 0) + 1;
    result = { stars: opts.stars, sticker, rare: RARE.has(sticker), stamp, outfit, firstClear };
  });
  return result;
}

export function markIntroduced(kana: string[]): void {
  const now = Date.now();
  update((d) => {
    for (const k of kana) d.kana[k] = introduce(d.kana[k], now);
  });
}

export function recordAnswer(kana: string, correct: boolean): void {
  const now = Date.now();
  update((d) => {
    d.kana[kana] = answer(d.kana[kana], correct, now);
  });
}

export function recordWord(word: string, correct: boolean): void {
  update((d) => {
    const w = d.words[word] ?? { ok: 0, ng: 0 };
    d.words[word] = correct ? { ...w, ok: w.ok + 1 } : { ...w, ng: w.ng + 1 };
  });
}

export function recordWriting(kana: string, stars: number): void {
  const now = Date.now();
  update((d) => {
    d.kana[kana] = recordWrite(d.kana[kana], stars, now);
  });
}

export function recordBookRead(id: string): void {
  update((d) => {
    const b = d.books[id] ?? { reads: 0, at: 0 };
    d.books[id] = { reads: b.reads + 1, at: Date.now() };
  });
}

/** あそんだ じかんを たす */
export function addPlaySeconds(sec: number): void {
  update((d) => {
    day(d).sec += sec;
  });
}

export function todaySeconds(): number {
  return getData().days[todayKey()]?.sec ?? 0;
}

/** きょう あそべる のこり びょう (せいげん なしは Infinity) */
export function remainingSeconds(): number {
  const d = getData();
  if (!d.settings.limitMin) return Infinity;
  const extra = d.extra[todayKey()] ?? 0;
  return (d.settings.limitMin + extra) * 60 - todaySeconds();
}

export function grantExtraMinutes(min: number): void {
  update((d) => {
    const k = todayKey();
    d.extra[k] = (d.extra[k] ?? 0) + min;
  });
}

export function isNodeDone(d: AppData, id: string): boolean {
  return !!d.nodes[id];
}

/** ノードが ひらいているか (ひとつ まえが おわっていれば OK) */
export function isNodeUnlocked(d: AppData, index: number): boolean {
  if (d.settings.unlockAll || index <= 0) return true;
  return !!d.nodes[ALL_NODES[index - 1].id] || !!d.nodes[ALL_NODES[index].id];
}

/** おぼえた (ならった or こたえた) もじ */
export function knownKana(d: AppData): Set<string> {
  const s = new Set<string>();
  for (const [k, p] of Object.entries(d.kana)) if (p.intro || p.box >= 1) s.add(k);
  return s;
}
