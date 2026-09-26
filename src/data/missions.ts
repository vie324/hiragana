/**
 * きょうの ミッション (まいにち 3つ)。
 * 「ぼうけん」は まいにち。のこりの 2つは ひにちで かわる (おなじ ひは なんど ひらいても おなじ)。
 */
import type { Route } from '../state/router';

export type MissionKind = 'adventure' | 'write' | 'game' | 'book';

export interface Mission {
  kind: MissionKind;
  icon: string;
  /** いくつ やったら クリアか */
  goal: number;
  /** カードに だす みじかい なまえ */
  label: string;
  /** よみあげ (ふきだしにも だす) */
  say: string;
  /** その ミッションが できる メニュー */
  menu: 'map' | 'write' | 'play' | 'books';
  route: Route;
}

export const MISSIONS: Record<MissionKind, Mission> = {
  adventure: { kind: 'adventure', icon: '🗺️', goal: 2, label: 'ぼうけん', say: 'ぼうけんを 2かい すすもう!', menu: 'map', route: { name: 'map' } },
  write: { kind: 'write', icon: '✏️', goal: 3, label: 'かく', say: 'もじを 3かい かこう!', menu: 'write', route: { name: 'write' } },
  game: { kind: 'game', icon: '🎈', goal: 2, label: 'ゲーム', say: 'ゲームで 2かい あそぼう!', menu: 'play', route: { name: 'play' } },
  book: { kind: 'book', icon: '📚', goal: 1, label: 'えほん', say: 'えほんを いっさつ よもう!', menu: 'books', route: { name: 'books' } },
};

const OPTIONAL: MissionKind[] = ['write', 'game', 'book'];

/** ミッションを クリアした ときの けいけんち */
export const MISSION_XP = 5;
/** 3つ ぜんぶ クリアして たからばこを あけた ときの けいけんち */
export const CHEST_XP = 10;

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** その ひの ミッション (ぼうけん + ひにちで きまる 2つ) */
export function missionsFor(dateKey: string): Mission[] {
  const skip = OPTIONAL[hash(dateKey) % OPTIONAL.length];
  return [MISSIONS.adventure, ...OPTIONAL.filter((k) => k !== skip).map((k) => MISSIONS[k])];
}
