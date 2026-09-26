import { describe, expect, it } from 'vitest';
import { WORDS, wordsStartingWith, wordsWithin, lastSound } from './words';
import { BASIC_KANA, SEION, isHiragana, splitUnits } from '../lib/kana';
import { kanaExample } from './kanaInfo';
import { ALL_NODES, STAGES, kanaUpToStage } from './curriculum';
import { BOOKS, findBook, particleSay, tokenize } from './books';
import { SPECIAL_LESSONS } from './specialLessons';
import { OUTFITS } from './outfits';
import { STICKERS } from './stickers';

describe('word bank', () => {
  it('uses only hiragana and unique words/emoji', () => {
    const ws = new Set<string>();
    const es = new Set<string>();
    for (const w of WORDS) {
      expect([...w.w].every(isHiragana), w.w).toBe(true);
      expect(ws.has(w.w), `dup word ${w.w}`).toBe(false);
      expect(es.has(w.e), `dup emoji ${w.e} (${w.w})`).toBe(false);
      ws.add(w.w);
      es.add(w.e);
    }
    expect(WORDS.length).toBeGreaterThan(180);
  });

  it('has an example for every basic kana except ぢ', () => {
    for (const k of [...BASIC_KANA, 'を']) {
      const ex = kanaExample(k);
      if (k === 'ぢ') continue;
      expect(ex, k).not.toBeNull();
      expect(ex!.word.includes(k), `${k} in ${ex!.word}`).toBe(true);
    }
  });

  it('offers enough words for the early word games', () => {
    const upToKa = new Set(kanaUpToStage('ka'));
    expect(wordsWithin(upToKa).length).toBeGreaterThanOrEqual(5);
    const upToSa = new Set(kanaUpToStage('sa'));
    expect(wordsWithin(upToSa, { maxUnits: 4 }).length).toBeGreaterThanOrEqual(12);
  });

  it('has first-sound words for most seion', () => {
    const missing = SEION.filter((k) => wordsStartingWith(k).length === 0);
    expect(missing.sort()).toEqual(['る', 'を', 'ん'].sort());
  });

  it('computes shiritori last sounds', () => {
    expect(lastSound('でんしゃ')).toBe('や');
    expect(lastSound('りんご')).toBe('ご');
    expect(splitUnits('きょうりゅう')).toEqual(['きょ', 'う', 'りゅ', 'う']);
  });
});

describe('curriculum', () => {
  it('has unique node ids and valid references', () => {
    const ids = new Set<string>();
    for (const n of ALL_NODES) {
      expect(ids.has(n.id), n.id).toBe(false);
      ids.add(n.id);
      if (n.kind === 'book') expect(findBook(n.bookId!), n.id).toBeDefined();
      if (n.kind === 'special') expect(SPECIAL_LESSONS.find((l) => l.id === n.lessonId), n.id).toBeDefined();
      if (n.kind === 'treasure') expect(OUTFITS.find((o) => o.id === n.outfit), n.id).toBeDefined();
    }
  });

  it('introduces every seion in a lesson', () => {
    const lessons = new Set(ALL_NODES.filter((n) => n.kind === 'lesson').flatMap((n) => n.kana!));
    for (const k of SEION) expect(lessons.has(k), k).toBe(true);
  });

  it('uses each outfit at most once', () => {
    const outfits = ALL_NODES.filter((n) => n.kind === 'treasure').map((n) => n.outfit);
    expect(new Set(outfits).size).toBe(outfits.length);
    expect(STAGES.length).toBeGreaterThanOrEqual(15);
  });
});

describe('books', () => {
  it('only uses hiragana text (plus punctuation and placeholders)', () => {
    for (const b of BOOKS) {
      for (const p of [{ text: b.title }, ...b.pages]) {
        const plain = p.text.replace(/\{name\}|\{buddy\}/g, '').replace(/\|[^\s]+/g, '');
        for (const ch of plain) {
          const ok = isHiragana(ch) || /[\s、。!?！？「」…〜ー]/.test(ch);
          expect(ok, `${b.id}: "${ch}" in ${p.text}`).toBe(true);
        }
      }
      expect(b.pages.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('tokenizes with names and particle readings', () => {
    const lines = tokenize('{name}と {buddy}は\nこんにちは!', { name: 'ゆいちゃん', buddy: 'もこ' });
    expect(lines).toHaveLength(2);
    expect(lines[0].map((t) => t.t)).toEqual(['ゆいちゃんと', 'もこは']);
    expect(lines[0][1].say).toBe('もこわ');
    expect(lines[1][0].say).toBe('こんにちわ!');
    expect(particleSay('よぞらへ')).toBe('よぞらえ');
    expect(particleSay('はは')).toBe('はは');
    expect(particleSay('はな')).toBe('はな');
  });
});

describe('stickers', () => {
  it('are unique', () => {
    const s = STICKERS.map((x) => x.s);
    expect(new Set(s).size).toBe(s.length);
  });
});
