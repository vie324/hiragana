/** がくしゅうの きろくと ごほうびの しょり */
import { update, getData, todayKey, type AppData } from './store';
import { answer, introduce, recordWrite } from '../lib/srs';
import { STICKERS, RARE } from '../data/stickers';
import { findNode, nodesOf } from '../data/curriculum';
import type { Script } from '../lib/kana';
import { findOutfit, type Outfit } from '../data/outfits';
import { weightedPick } from '../lib/random';
import { CHEST_XP, MISSION_XP, type MissionKind } from '../data/missions';
import { chestReady, levelInfo, streakDays, unseenMissions } from './progress';

/**
 * なにを した あとの ごほうびか (ミッションの かぞえかたに つかう)。
 * マップの ゲームは 「ぼうけん」と 「ゲーム」の りょうほうに かぞえる。'other' は どちらにも かぞえない
 */
export type ActivityKind = 'lesson' | 'game' | 'write' | 'book' | 'treasure' | 'other';

export interface RewardResult {
  stars: number;
  sticker: string;
  rare: boolean;
  /** きょう はじめての かつどう (スタンプ) */
  stamp: boolean;
  outfit?: Outfit;
  /** はじめて クリアした ノード */
  firstClear: boolean;
  /** もらった けいけんち */
  xp: number;
  /** レベルが あがったら あたらしい レベル */
  levelUp?: number;
  /** この かつどうで クリアした ミッション */
  missions: MissionKind[];
  /** きょうの ミッションが ぜんぶ おわった (たからばこが あけられる) */
  allMissions: boolean;
  /** きょう はじめての ときの れんぞく にっすう (それ いがいは 0) */
  streak: number;
}

function day(d: AppData) {
  const k = todayKey();
  d.days[k] ??= { sec: 0, acts: 0, stamp: false };
  return d.days[k];
}

function bumpMission(d: AppData, kind: MissionKind, n = 1): void {
  const today = day(d);
  today.m = { ...today.m, [kind]: (today.m?.[kind] ?? 0) + n };
}

/** 'bonus' = キラキラが でやすい, 'rare' = かならず キラキラ */
function drawSticker(d: AppData, mode: 'normal' | 'bonus' | 'rare'): string {
  const owned = d.stickers;
  const pool = mode === 'rare' ? STICKERS.filter((x) => x.rare) : STICKERS;
  return weightedPick(pool, (x) => {
    const have = owned[x.s] ?? 0;
    const base = x.rare ? (mode === 'normal' ? 1 : 6) : 6;
    // まだ もっていない シールが でやすい
    return base / (1 + have * 1.5);
  }).s;
}

/** けいけんちを たして、レベルが あがったら その レベルを かえす */
function gainXp(d: AppData, xp: number): number | undefined {
  const before = levelInfo(d.xp).level;
  d.xp = Math.max(0, (d.xp || 0) + xp);
  const after = levelInfo(d.xp).level;
  return after > before ? after : undefined;
}

/** かつどうが おわったとき (ほし 1〜3) */
export function completeActivity(opts: { nodeId?: string; stars: number; kind: ActivityKind }): RewardResult {
  let result: RewardResult = {
    stars: opts.stars,
    sticker: '⭐',
    rare: false,
    stamp: false,
    firstClear: false,
    xp: 0,
    missions: [],
    allMissions: false,
    streak: 0,
  };
  update((d) => {
    const today = day(d);
    today.acts += 1;
    const stamp = !today.stamp;
    today.stamp = true;

    // ミッション: マップの ノードは 「ぼうけん」、ゲーム・えほんは それぞれ
    if (opts.nodeId) bumpMission(d, 'adventure');
    if (opts.kind === 'game') bumpMission(d, 'game');
    if (opts.kind === 'book') bumpMission(d, 'book');
    const missions = unseenMissions(d.days);
    if (missions.length) today.seen = [...(today.seen ?? []), ...missions];

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
    const sticker = drawSticker(d, node?.kind === 'treasure' || opts.stars >= 3 ? 'bonus' : 'normal');
    d.stickers[sticker] = (d.stickers[sticker] ?? 0) + 1;
    const xp = Math.max(1, opts.stars) + missions.length * MISSION_XP;
    const levelUp = gainXp(d, xp);
    result = {
      stars: opts.stars,
      sticker,
      rare: RARE.has(sticker),
      stamp,
      outfit,
      firstClear,
      xp,
      levelUp,
      missions,
      allMissions: missions.length > 0 && chestReady(d.days),
      streak: stamp ? streakDays(d.days) : 0,
    };
  });
  return result;
}

export interface ChestResult {
  sticker: string;
  levelUp?: number;
}

/** きょうの ミッションの たからばこを あける (キラキラ シール + けいけんち) */
export function openMissionChest(): ChestResult | null {
  let out: ChestResult | null = null;
  update((d) => {
    if (!chestReady(d.days)) return;
    day(d).chest = true;
    const sticker = drawSticker(d, 'rare');
    d.stickers[sticker] = (d.stickers[sticker] ?? 0) + 1;
    out = { sticker, levelUp: gainXp(d, CHEST_XP) };
  });
  return out;
}

/**
 * ホームで 「クリア!」を いった ミッションを おぼえておく。
 * かく ミッションは ごほうびの がめんを とおらずに おわることが あるので、けいけんちも ここで わたす
 */
export function markMissionsSeen(kinds: MissionKind[]): { xp: number; levelUp?: number } {
  let out: { xp: number; levelUp?: number } = { xp: 0 };
  const seen = new Set(getData().days[todayKey()]?.seen ?? []);
  const fresh = [...new Set(kinds)].filter((k) => !seen.has(k));
  if (!fresh.length) return out;
  update((d) => {
    const today = day(d);
    today.seen = [...(today.seen ?? []), ...fresh];
    const xp = fresh.length * MISSION_XP;
    out = { xp, levelUp: gainXp(d, xp) };
  });
  return out;
}

/** もじの きで みた みを おぼえておく */
export function markTreeSeen(kana: string[]): void {
  const cur = new Set(getData().treeSeen);
  if (kana.every((k) => cur.has(k))) return;
  update((d) => {
    d.treeSeen = [...new Set([...d.treeSeen, ...kana])];
  });
}

/** もじの きに みずを あげる (1日 1かい)。あげられたら true */
export function waterTree(): boolean {
  let ok = false;
  update((d) => {
    const today = day(d);
    if (today.water) return;
    today.water = true;
    ok = true;
  });
  return ok;
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
    bumpMission(d, 'write');
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
export function isNodeUnlocked(d: AppData, index: number, script: Script = 'hira'): boolean {
  if (d.settings.unlockAll || index <= 0) return true;
  const nodes = nodesOf(script);
  return !!d.nodes[nodes[index - 1].id] || !!d.nodes[nodes[index].id];
}

/** おぼえた (ならった or こたえた) もじ */
export function knownKana(d: AppData): Set<string> {
  const s = new Set<string>();
  for (const [k, p] of Object.entries(d.kana)) if (p.intro || p.box >= 1) s.add(k);
  return s;
}
