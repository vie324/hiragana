/**
 * てがみ の データ: だれに・なんて かくか・びんせん・ペン・ふうとうの シール。
 * びんせんの え は src/components/letter/PaperArt.tsx、ならべかたは src/lib/letterLayout.ts。
 */
import { hasStrokes } from '../lib/strokes';
import { sayKana, type Script } from '../lib/kana';

/* ---------- だれに ---------- */

export interface Recipient {
  id: string;
  /** てがみに かく なまえ */
  label: string;
  /** カタカナで まなんでいる ときの かきかた (まま → ママ) */
  kata?: string;
  emoji: string;
  /** カードの いろ */
  color: string;
}

export const RECIPIENTS: Recipient[] = [
  { id: 'mama', label: 'まま', kata: 'ママ', emoji: '👩', color: '#ff8fb1' },
  { id: 'papa', label: 'ぱぱ', kata: 'パパ', emoji: '👨', color: '#5fb4ff' },
  { id: 'okaasan', label: 'おかあさん', emoji: '👩‍🦰', color: '#ff9f6b' },
  { id: 'otousan', label: 'おとうさん', emoji: '👨‍🦱', color: '#5cc489' },
  { id: 'baba', label: 'おばあちゃん', emoji: '👵', color: '#b79bff' },
  { id: 'jiji', label: 'おじいちゃん', emoji: '👴', color: '#62bdb6' },
  { id: 'nii', label: 'おにいちゃん', emoji: '👦', color: '#6aa2ff' },
  { id: 'nee', label: 'おねえちゃん', emoji: '👧', color: '#ff86c0' },
  { id: 'sensei', label: 'せんせい', emoji: '🧑‍🏫', color: '#ffad3b' },
  { id: 'tomo', label: 'おともだち', emoji: '🧒', color: '#e9b81f' },
];

export function recipientLabel(r: Recipient, script: Script): string {
  return script === 'kata' && r.kata ? r.kata : r.label;
}

/* ---------- なんて かく ---------- */

export interface Phrase {
  id: string;
  /** ことばの あいだは くうはく (わかちがき) */
  text: string;
  emoji: string;
}

export const PHRASES: Phrase[] = [
  { id: 'daisuki', text: 'だいすき', emoji: '💗' },
  { id: 'itsumo', text: 'いつも ありがとう', emoji: '🌷' },
  { id: 'arigatou', text: 'ありがとう', emoji: '😊' },
  { id: 'tanjoubi', text: 'おたんじょうび おめでとう', emoji: '🎂' },
  { id: 'omedetou', text: 'おめでとう', emoji: '🎉' },
  { id: 'genki', text: 'げんきですか', emoji: '🌞' },
  { id: 'asobou', text: 'また あそぼうね', emoji: '🧸' },
  { id: 'kitene', text: 'あそびに きてね', emoji: '🏠' },
  { id: 'aitai', text: 'あいたいな', emoji: '🥺' },
  { id: 'shigoto', text: 'おしごと がんばってね', emoji: '💪' },
  { id: 'nakayoku', text: 'なかよく してね', emoji: '🤝' },
  { id: 'gomen', text: 'ごめんね', emoji: '🙏' },
  { id: 'oyasumi', text: 'おやすみなさい', emoji: '🌙' },
  { id: 'genkide', text: 'ずっと げんきでね', emoji: '🍵' },
  { id: 'akemashite', text: 'あけまして おめでとう', emoji: '🎍' },
  { id: 'xmas', text: 'メリー クリスマス', emoji: '🎄' },
];

/** ぶんは 4ぎょう まで、1ぎょう 16もじ まで */
export const MAX_LINES = 4;
export const MAX_LINE_CHARS = 16;
export const MAX_NAME_CHARS = 8;

/* ---------- つかえる もじ ---------- */

/** てがみに かける きごう (かきじゅんは src/data/symbolStrokes.ts) */
export const LETTER_SYMBOLS = ['ー', '〜', '、', '。', '！', '？', '♡'] as const;

const SYMBOL_SAY: Record<string, string> = {
  '、': 'てん',
  '。': 'まる',
  '！': 'びっくり マーク',
  '？': 'はてな マーク',
  '♡': 'ハート',
  '〜': 'なみせん',
};

/** よみあげ用: もじ・きごうの よみかた */
export function sayLetterChar(ch: string): string {
  return SYMBOL_SAY[ch] ?? sayKana(ch);
}

/** にゅうりょくの ゆれを そろえる (!→！ など) */
export function normalizeLetterText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/!/g, '！')
    .replace(/\?/g, '？')
    .replace(/[～~]/g, '〜')
    .replace(/[♥❤]️?/gu, '♡')
    .replace(/[\s　]+/g, ' ')
    .trim();
}

/** てがみに かける もじか (かきじゅんが ある もの と くうはく) */
export function isLetterChar(ch: string): boolean {
  return ch === ' ' || hasStrokes(ch);
}

/* ---------- びんせん ---------- */

export type PaperId = 'sakura' | 'sora' | 'mori' | 'umi' | 'yozora' | 'ichigo' | 'oiwai' | 'genko';
export type GuideStyle = 'line' | 'grid' | 'genko';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PaperDef {
  id: PaperId;
  name: string;
  emoji: string;
  /** くらい びんせん (あかるい いろの ペンを つかう) */
  dark?: boolean;
  /** もじを かく ところ (びんせんは 1000 x 1414) */
  area: Rect;
  guide: GuideStyle;
  /** マス・せんの いろ */
  guideColor: string;
  /** かいていない マスに うすく だす もじの いろ */
  hintColor: string;
  ink: InkId;
  pen?: PenId;
  /** ひづけ */
  date: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; color: string };
  /** ふうとうの いろ */
  envelope: { body: string; edge: string; flap: string; liner: string };
}

/** びんせんの おおきさ (A かみ と おなじ たてよこ) */
export const PAPER_W = 1000;
export const PAPER_H = 1414;

export const PAPERS: PaperDef[] = [
  {
    id: 'sakura',
    name: 'さくら',
    emoji: '🌸',
    area: { x: 112, y: 214, w: 776, h: 1030 },
    guide: 'line',
    guideColor: '#f4a9bf',
    hintColor: '#f6d3dd',
    ink: 'pink',
    date: { x: 112, y: 1318, anchor: 'start', color: '#d9819b' },
    envelope: { body: '#ffe3ea', edge: '#f7b8c8', flap: '#ffd3df', liner: '#ff9fb9' },
  },
  {
    id: 'sora',
    name: 'そら',
    emoji: '☁️',
    area: { x: 112, y: 300, w: 776, h: 960 },
    guide: 'line',
    guideColor: '#8fcbef',
    hintColor: '#cfe7f6',
    ink: 'ao',
    date: { x: 888, y: 1330, anchor: 'end', color: '#5aa7d6' },
    envelope: { body: '#dff2ff', edge: '#a9d6f5', flap: '#cbe9ff', liner: '#7cc4f2' },
  },
  {
    id: 'mori',
    name: 'もり',
    emoji: '🍄',
    area: { x: 124, y: 214, w: 752, h: 1004 },
    guide: 'grid',
    guideColor: '#b9dba5',
    hintColor: '#dcecd2',
    ink: 'midori',
    date: { x: 500, y: 1306, anchor: 'middle', color: '#6aa25a' },
    envelope: { body: '#eef6dc', edge: '#bcd99c', flap: '#e1efc6', liner: '#8cc56c' },
  },
  {
    id: 'umi',
    name: 'うみ',
    emoji: '🐳',
    area: { x: 112, y: 170, w: 776, h: 960 },
    guide: 'line',
    guideColor: '#8ccfee',
    hintColor: '#cde9f6',
    ink: 'ao',
    date: { x: 112, y: 108, anchor: 'start', color: '#4f9fcf' },
    envelope: { body: '#e3f5ff', edge: '#97d2f0', flap: '#cdecff', liner: '#4fb0e6' },
  },
  {
    id: 'yozora',
    name: 'よぞら',
    emoji: '🌙',
    dark: true,
    area: { x: 112, y: 250, w: 776, h: 950 },
    guide: 'line',
    guideColor: 'rgba(255, 228, 160, 0.45)',
    hintColor: 'rgba(255, 255, 255, 0.16)',
    ink: 'kin',
    date: { x: 112, y: 1392, anchor: 'start', color: 'rgba(255, 230, 170, 0.85)' },
    envelope: { body: '#2c2f6b', edge: '#1d1f4d', flap: '#363a7d', liner: '#ffd66b' },
  },
  {
    id: 'ichigo',
    name: 'いちご',
    emoji: '🍓',
    area: { x: 150, y: 200, w: 700, h: 1010 },
    guide: 'grid',
    guideColor: '#f6b8b2',
    hintColor: '#f9dcd8',
    ink: 'aka',
    date: { x: 500, y: 1290, anchor: 'middle', color: '#e0726b' },
    envelope: { body: '#fff1ec', edge: '#f5b7ad', flap: '#ffe0d8', liner: '#ef5f5f' },
  },
  {
    id: 'oiwai',
    name: 'おいわい',
    emoji: '🎉',
    area: { x: 112, y: 300, w: 776, h: 930 },
    guide: 'line',
    guideColor: '#f1c35e',
    hintColor: '#f6e3b4',
    ink: 'murasaki',
    date: { x: 500, y: 1318, anchor: 'middle', color: '#d8a23c' },
    envelope: { body: '#fff5d6', edge: '#f1d088', flap: '#ffeab0', liner: '#ff8a6b' },
  },
  {
    id: 'genko',
    name: 'げんこう',
    emoji: '📝',
    area: { x: 96, y: 150, w: 808, h: 1140 },
    guide: 'genko',
    guideColor: '#e3765c',
    hintColor: '#eadfd2',
    ink: 'kuro',
    pen: 'pen',
    date: { x: 904, y: 1340, anchor: 'end', color: '#c56a55' },
    envelope: { body: '#f7f1e3', edge: '#dccdb0', flap: '#efe6d2', liner: '#d9533b' },
  },
];

export function findPaper(id: string | undefined): PaperDef {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0];
}

/* ---------- ペンの いろ・しゅるい ---------- */

export type InkId = 'kuro' | 'chairo' | 'aka' | 'pink' | 'orange' | 'midori' | 'mizu' | 'ao' | 'murasaki' | 'niji' | 'kin' | 'shiro';

export interface InkDef {
  id: InkId;
  name: string;
  color: string;
  /** くらい びんせん むけ (あかるい いろ) */
  light?: boolean;
  /** くらい びんせんでも あかるい びんせんでも つかえる */
  both?: boolean;
}

/** にじいろ: 1画ずつ いろを かえる (かく パッドと おなじ いろ) */
export const RAINBOW = ['#ff5c8a', '#ff9a2e', '#2fb0ff', '#3cc067', '#9b7bff', '#ff6fb0'];

export const INKS: InkDef[] = [
  { id: 'kuro', name: 'くろ', color: '#3a302c' },
  { id: 'chairo', name: 'ちゃいろ', color: '#8a5530' },
  { id: 'aka', name: 'あか', color: '#e2383f' },
  { id: 'pink', name: 'ピンク', color: '#ef5b8f' },
  { id: 'orange', name: 'オレンジ', color: '#f57f17' },
  { id: 'midori', name: 'みどり', color: '#2f9a4c' },
  { id: 'mizu', name: 'みずいろ', color: '#1ea5df' },
  { id: 'ao', name: 'あお', color: '#2c5fd2' },
  { id: 'murasaki', name: 'むらさき', color: '#8452d6' },
  { id: 'niji', name: 'にじいろ', color: RAINBOW[0], both: true },
  { id: 'kin', name: 'きんいろ', color: '#ffd66b', light: true },
  { id: 'shiro', name: 'しろ', color: '#fff8ea', light: true },
];

export function findInk(id: string | undefined): InkDef {
  return INKS.find((i) => i.id === id) ?? INKS[0];
}

/** その びんせんで つかえる いろ */
export function inksFor(paper: PaperDef): InkDef[] {
  return INKS.filter((i) => i.both || !!i.light === !!paper.dark);
}

export type PenId = 'crayon' | 'pen' | 'fude';

export const PENS: { id: PenId; name: string; emoji: string }[] = [
  { id: 'crayon', name: 'クレヨン', emoji: '🖍️' },
  { id: 'pen', name: 'ペン', emoji: '🖊️' },
  { id: 'fude', name: 'ふで', emoji: '🖌️' },
];

/* ---------- シール ---------- */

/** いつでも はれる てがみの シール (もっている シールも つかえる) */
export const LETTER_STICKERS = ['❤️', '💕', '⭐', '✨', '🌷', '🎀'];

/** ふうとうを とめる シール */
export const SEALS = ['❤️', '⭐', '🌸', '🍀', '🎀', '🌈'];
