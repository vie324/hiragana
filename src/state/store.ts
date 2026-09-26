/**
 * アプリの データ (localStorage に ほぞん)。
 * React からは useApp(selector) で よむ。かきかえは update(fn)。
 */
import { useSyncExternalStore } from 'react';
import type { KanaProgress } from '../lib/srs';
import type { WriteLevel } from '../lib/stroke';

export type BuddyKind = 'usagi' | 'kuma' | 'neko' | 'hiyoko';
export type FingerMode = 'auto' | 'allow' | 'pen';

export interface Settings {
  voiceURI: string | null;
  rate: number;
  pitch: number;
  sfx: boolean;
  bgm: boolean;
  volume: number;
  writeLevel: WriteLevel;
  finger: FingerMode;
  /** 1日の あそべる ふん (0 = せいげん なし) */
  limitMin: number;
  unlockAll: boolean;
  /** ふきだしに もじを だす */
  caption: boolean;
}

export interface Profile {
  name: string;
  suffix: string;
  /** えほんに でてくる こどもの え */
  avatar: string;
  buddy: BuddyKind;
  buddyName: string;
  setup: boolean;
  created: number;
}

export interface NodeRecord {
  stars: number;
  at: number;
  plays: number;
}

export interface PlacedSticker {
  id: string;
  s: string;
  x: number;
  y: number;
  r: number;
  scale: number;
}

export interface DayRecord {
  sec: number;
  acts: number;
  stamp: boolean;
}

export interface AppData {
  v: number;
  profile: Profile;
  settings: Settings;
  kana: Record<string, KanaProgress>;
  nodes: Record<string, NodeRecord>;
  books: Record<string, { reads: number; at: number }>;
  words: Record<string, { ok: number; ng: number }>;
  /** もっている シールの かず (はったぶんも ふくむ) */
  stickers: Record<string, number>;
  placed: Record<string, PlacedSticker[]>;
  outfits: string[];
  wear: string | null;
  days: Record<string, DayRecord>;
  /** おうちのひとが のばした ふん (日付ごと) */
  extra: Record<string, number>;
}

export const DATA_VERSION = 1;
const KEY = 'hiragana-bouken:data';

export const BUDDY_DEFAULT_NAMES: Record<BuddyKind, string> = {
  usagi: 'もこ',
  kuma: 'ころ',
  neko: 'たま',
  hiyoko: 'ぴよ',
};

export function defaultData(): AppData {
  return {
    v: DATA_VERSION,
    profile: { name: '', suffix: 'ちゃん', avatar: '🧒', buddy: 'usagi', buddyName: 'もこ', setup: false, created: Date.now() },
    settings: {
      voiceURI: null,
      rate: 0.9,
      pitch: 1.1,
      sfx: true,
      bgm: true,
      volume: 0.8,
      writeLevel: 'easy',
      finger: 'auto',
      limitMin: 0,
      unlockAll: false,
      caption: true,
    },
    kana: {},
    nodes: {},
    books: {},
    words: {},
    stickers: {},
    placed: {},
    outfits: [],
    wear: null,
    days: {},
    extra: {},
  };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** たりない こうもくを デフォルトで おぎなう (かたが ちがう ものは すてる) */
function mergeDefaults<T>(def: T, input: unknown): T {
  if (!isObj(def) || !isObj(input)) {
    if (input === undefined || input === null) return def;
    if (typeof def === typeof input && Array.isArray(def) === Array.isArray(input)) return input as T;
    if (def === null) return input as T;
    return def;
  }
  const out: Obj = { ...(def as Obj) };
  for (const [k, v] of Object.entries(input)) {
    const d = (def as Obj)[k];
    out[k] = d === undefined ? v : mergeDefaults(d, v);
  }
  return out as T;
}

export function normalizeData(input: unknown): AppData {
  const merged = mergeDefaults(defaultData(), input);
  merged.v = DATA_VERSION;
  return merged;
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    return normalizeData(JSON.parse(raw));
  } catch {
    return defaultData();
  }
}

let state: AppData = typeof localStorage !== 'undefined' ? load() : defaultData();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ようりょう オーバーなど */
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && saveTimer) saveNow();
  });
  window.addEventListener('pagehide', () => {
    if (saveTimer) saveNow();
  });
}

export function getData(): AppData {
  return state;
}

/** データを かきかえる。fn の なかで draft を 直接 かえてよい */
const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : (JSON.parse(JSON.stringify(v)) as T));

export function update(fn: (draft: AppData) => void): void {
  const draft = clone(state);
  fn(draft);
  state = draft;
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}

/** まるごと いれかえる (よみこみ・リセット) */
export function replaceData(next: AppData): void {
  state = normalizeData(next);
  listeners.forEach((l) => l());
  saveNow();
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp<T>(selector: (s: AppData) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function exportJson(): string {
  return JSON.stringify(state, null, 1);
}

/** 保存領域を 消されにくく する (Safari) */
export function requestPersist(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* noop */
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** こどもの よびかた (なまえが なければ 「きみ」) */
export function callName(p: Profile): string {
  return p.name ? p.name + p.suffix : 'きみ';
}
