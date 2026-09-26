/**
 * ぼうけんマップ (がくしゅうの すすめかた)。
 * 50音の 行ごとに「くに」を たびする。
 */

export type NodeKind =
  | 'lesson'
  | 'special'
  | 'balloon'
  | 'firstsound'
  | 'wordbuild'
  | 'readquiz'
  | 'memory'
  | 'treasure'
  | 'book';

export interface MapNode {
  id: string;
  kind: NodeKind;
  /** レッスンや ゲームで つかう もじ */
  kana?: string[];
  lessonId?: string;
  bookId?: string;
  outfit?: string;
}

export interface Land {
  name: string;
  /** グラデーション (うえ → した) */
  sky: [string, string];
  ground: string;
  deco: string[];
}

export interface Stage {
  id: string;
  title: string;
  land: Land;
  /** このステージで あたらしく おぼえる もじ */
  kana: string[];
  nodes: MapNode[];
}

const L = (stage: string, k: string): MapNode => ({ id: `${stage}:lesson:${k}`, kind: 'lesson', kana: [k] });
const G = (stage: string, kind: NodeKind, n: number, kana?: string[]): MapNode => ({
  id: `${stage}:${kind}:${n}`,
  kind,
  ...(kana ? { kana } : {}),
});
const T = (stage: string, outfit: string): MapNode => ({ id: `${stage}:treasure`, kind: 'treasure', outfit });
const B = (stage: string, bookId: string): MapNode => ({ id: `${stage}:book:${bookId}`, kind: 'book', bookId });
const S = (stage: string, lessonId: string, kana?: string[]): MapNode => ({
  id: `${stage}:special:${lessonId}`,
  kind: 'special',
  lessonId,
  ...(kana ? { kana } : {}),
});

/** 5もじの 行の きほんの ならび */
function rowStage(
  id: string,
  title: string,
  land: Land,
  kana: string[],
  opts: { words?: boolean; read?: boolean; memory?: boolean; outfit: string; book?: string },
): Stage {
  const [k1, k2, ...rest] = kana;
  const nodes: MapNode[] = [L(id, k1), L(id, k2), G(id, 'balloon', 1, [k1, k2])];
  for (const k of rest) nodes.push(L(id, k));
  nodes.push(G(id, 'firstsound', 1, kana));
  if (opts.memory) nodes.push(G(id, 'memory', 1, kana));
  nodes.push(G(id, 'balloon', 2, kana));
  if (opts.words) nodes.push(G(id, 'wordbuild', 1));
  if (opts.read) nodes.push(G(id, 'readquiz', 1));
  nodes.push(T(id, opts.outfit));
  if (opts.book) nodes.push(B(id, opts.book));
  return { id, title, land, kana, nodes };
}

export const STAGES: Stage[] = [
  rowStage(
    'a',
    'あ',
    { name: 'はらっぱ', sky: ['#bfe9ff', '#e8f9d9'], ground: '#9ee07a', deco: ['🌷', '🌼', '🦋', '🌳', '🐞'] },
    ['あ', 'い', 'う', 'え', 'お'],
    { outfit: 'ribbon', book: 'doubutsu' },
  ),
  rowStage(
    'ka',
    'か',
    { name: 'もり', sky: ['#c7f0d8', '#e5f7c8'], ground: '#6cc36c', deco: ['🌲', '🍄', '🦊', '🌳', '🐿️'] },
    ['か', 'き', 'く', 'け', 'こ'],
    { words: true, memory: true, outfit: 'crown', book: 'norimono' },
  ),
  rowStage(
    'sa',
    'さ',
    { name: 'うみ', sky: ['#a8e4ff', '#d8f6ff'], ground: '#7fd3f7', deco: ['🐟', '🐚', '🦀', '🐬', '⛵'] },
    ['さ', 'し', 'す', 'せ', 'そ'],
    { words: true, read: true, outfit: 'flower', book: 'kudamono' },
  ),
  rowStage(
    'ta',
    'た',
    { name: 'やま', sky: ['#cfe3ff', '#f1f7ff'], ground: '#a6c98f', deco: ['⛰️', '🦅', '🌲', '🏕️', '🐻'] },
    ['た', 'ち', 'つ', 'て', 'と'],
    { words: true, read: true, memory: true, outfit: 'glasses', book: 'oyasumi' },
  ),
  rowStage(
    'na',
    'な',
    { name: 'ぼくじょう', sky: ['#d6f2ff', '#fff8dc'], ground: '#b7e07c', deco: ['🐄', '🐔', '🌽', '🐑', '🚜'] },
    ['な', 'に', 'ぬ', 'ね', 'の'],
    { words: true, read: true, outfit: 'hat', book: 'iro' },
  ),
  rowStage(
    'ha',
    'は',
    { name: 'おはなばたけ', sky: ['#ffe0ef', '#fff6d6'], ground: '#b6e388', deco: ['🌻', '🌸', '🐝', '🌷', '🌺'] },
    ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    { words: true, read: true, memory: true, outfit: 'star', book: 'kakurenbo' },
  ),
  rowStage(
    'ma',
    'ま',
    { name: 'まち', sky: ['#d9e8ff', '#fff2e0'], ground: '#cfd8dc', deco: ['🏠', '🚗', '🏪', '🚲', '🏫'] },
    ['ま', 'み', 'む', 'め', 'も'],
    { words: true, read: true, outfit: 'balloon', book: 'ichinichi' },
  ),
  {
    id: 'ya',
    title: 'や',
    land: { name: 'ゆきの くに', sky: ['#dfefff', '#ffffff'], ground: '#eef6ff', deco: ['⛄', '❄️', '🌨️', '🐧', '🎿'] },
    kana: ['や', 'ゆ', 'よ'],
    nodes: [
      L('ya', 'や'),
      L('ya', 'ゆ'),
      L('ya', 'よ'),
      G('ya', 'balloon', 1, ['や', 'ゆ', 'よ']),
      G('ya', 'firstsound', 1, ['や', 'ゆ', 'よ']),
      G('ya', 'wordbuild', 1),
      G('ya', 'readquiz', 1),
      T('ya', 'straw'),
      B('ya', 'ookii'),
    ],
  },
  rowStage(
    'ra',
    'ら',
    { name: 'うちゅう', sky: ['#2b2d6e', '#5b4b9a'], ground: '#8b7fd1', deco: ['🚀', '🪐', '⭐', '🌙', '👽'] },
    ['ら', 'り', 'る', 'れ', 'ろ'],
    { words: true, read: true, memory: true, outfit: 'butterfly', book: 'osanpo' },
  ),
  {
    id: 'wa',
    title: 'わ',
    land: { name: 'おしろ', sky: ['#ffe3f1', '#fff5e6'], ground: '#f6c9dc', deco: ['🏰', '👑', '🦄', '🎠', '💎'] },
    kana: ['わ', 'を', 'ん'],
    nodes: [
      L('wa', 'わ'),
      L('wa', 'を'),
      L('wa', 'ん'),
      G('wa', 'balloon', 1, ['わ', 'を', 'ん']),
      G('wa', 'memory', 1),
      G('wa', 'wordbuild', 1),
      G('wa', 'readquiz', 1),
      T('wa', 'scarf'),
      B('wa', 'omusubi'),
    ],
  },
  {
    id: 'ga',
    title: 'が',
    land: { name: 'おかしの くに', sky: ['#ffe1ec', '#fff3e3'], ground: '#ffc8dd', deco: ['🍭', '🍬', '🧁', '🍩', '🍪'] },
    kana: ['が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    nodes: [
      S('ga', 'tenten'),
      L('ga', 'が'),
      L('ga', 'ご'),
      G('ga', 'balloon', 1, ['が', 'ぎ', 'ぐ', 'げ', 'ご']),
      L('ga', 'じ'),
      L('ga', 'ぞ'),
      G('ga', 'balloon', 2, ['ざ', 'じ', 'ず', 'ぜ', 'ぞ']),
      G('ga', 'wordbuild', 1),
      G('ga', 'readquiz', 1),
      T('ga', 'wand'),
    ],
  },
  {
    id: 'da',
    title: 'だ',
    land: { name: 'どうくつ', sky: ['#cbb89d', '#efe3cf'], ground: '#b49774', deco: ['💎', '🦇', '🕯️', '🗝️', '🪨'] },
    kana: ['だ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ'],
    nodes: [
      L('da', 'だ'),
      L('da', 'で'),
      L('da', 'ど'),
      G('da', 'balloon', 1, ['だ', 'で', 'ど', 'ぢ', 'づ']),
      L('da', 'ぶ'),
      L('da', 'べ'),
      G('da', 'balloon', 2, ['ば', 'び', 'ぶ', 'べ', 'ぼ']),
      G('da', 'memory', 1),
      G('da', 'wordbuild', 1),
      G('da', 'readquiz', 1),
      T('da', 'cap'),
      B('da', 'kabu'),
    ],
  },
  {
    id: 'pa',
    title: 'ぱ',
    land: { name: 'にじの くに', sky: ['#e1f5ff', '#fff0f7'], ground: '#c3f0c8', deco: ['🌈', '☁️', '🎈', '🦄', '🌟'] },
    kana: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
    nodes: [
      S('pa', 'maru', ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']),
      L('pa', 'ぽ'),
      G('pa', 'balloon', 1, ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']),
      G('pa', 'wordbuild', 1),
      G('pa', 'readquiz', 1),
      T('pa', 'clover'),
    ],
  },
  {
    id: 'kya',
    title: 'ゃ',
    land: { name: 'きょうりゅうの しま', sky: ['#ffe7c2', '#fff8e8'], ground: '#9fd18b', deco: ['🦕', '🦖', '🌋', '🌴', '🥚'] },
    kana: ['ゃ', 'ゅ', 'ょ'],
    nodes: [
      S('kya', 'small-ya'),
      S('kya', 'small-yu'),
      S('kya', 'small-yo'),
      G('kya', 'readquiz', 1),
      G('kya', 'wordbuild', 1),
      T('kya', 'tulip'),
      B('kya', 'tanjoubi'),
    ],
  },
  {
    id: 'tsu',
    title: 'っ',
    land: { name: 'そらの しま', sky: ['#bfe3ff', '#eaf6ff'], ground: '#ffffff', deco: ['☁️', '🕊️', '🪁', '✈️', '🌤️'] },
    kana: ['っ'],
    nodes: [S('tsu', 'small-tsu'), S('tsu', 'long'), G('tsu', 'readquiz', 1), G('tsu', 'wordbuild', 1), T('tsu', 'grad')],
  },
  {
    id: 'joshi',
    title: 'は',
    land: { name: 'えほんの もり', sky: ['#e8e0ff', '#fff7e0'], ground: '#b8e6a0', deco: ['📚', '🦉', '🍄', '🌳', '✨'] },
    kana: [],
    nodes: [
      S('joshi', 'particle-wa'),
      S('joshi', 'particle-e'),
      S('joshi', 'particle-o'),
      G('joshi', 'readquiz', 1),
      T('joshi', 'gem'),
      B('joshi', 'hoshi'),
    ],
  },
];

export const ALL_NODES: MapNode[] = STAGES.flatMap((s) => s.nodes);

const nodeIndex = new Map(ALL_NODES.map((n, i) => [n.id, i]));
const nodeStage = new Map(STAGES.flatMap((s) => s.nodes.map((n) => [n.id, s] as const)));

export function findNode(id: string | undefined): MapNode | undefined {
  if (!id) return undefined;
  const i = nodeIndex.get(id);
  return i === undefined ? undefined : ALL_NODES[i];
}

export function stageOfNode(id: string): Stage | undefined {
  return nodeStage.get(id);
}

/** ここまでに ならう もじ (このノードの まえまで) */
export function kanaIntroducedBefore(nodeId: string): string[] {
  const idx = nodeIndex.get(nodeId) ?? 0;
  const set = new Set<string>();
  for (let i = 0; i < idx; i++) {
    const n = ALL_NODES[i];
    if (n.kind === 'lesson' && n.kana) n.kana.forEach((k) => set.add(k));
  }
  return [...set];
}

/** このステージまでに でてくる もじ (ゲームで つかう) */
export function kanaUpToStage(stageId: string): string[] {
  const out: string[] = [];
  for (const s of STAGES) {
    out.push(...s.kana);
    if (s.id === stageId) break;
  }
  return out;
}

/** つぎに やる ノード (まだ おわっていない さいしょの もの) */
export function nextNodeIndex(done: (id: string) => boolean): number {
  const i = ALL_NODES.findIndex((n) => !done(n.id));
  return i === -1 ? ALL_NODES.length : i;
}

export function nodeIndexOf(id: string): number {
  return nodeIndex.get(id) ?? -1;
}
