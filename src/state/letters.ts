/**
 * こどもが かいた てがみ (この iPad の なかだけに ほぞん)。
 * もじの 画は おおきいので、本体データとは べつの キーに ほぞんする (ギャラリーと おなじ)。
 */
import { useSyncExternalStore } from 'react';
import { letterSlots, type LetterText, type Slot } from '../lib/letterLayout';
import { PAPERS, findPaper, INKS, PENS, type InkId, type PaperId, type PenId } from '../data/letters';

/** 109 x 109 の ざひょうの 画 (小数1けた) */
export type Strokes = [number, number][][];

export interface LetterInk {
  ch: string;
  ink: Strokes;
  /** れんしゅうで かいた もじを つかった */
  practice?: boolean;
}

export interface LetterSticker {
  id: string;
  s: string;
  /** びんせんの なかの いち (%) */
  x: number;
  y: number;
  /** かたむき (ど) */
  r: number;
  /** おおきさ (1 = ふつう) */
  k: number;
}

export interface Letter extends LetterText {
  id: string;
  created: number;
  updated: number;
  /** ポストに いれた とき (なければ かきかけ) */
  posted?: number;
  /** あて名の しゅるい (RECIPIENTS の id / 'buddy' / 'custom') */
  toId?: string;
  /** かいた もじ (Slot の key ごと) */
  ink: Record<string, LetterInk>;
  paper: PaperId;
  color: InkId;
  pen: PenId;
  tate: boolean;
  stickers: LetterSticker[];
  /** ふうとうを とめた シール */
  seal: string;
}

interface LettersData {
  letters: Letter[];
  /** じぶんで いれた あて名 (あたらしい じゅん) */
  recent: string[];
}

const KEY = 'hiragana-bouken:letters';
const RECENT = 4;

let data: LettersData | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveFailed = false;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrokes = (v: unknown): v is Strokes =>
  Array.isArray(v) &&
  v.every(
    (s) =>
      Array.isArray(s) && s.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n))),
  );
const str = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def);
const num = (v: unknown, def = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : def);

/** こわれた データでも うごくように かたちを そろえる (よみこみ・バックアップから) */
export function normalizeLetter(v: unknown): Letter | null {
  if (!isObj(v) || typeof v.id !== 'string' || !v.id) return null;
  const ink: Record<string, LetterInk> = {};
  if (isObj(v.ink)) {
    for (const [k, e] of Object.entries(v.ink)) {
      if (isObj(e) && typeof e.ch === 'string' && isStrokes(e.ink))
        ink[k] = { ch: e.ch, ink: e.ink, ...(e.practice ? { practice: true } : {}) };
    }
  }
  const stickers: LetterSticker[] = Array.isArray(v.stickers)
    ? v.stickers
        .filter(isObj)
        .flatMap((s) =>
          typeof s.s === 'string' && s.s
            ? [
                {
                  id: str(s.id, Math.random().toString(36).slice(2, 8)),
                  s: s.s,
                  x: num(s.x, 50),
                  y: num(s.y, 50),
                  r: num(s.r),
                  k: num(s.k, 1),
                },
              ]
            : [],
        )
    : [];
  const created = num(v.created, Date.now());
  return {
    id: v.id,
    created,
    updated: num(v.updated, created),
    ...(typeof v.posted === 'number' ? { posted: v.posted } : {}),
    to: str(v.to),
    ...(typeof v.toId === 'string' ? { toId: v.toId } : {}),
    lines: Array.isArray(v.lines) ? v.lines.filter((l): l is string => typeof l === 'string') : [],
    from: str(v.from),
    ink,
    paper: findPaper(str(v.paper)).id,
    color: INKS.some((i) => i.id === v.color) ? (v.color as InkId) : findPaper(str(v.paper)).ink,
    pen: PENS.some((p) => p.id === v.pen) ? (v.pen as PenId) : 'crayon',
    tate: v.tate === true,
    stickers,
    seal: str(v.seal, '❤️'),
  };
}

function normalize(v: unknown): LettersData {
  if (!isObj(v)) return { letters: [], recent: [] };
  const letters = Array.isArray(v.letters) ? v.letters.map(normalizeLetter).filter((l): l is Letter => !!l) : [];
  const recent = Array.isArray(v.recent) ? v.recent.filter((r): r is string => typeof r === 'string' && !!r).slice(0, RECENT) : [];
  return { letters, recent };
}

function load(): LettersData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* noop */
  }
  return { letters: [], recent: [] };
}

const get = (): LettersData => (data ??= typeof localStorage !== 'undefined' ? load() : { letters: [], recent: [] });

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  try {
    localStorage.setItem(KEY, JSON.stringify(get()));
    saveFailed = false;
  } catch {
    // いっぱい (かおしゃしん などで ようりょうが たりない)。おうちの方の 画面で しらせる
    saveFailed = true;
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

function commit(next: LettersData, now = false) {
  data = next;
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  if (now) saveNow();
  else saveTimer = setTimeout(saveNow, 200);
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** あたらしい じゅん */
export function getLetters(): Letter[] {
  return get().letters;
}

export function getLetter(id: string): Letter | undefined {
  return get().letters.find((l) => l.id === id);
}

export function useLetters(): Letter[] {
  return useSyncExternalStore(subscribe, getLetters, getLetters);
}

export function useLetter(id: string): Letter | undefined {
  const all = useLetters();
  return all.find((l) => l.id === id);
}

export function lettersSaveFailed(): boolean {
  return saveFailed;
}

const clone = <T>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : (JSON.parse(JSON.stringify(v)) as T));

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** あたらしい てがみ (まだ なにも かいていない かきかけは すてる) */
export function createLetter(init: Pick<Letter, 'to' | 'from'> & Partial<Letter>): Letter {
  const now = Date.now();
  const paper = findPaper(init.paper ?? PAPERS[0].id);
  const letter: Letter = {
    id: newId(),
    created: now,
    updated: now,
    lines: [],
    ink: {},
    paper: paper.id,
    color: paper.ink,
    pen: paper.pen ?? 'crayon',
    tate: false,
    stickers: [],
    seal: '❤️',
    ...init,
  };
  const d = get();
  commit({ ...d, letters: [letter, ...d.letters.filter((l) => l.posted || Object.keys(l.ink).length > 0)] }, true);
  return letter;
}

export function updateLetter(id: string, fn: (l: Letter) => void): void {
  const d = get();
  const i = d.letters.findIndex((l) => l.id === id);
  if (i < 0) return;
  const next = clone(d.letters[i]);
  fn(next);
  next.updated = Date.now();
  const letters = d.letters.slice();
  letters[i] = next;
  commit({ ...d, letters });
}

export const roundStrokes = (strokes: readonly (readonly { x: number; y: number }[])[]): Strokes =>
  strokes.map((s) => s.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10] as [number, number]));

export function setLetterInk(id: string, slot: Slot, ink: Strokes, practice = false): void {
  updateLetter(id, (l) => {
    l.ink[slot.key] = { ch: slot.ch, ink, ...(practice ? { practice: true } : {}) };
  });
}

/** その マスに かいた もじ (もじが かわっていたら なし) */
export function inkOf(l: Letter, slot: Slot): LetterInk | null {
  const e = l.ink[slot.key];
  return e && e.ch === slot.ch ? e : null;
}

export function missingSlots(l: Letter): Slot[] {
  return letterSlots(l).filter((s) => !inkOf(l, s));
}

export function isLetterDone(l: Letter): boolean {
  return letterSlots(l).length > 0 && missingSlots(l).length === 0;
}

/** ぶんを かえて つかわなくなった もじを すてる */
export function pruneInk(l: Letter): void {
  const keep = new Set(
    letterSlots(l)
      .filter((s) => inkOf(l, s))
      .map((s) => s.key),
  );
  for (const k of Object.keys(l.ink)) if (!keep.has(k)) delete l.ink[k];
}

export function postLetter(id: string): void {
  updateLetter(id, (l) => {
    l.posted = Date.now();
  });
  saveNow();
}

export function deleteLetter(id: string): void {
  const d = get();
  commit({ ...d, letters: d.letters.filter((l) => l.id !== id) }, true);
}

export function recentNames(): string[] {
  return get().recent;
}

export function rememberName(name: string): void {
  const d = get();
  commit({ ...d, recent: [name, ...d.recent.filter((r) => r !== name)].slice(0, RECENT) });
}

/* ---------- バックアップ ---------- */

export function exportLetters(): LettersData {
  return get();
}

export function importLetters(v: unknown): void {
  if (v === undefined || v === null) return;
  commit(normalize(v), true);
}

export function clearLetters(): void {
  commit({ letters: [], recent: [] }, true);
}
