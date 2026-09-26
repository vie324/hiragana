/**
 * 声の ファイルを さがす ための きまり (アプリと scripts/voice で おなじものを つかう)。
 *
 * よみあげる テキストは「ぶん」(。!? で くぎる) ごとに 1つの 声の ファイルに する。
 * こうすると「〇〇! よめたね!」のような くみあわせの セリフも、ぶんの かずだけで すむ。
 */

/** なまえ など、まえもって つくれない ぶぶんの めじるし (catalog 用) */
export const NAME_MARK = '';

/** さがす ときの キー: 空白を とり、!? を はんかくに、さいごの 。 を とる */
export function voiceKey(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\s+/g, '')
    .replace(/！/g, '!')
    .replace(/？/g, '?')
    .replace(/。+$/u, '');
}

/** ぶんに わける (。!?！？ と、つづく とじかっこの あとで くぎる) */
export function splitSentences(text: string): string[] {
  const t = text.normalize('NFC').replace(/\s+/g, ' ').trim();
  const out: string[] = [];
  const re = /[^。!?！？]*[。!?！？]+[」』]*|[^。!?！？]+$/gu;
  for (const m of t.matchAll(re)) {
    const s = m[0].trim();
    if (s && /[\p{L}\p{N}]/u.test(s)) out.push(s);
  }
  return out;
}

/**
 * なまえ (names) の ところで ぶんを わける。
 * [{ text: 'つぎは なにに する?' }, { name: 'ゆいちゃん' }] のように かえす。
 * なまえの まえ・うしろの 「、」や 空白は すてる。
 */
export type Piece = { text: string } | { name: string };

export function splitNames(sentence: string, names: readonly string[]): Piece[] {
  const list = names.filter((n) => n.length > 0).sort((a, b) => b.length - a.length);
  if (!list.length) return [{ text: sentence }];
  const esc = list.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${esc.join('|')})`, 'gu');
  const out: Piece[] = [];
  for (const part of sentence.split(re)) {
    if (!part) continue;
    if (list.includes(part)) out.push({ name: part });
    else {
      const t = part.replace(/^[\s、]+/u, '').replace(/[\s、]+$/u, '');
      if (t && /[\p{L}\p{N}]/u.test(t)) out.push({ text: t });
    }
  }
  return out;
}

/** なまえの まわりに のこった みじかい ことば (「も」「と」など) は なまえと いっしょに よむ */
export function isTinyFragment(text: string): boolean {
  return [...text.replace(/[\s、。!?！？「」『』…]/gu, '')].length <= 2;
}
