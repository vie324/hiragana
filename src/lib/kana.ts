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

const SMALL_JOIN = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ']);

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

/** ことばに ふくまれる ひらがな 1もじずつ (記号・空白を のぞく) */
export function kanaChars(text: string): string[] {
  return [...text].filter(isHiragana);
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

export function similarTo(k: string): string[] {
  const direct = SIMILAR[k];
  if (direct) return direct.filter((c) => c !== k);
  const base = baseKana(k);
  if (base !== k) {
    // が → か/ぎ/ぐ など
    const row = [...DAKUON_ROWS].find((r) => r.cells.includes(k));
    const siblings = row ? row.cells.filter((c): c is string => !!c && c !== k) : [];
    return [base, ...siblings.slice(0, 2)];
  }
  return [];
}
