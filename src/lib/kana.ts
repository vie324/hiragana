/** ひらがなの 基本データと ユーティリティ */

export interface KanaRow {
  id: string;
  /** 行の なまえ (あ, か, …) */
  name: string;
  /** 50音表の 5マス (空欄は null) */
  cells: (string | null)[];
}

export const SEION_ROWS: KanaRow[] = [
  { id: 'a', name: 'あ', cells: ['あ', 'い', 'う', 'え', 'お'] },
  { id: 'ka', name: 'か', cells: ['か', 'き', 'く', 'け', 'こ'] },
  { id: 'sa', name: 'さ', cells: ['さ', 'し', 'す', 'せ', 'そ'] },
  { id: 'ta', name: 'た', cells: ['た', 'ち', 'つ', 'て', 'と'] },
  { id: 'na', name: 'な', cells: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { id: 'ha', name: 'は', cells: ['は', 'ひ', 'ふ', 'へ', 'ほ'] },
  { id: 'ma', name: 'ま', cells: ['ま', 'み', 'む', 'め', 'も'] },
  { id: 'ya', name: 'や', cells: ['や', null, 'ゆ', null, 'よ'] },
  { id: 'ra', name: 'ら', cells: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { id: 'wa', name: 'わ', cells: ['わ', null, null, null, 'を'] },
  { id: 'n', name: 'ん', cells: ['ん', null, null, null, null] },
];

export const DAKUON_ROWS: KanaRow[] = [
  { id: 'ga', name: 'が', cells: ['が', 'ぎ', 'ぐ', 'げ', 'ご'] },
  { id: 'za', name: 'ざ', cells: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'] },
  { id: 'da', name: 'だ', cells: ['だ', 'ぢ', 'づ', 'で', 'ど'] },
  { id: 'ba', name: 'ば', cells: ['ば', 'び', 'ぶ', 'べ', 'ぼ'] },
  { id: 'pa', name: 'ぱ', cells: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'] },
];

export const YOUON_ROWS: KanaRow[] = [
  { id: 'kya', name: 'きゃ', cells: ['きゃ', 'きゅ', 'きょ'] },
  { id: 'sha', name: 'しゃ', cells: ['しゃ', 'しゅ', 'しょ'] },
  { id: 'cha', name: 'ちゃ', cells: ['ちゃ', 'ちゅ', 'ちょ'] },
  { id: 'nya', name: 'にゃ', cells: ['にゃ', 'にゅ', 'にょ'] },
  { id: 'hya', name: 'ひゃ', cells: ['ひゃ', 'ひゅ', 'ひょ'] },
  { id: 'mya', name: 'みゃ', cells: ['みゃ', 'みゅ', 'みょ'] },
  { id: 'rya', name: 'りゃ', cells: ['りゃ', 'りゅ', 'りょ'] },
  { id: 'gya', name: 'ぎゃ', cells: ['ぎゃ', 'ぎゅ', 'ぎょ'] },
  { id: 'ja', name: 'じゃ', cells: ['じゃ', 'じゅ', 'じょ'] },
  { id: 'bya', name: 'びゃ', cells: ['びゃ', 'びゅ', 'びょ'] },
  { id: 'pya', name: 'ぴゃ', cells: ['ぴゃ', 'ぴゅ', 'ぴょ'] },
];

const cellsOf = (rows: KanaRow[]) => rows.flatMap((r) => r.cells.filter((c): c is string => !!c));

export const SEION = cellsOf(SEION_ROWS);
export const DAKUON = cellsOf(DAKUON_ROWS.slice(0, 4));
export const HANDAKUON = cellsOf(DAKUON_ROWS.slice(4));
/** 1もじで かく ひらがな ぜんぶ (清音・濁音・半濁音) */
export const BASIC_KANA = [...SEION, ...DAKUON, ...HANDAKUON];
export const SMALL_KANA = ['ゃ', 'ゅ', 'ょ', 'っ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];
/** 書く れんしゅうが できる もじ */
export const WRITABLE_KANA = [...BASIC_KANA, ...SMALL_KANA];

const SMALL_JOIN = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヮ']);

export function isHiragana(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return c >= 0x3041 && c <= 0x309f;
}

/** ことばを 音の まとまり(拍)に わける。 きょうりゅう → きょ/う/りゅ/う */
export function splitUnits(word: string): string[] {
  const out: string[] = [];
  for (const ch of word) {
    if (SMALL_JOIN.has(ch) && out.length && !SMALL_JOIN.has(out[out.length - 1].slice(-1))) {
      out[out.length - 1] += ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

/** ことばに ふくまれる かな 1もじずつ (ひらがな・カタカナ。記号・空白を のぞく) */
export function kanaChars(text: string): string[] {
  return [...text].filter(isKana);
}

/** 濁点・半濁点を とった もとの もじ (が → か) */
export function baseKana(ch: string): string {
  const n = ch.normalize('NFD');
  return n[0] ?? ch;
}

const SMALL_NAMES: Record<string, string> = {
  ゃ: 'ちいさい や',
  ゅ: 'ちいさい ゆ',
  ょ: 'ちいさい よ',
  っ: 'ちいさい つ',
  ぁ: 'ちいさい あ',
  ぃ: 'ちいさい い',
  ぅ: 'ちいさい う',
  ぇ: 'ちいさい え',
  ぉ: 'ちいさい お',
  ャ: 'ちいさい ヤ',
  ュ: 'ちいさい ユ',
  ョ: 'ちいさい ヨ',
  ッ: 'ちいさい ツ',
  ァ: 'ちいさい ア',
  ィ: 'ちいさい イ',
  ゥ: 'ちいさい ウ',
  ェ: 'ちいさい エ',
  ォ: 'ちいさい オ',
  ー: 'のばす ぼう',
};

/** 1もじ(または 拗音)を よみあげる ときの テキスト */
export function sayKana(k: string): string {
  if (SMALL_NAMES[k]) return SMALL_NAMES[k];
  return k;
}

/** かたちが にていて まちがえやすい もじ */
export const SIMILAR: Record<string, string[]> = {
  あ: ['お', 'め', 'ぬ', 'の'],
  い: ['り', 'こ', 'ひ'],
  う: ['ら', 'つ', 'ろ'],
  え: ['ん', 'そ', 'ろ'],
  お: ['あ', 'す', 'む'],
  か: ['や', 'な', 'け'],
  き: ['さ', 'ち', 'も'],
  く: ['へ', 'し', 'つ'],
  け: ['は', 'ほ', 'に'],
  こ: ['い', 'に', 'て'],
  さ: ['き', 'ち', 'ら'],
  し: ['つ', 'く', 'も'],
  す: ['む', 'お', 'ね'],
  せ: ['も', 'や', 'け'],
  そ: ['て', 'ろ', 'る'],
  た: ['な', 'に', 'け'],
  ち: ['さ', 'ら', 'ろ'],
  つ: ['し', 'う', 'て'],
  て: ['そ', 'つ', 'こ'],
  と: ['こ', 'い', 'を'],
  な: ['た', 'か', 'は'],
  に: ['こ', 'け', 'た'],
  ぬ: ['め', 'ね', 'の'],
  ね: ['れ', 'わ', 'ぬ'],
  の: ['め', 'ぬ', 'あ'],
  は: ['ほ', 'け', 'ま'],
  ひ: ['い', 'く', 'し'],
  ふ: ['か', 'ぶ', 'ぷ'],
  へ: ['く', 'し', 'つ'],
  ほ: ['は', 'ま', 'け'],
  ま: ['ほ', 'よ', 'も'],
  み: ['よ', 'ゆ', 'ろ'],
  む: ['す', 'お', 'ね'],
  め: ['ぬ', 'の', 'あ'],
  も: ['し', 'せ', 'き'],
  や: ['か', 'せ', 'ゆ'],
  ゆ: ['よ', 'み', 'ね'],
  よ: ['ま', 'み', 'は'],
  ら: ['う', 'ち', 'ろ'],
  り: ['い', 'こ', 'ら'],
  る: ['ろ', 'そ', 'ら'],
  れ: ['わ', 'ね', 'ぬ'],
  ろ: ['る', 'う', 'ら'],
  わ: ['れ', 'ね', 'ぬ'],
  を: ['と', 'ち', 'お'],
  ん: ['し', 'く', 'え'],
};

/** かたちが にていて まちがえやすい カタカナ */
export const K_SIMILAR: Record<string, string[]> = {
  ア: ['マ', 'ヤ', 'フ'],
  イ: ['ト', 'レ', 'ノ'],
  ウ: ['ワ', 'フ', 'ラ'],
  エ: ['ユ', 'コ', 'ニ'],
  オ: ['ホ', 'キ', 'ヤ'],
  カ: ['ヤ', 'ク', 'タ'],
  キ: ['モ', 'チ', 'オ'],
  ク: ['ケ', 'タ', 'ワ'],
  ケ: ['ク', 'タ', 'ナ'],
  コ: ['ユ', 'ロ', 'エ'],
  サ: ['セ', 'ナ', 'チ'],
  シ: ['ツ', 'ミ', 'ン'],
  ス: ['ヌ', 'ヲ', 'フ'],
  セ: ['サ', 'ヤ', 'モ'],
  ソ: ['ン', 'リ', 'ツ'],
  タ: ['ク', 'ケ', 'ヌ'],
  チ: ['テ', 'モ', 'キ'],
  ツ: ['シ', 'ソ', 'ン'],
  テ: ['チ', 'ラ', 'モ'],
  ト: ['イ', 'ホ', 'ヤ'],
  ナ: ['メ', 'サ', 'ケ'],
  ニ: ['コ', 'エ', 'ミ'],
  ヌ: ['ス', 'メ', 'ヲ'],
  ネ: ['ホ', 'ス', 'オ'],
  ノ: ['メ', 'ソ', 'イ'],
  ハ: ['ル', 'ヘ', 'ソ'],
  ヒ: ['ト', 'レ', 'セ'],
  フ: ['ワ', 'ウ', 'ヲ'],
  ヘ: ['ハ', 'ク', 'ノ'],
  ホ: ['オ', 'ネ', 'キ'],
  マ: ['ア', 'ム', 'ヤ'],
  ミ: ['シ', 'ニ', 'ツ'],
  ム: ['マ', 'ス', 'ヌ'],
  メ: ['ナ', 'ノ', 'ヌ'],
  モ: ['キ', 'チ', 'セ'],
  ヤ: ['セ', 'カ', 'マ'],
  ユ: ['コ', 'エ', 'ヨ'],
  ヨ: ['ユ', 'コ', 'ヲ'],
  ラ: ['ウ', 'フ', 'テ'],
  リ: ['ソ', 'ル', 'ハ'],
  ル: ['レ', 'ハ', 'リ'],
  レ: ['ル', 'イ', 'ヒ'],
  ロ: ['コ', 'ユ', 'ヨ'],
  ワ: ['ウ', 'フ', 'ク'],
  ヲ: ['ヨ', 'フ', 'ス'],
  ン: ['ソ', 'シ', 'ツ'],
};

export function similarTo(k: string): string[] {
  const direct = SIMILAR[k] ?? K_SIMILAR[k];
  if (direct) return direct.filter((c) => c !== k);
  const base = baseKana(k);
  if (base !== k) {
    // が → か/ぎ/ぐ、ガ → カ/ギ/グ など
    const row = [...DAKUON_ROWS, ...K_DAKUON_ROWS].find((r) => r.cells.includes(k));
    const siblings = row ? row.cells.filter((c): c is string => !!c && c !== k) : [];
    return [base, ...siblings.slice(0, 2)];
  }
  return [];
}

/* ---------- カタカナ ---------- */

export type Script = 'hira' | 'kata';

/** のばす ぼう */
export const CHOUON = 'ー';

/** ひらがな → カタカナ */
export function toKata(s: string): string {
  return s.replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

/** カタカナ → ひらがな (ー は そのまま) */
export function toHira(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export function isKatakana(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (c >= 0x30a1 && c <= 0x30fa) || c === 0x30fc;
}

export function isKana(ch: string): boolean {
  return isHiragana(ch) || isKatakana(ch);
}

/** ぜんぶ その しゅるいの もじか (カタカナの 「ー」は カタカナに いれる) */
export function isOfScript(text: string, script: Script): boolean {
  return [...text].every(script === 'kata' ? isKatakana : isHiragana);
}

/** カタカナが ひとつでも あれば カタカナの ことば */
export function scriptOf(text: string): Script {
  return [...text].some((c) => c !== CHOUON && isKatakana(c)) ? 'kata' : 'hira';
}

const kataRows = (rows: KanaRow[]): KanaRow[] =>
  rows.map((r) => ({ id: `k${r.id}`, name: toKata(r.name), cells: r.cells.map((c) => (c ? toKata(c) : null)) }));

export const K_SEION_ROWS = kataRows(SEION_ROWS);
export const K_DAKUON_ROWS = kataRows(DAKUON_ROWS);
export const K_YOUON_ROWS = kataRows(YOUON_ROWS);
export const K_SEION = cellsOf(K_SEION_ROWS);
export const K_DAKUON = cellsOf(K_DAKUON_ROWS.slice(0, 4));
export const K_HANDAKUON = cellsOf(K_DAKUON_ROWS.slice(4));
/** 1もじで かく カタカナ ぜんぶ (清音・濁音・半濁音) */
export const K_BASIC_KANA = [...K_SEION, ...K_DAKUON, ...K_HANDAKUON];
export const K_SMALL_KANA = SMALL_KANA.map(toKata);
/** 書く れんしゅうが できる カタカナ (ー も) */
export const K_WRITABLE_KANA = [...K_BASIC_KANA, ...K_SMALL_KANA, CHOUON];

export const ROWS: Record<Script, { seion: KanaRow[]; dakuon: KanaRow[]; youon: KanaRow[] }> = {
  hira: { seion: SEION_ROWS, dakuon: DAKUON_ROWS, youon: YOUON_ROWS },
  kata: { seion: K_SEION_ROWS, dakuon: K_DAKUON_ROWS, youon: K_YOUON_ROWS },
};

export function basicKanaOf(script: Script): string[] {
  return script === 'kata' ? K_BASIC_KANA : BASIC_KANA;
}

export function seionOf(script: Script): string[] {
  return script === 'kata' ? K_SEION : SEION;
}
