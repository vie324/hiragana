import { describe, expect, it } from 'vitest';
import { KATA_WORDS, WORDS, wordsStartingWith, wordsWithin, lastSound } from './words';
import { BASIC_KANA, K_BASIC_KANA, K_SEION, K_WRITABLE_KANA, SEION, isHiragana, isKana, isKatakana, isOfScript, splitUnits, toKata } from '../lib/kana';
import { bookKana, readability } from './bookInfo';
import { kanaExample } from './kanaInfo';
import { ALL_NODES, KATA_NODES, KATA_STAGES, STAGES, kanaUpToStage, nextNodeIndex, scriptOfNode } from './curriculum';
import { ALL_BOOKS as BOOKS, findBook, particleSay, tokenize } from './books';
import { ALL_SPECIAL_LESSONS as SPECIAL_LESSONS } from './specialLessons';
import strokes from './strokes.json';
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

describe('katakana', () => {
  it('uses only katakana words with unique words/emoji', () => {
    const ws = new Set<string>();
    const es = new Set<string>();
    for (const w of KATA_WORDS) {
      expect([...w.w].every(isKatakana), w.w).toBe(true);
      expect(ws.has(w.w), `dup word ${w.w}`).toBe(false);
      expect(es.has(w.e), `dup emoji ${w.e} (${w.w})`).toBe(false);
      ws.add(w.w);
      es.add(w.e);
    }
    expect(KATA_WORDS.length).toBeGreaterThan(120);
  });

  it('has an example for every basic katakana except ヲ ヂ ヅ', () => {
    for (const k of K_BASIC_KANA) {
      if ('ヲヂヅ'.includes(k)) continue;
      const ex = kanaExample(k);
      expect(ex, k).not.toBeNull();
      expect(ex!.word.includes(k), `${k} in ${ex!.word}`).toBe(true);
    }
  });

  it('has stroke order for every katakana that can be written', () => {
    for (const k of K_WRITABLE_KANA) expect((strokes as Record<string, unknown>)[k], k).toBeDefined();
  });

  it('offers katakana words for the early word games', () => {
    const upToKa = new Set([...kanaUpToStage('k-ka'), 'ー']);
    expect(wordsWithin(upToKa, {}, 'kata').length).toBeGreaterThanOrEqual(5);
    const upToSa = new Set([...kanaUpToStage('k-sa'), 'ー']);
    expect(wordsWithin(upToSa, { maxUnits: 4 }, 'kata').length).toBeGreaterThanOrEqual(10);
    expect(wordsStartingWith('ア').every((w) => w.w.startsWith('ア'))).toBe(true);
    expect(wordsStartingWith('あ').every((w) => w.w.startsWith('あ'))).toBe(true);
  });

  it('introduces every katakana seion except ヲ in a lesson', () => {
    const lessons = new Set(KATA_NODES.filter((n) => n.kind === 'lesson').flatMap((n) => n.kana!));
    for (const k of K_SEION) if (k !== 'ヲ') expect(lessons.has(k), k).toBe(true);
    expect(KATA_NODES.every((n) => scriptOfNode(n.id) === 'kata')).toBe(true);
    expect(ALL_NODES.every((n) => scriptOfNode(n.id) === 'hira')).toBe(true);
    expect(nextNodeIndex(() => false, 'kata')).toBe(0);
    expect(KATA_STAGES.length).toBeGreaterThanOrEqual(15);
  });

  it('only counts a katakana book as readable when its katakana is known', () => {
    const omise = findBook('omise')!;
    const hira = new Set(SEION);
    expect(readability(omise, (k) => hira.has(k))).toBeLessThan(0.5);
    const kata = new Set([...K_SEION, ...K_BASIC_KANA, ...SEION]);
    expect(readability(omise, (k) => kata.has(k) || !isKatakana(k))).toBeGreaterThan(0.8);
    expect(bookKana(omise)).not.toContain('ー');
  });

  it('tells which script a tile belongs to', () => {
    expect(isOfScript('ー', 'hira')).toBe(false);
    expect(isOfScript('ー', 'kata')).toBe(true);
    expect(isOfScript('きゃ', 'hira')).toBe(true);
    expect(isOfScript('キャ', 'hira')).toBe(false);
  });

  it('converts between hiragana and katakana', () => {
    expect(toKata('きゃべつ')).toBe('キャベツ');
    expect(splitUnits('ジュース')).toEqual(['ジュ', 'ー', 'ス']);
    expect(lastSound('シャワー')).toBe('ー');
  });
});

describe('curriculum', () => {
  it('has unique node ids and valid references', () => {
    const ids = new Set<string>();
    for (const n of [...ALL_NODES, ...KATA_NODES]) {
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
    const outfits = [...ALL_NODES, ...KATA_NODES].filter((n) => n.kind === 'treasure').map((n) => n.outfit);
    expect(new Set(outfits).size).toBe(outfits.length);
    expect(STAGES.length).toBeGreaterThanOrEqual(15);
  });
});

describe('books', () => {
  it('only uses kana text (plus punctuation and placeholders)', () => {
    for (const b of BOOKS) {
      for (const p of [{ text: b.title }, ...b.pages]) {
        const plain = p.text.replace(/\{name\}|\{buddy\}/g, '').replace(/\|[^\s]+/g, '');
        for (const ch of plain) {
          const ok = isKana(ch) || /[\s、。!?！？「」…〜ー]/.test(ch);
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
    const [line] = tokenize('「まて まて〜!」|まてー!」', { name: '', buddy: '' });
    expect(line.map((t) => t.t)).toEqual(['「まて', 'まて〜!」']);
    expect(line[1].say).toBe('まてー!」');
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

import { makeChain, shiritoriDistractors } from './shiritori';
import { mulberry32 } from '../lib/random';

describe('shiritori', () => {
  it('builds valid chains without ん endings', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 30; i++) {
      const chain = makeChain(5, rng);
      expect(chain).toHaveLength(6);
      for (let j = 1; j < chain.length; j++) {
        expect(chain[j].w[0]).toBe(lastSound(chain[j - 1].w));
        expect(chain[j].w.endsWith('ん')).toBe(false);
      }
      expect(new Set(chain.map((w) => w.w)).size).toBe(6);
    }
  });

  it('picks distractors that do not start with the sound', () => {
    const d = shiritoriDistractors('か', new Set(), 5, mulberry32(1));
    expect(d).toHaveLength(5);
    for (const w of d) expect(w.w[0]).not.toBe('か');
  });
});
