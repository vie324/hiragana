import { ALL_BOOKS, type Book } from './books';
import { isHiragana } from '../lib/kana';

/** えほんに でてくる ひらがな (なまえの ぶぶんは のぞく) */
export function bookKana(b: Book): string[] {
  const set = new Set<string>();
  for (const p of b.pages) {
    const plain = p.text.replace(/\{name\}|\{buddy\}/g, '').replace(/\|[^\s]+/g, '');
    for (const ch of plain) if (isHiragana(ch)) set.add(ch);
  }
  return [...set];
}

/** おぼえた もじの わりあい (0〜1) */
export function readability(b: Book, known: (k: string) => boolean): number {
  const ks = bookKana(b);
  if (!ks.length) return 1;
  return ks.filter(known).length / ks.length;
}

export const BOOK_ORDER = ALL_BOOKS.slice().sort((a, b) => a.level - b.level);
