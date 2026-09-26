/** レベル・れんぞく にっすう・きょうの ミッション (けいさん だけ。ほぞんは actions.ts) */
import { todayKey, type DayRecord } from './store';
import { missionsFor, type Mission, type MissionKind } from '../data/missions';

export const MAX_LEVEL = 99;

/** レベル n から n+1 に あがるのに いる けいけんち */
export function xpToNext(level: number): number {
  return 8 + 4 * (level - 1);
}

export interface LevelInfo {
  level: number;
  /** いまの レベルで あつめた ぶん */
  into: number;
  /** つぎの レベルまでに いる ぶん */
  need: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp) || 0);
  while (level < MAX_LEVEL && rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

/** なんにち つづけて あそんでいるか (きょう まだなら きのうまで) */
export function streakDays(days: Record<string, DayRecord>, now = new Date()): number {
  let n = 0;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!days[todayKey(d)]?.acts) d.setDate(d.getDate() - 1);
  while (days[todayKey(d)]?.acts) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export interface MissionState extends Mission {
  count: number;
  done: boolean;
}

type Days = Record<string, DayRecord>;

export function missionStates(days: Days, key = todayKey()): MissionState[] {
  const day = days[key];
  return missionsFor(key).map((m) => {
    const count = Math.min(m.goal, day?.m?.[m.kind] ?? 0);
    return { ...m, count, done: count >= m.goal };
  });
}

/** クリアしたのに まだ 「クリア!」を いっていない ミッション */
export function unseenMissions(days: Days, key = todayKey()): MissionKind[] {
  const seen = days[key]?.seen ?? [];
  return missionStates(days, key)
    .filter((m) => m.done && !seen.includes(m.kind))
    .map((m) => m.kind);
}

export function allMissionsDone(days: Days, key = todayKey()): boolean {
  return missionStates(days, key).every((m) => m.done);
}

/** たからばこが あけられる (ぜんぶ クリアして まだ あけていない) */
export function chestReady(days: Days, key = todayKey()): boolean {
  return allMissionsDone(days, key) && !days[key]?.chest;
}

/** 「〇にち れんぞく」の よみ (ふつか・みっか…) */
const DAY_READING: Record<number, string> = {
  1: 'いちにち',
  2: 'ふつか',
  3: 'みっか',
  4: 'よっか',
  5: 'いつか',
  6: 'むいか',
  7: 'なのか',
  8: 'ようか',
  9: 'ここのか',
  10: 'とおか',
  14: 'じゅうよっか',
  20: 'はつか',
  24: 'にじゅうよっか',
};

export function daysReading(n: number): string {
  return DAY_READING[n] ?? `${n}にち`;
}

/** れんぞく にっすうを ほめる ひ (30にちまでは まいにち、そのあとは 10にち ごと) */
export function streakWorthPraising(n: number): boolean {
  return n >= 2 && n <= 400 && (n <= 30 || n % 10 === 0);
}
