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
  /** よみあげの 声: public/voice/<slug> (VOICEVOX) か 'tts' (iPad の 声) */
  voice: string;
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
  /** えほんに でてくる こどもの え (えもじ か 'face:<id>') */
  avatar: string;
  buddy: BuddyKind;
  buddyName: string;
  /** あいぼうの かおに する しゃしん (faces の id)。null なら どうぶつの かお */
  buddyFace: string | null;
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

/** かおしゃしん (この iPad の なかだけに ほぞん) */
export interface Face {
  id: string;
  /** まるく きりとる まえの しかくい JPEG (data URL) */
  img: string;
  at: number;
}

export const MAX_FACES = 4;

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
  faces: Face[];
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

/** 「うさぎの もこ だよ」の 「うさぎの」 */
export const BUDDY_KIND_SAY: Record<BuddyKind, string> = {
  usagi: 'うさぎの',
  kuma: 'くまの',
  neko: 'ねこの',
  hiyoko: 'ひよこの',
};

export function defaultData(): AppData {
  return {
    v: DATA_VERSION,
    profile: { name: '', suffix: 'ちゃん', avatar: '🧒', buddy: 'usagi', buddyName: 'もこ', buddyFace: null, setup: false, created: Date.now() },
    settings: {
      voice: 'zundamon',
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
    faces: [],
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
  merged.faces = merged.faces.filter((f) => f && typeof f.id === 'string' && typeof f.img === 'string' && f.img.startsWith('data:image/')).slice(0, MAX_FACES);
  const ids = new Set(merged.faces.map((f) => f.id));
  if (merged.profile.buddyFace && !ids.has(merged.profile.buddyFace)) merged.profile.buddyFace = null;
  if (merged.profile.avatar.startsWith('face:') && !ids.has(merged.profile.avatar.slice(5))) merged.profile.avatar = '🧒';
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

export function faceImg(d: AppData, id: string | null | undefined): string | null {
  return (id && d.faces.find((f) => f.id === id)?.img) || null;
}

/** あいぼうの かお (しゃしん) */
export function useBuddyFace(): string | null {
  return useApp((s) => faceImg(s, s.profile.buddyFace));
}

/** えほんに でてくる こどもの かお (しゃしんに したとき) */
export function useChildFace(): string | null {
  return useApp((s) => (s.profile.avatar.startsWith('face:') ? faceImg(s, s.profile.avatar.slice(5)) : null));
}

/** こどもの よびかた (なまえが なければ 「きみ」) */
export function callName(p: Profile): string {
  return p.name ? p.name + p.suffix : 'きみ';
}
