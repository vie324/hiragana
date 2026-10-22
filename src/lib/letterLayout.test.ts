import { describe, expect, it } from 'vitest';
import { glyphTransform, layoutLetter, letterSlots, type LetterText } from './letterLayout';
import { PAPERS, PHRASES, RECIPIENTS, isLetterChar, normalizeLetterText, MAX_LINE_CHARS } from '../data/letters';
import { evaluateStroke } from './stroke';
import { getStrokes } from './strokes';

const AREA = { x: 100, y: 200, w: 800, h: 1000 };

const text = (to: string, lines: string[], from: string): LetterText => ({ to, lines, from });

describe('letterSlots', () => {
  it('あて名・ぶん・なまえを じゅんばんに ならべ、くうはくは のぞく', () => {
    const slots = letterSlots(text('まま', ['いつも ありがとう'], 'ゆい'));
    expect(slots.map((s) => s.ch).join('')).toBe('ままへいつもありがとうゆいより');
    expect(slots[0]).toEqual({ key: 't0', ch: 'ま', part: 'to' });
    // くうはくも かぞえるので「あ」は 4ばんめ
    expect(slots.find((s) => s.ch === 'あ')!.key).toBe('b0.4');
    expect(slots[slots.length - 1]).toEqual({ key: 'f3', ch: 'り', part: 'from' });
  });

  it('あて名や なまえが なければ かかない', () => {
    expect(
      letterSlots(text('', ['だいすき'], ''))
        .map((s) => s.ch)
        .join(''),
    ).toBe('だいすき');
  });
});

describe('layoutLetter', () => {
  const inArea = (x: number, y: number, s: number) =>
    x >= AREA.x - 0.01 && y >= AREA.y - 0.01 && x + s <= AREA.x + AREA.w + 0.01 && y + s <= AREA.y + AREA.h + 0.01;

  it('みじかい てがみは おおきな マスで、あて名・ぶん・なまえを ならべる', () => {
    const l = layoutLetter(text('まま', ['だいすき'], 'ゆい'), AREA, false);
    expect(l.s).toBeGreaterThanOrEqual(140);
    expect(l.overflow).toBe(false);
    const to = l.cells.filter((c) => c.part === 'to');
    const from = l.cells.filter((c) => c.part === 'from');
    expect(to[0].line).toBe(0);
    expect(to[0].pos).toBe(0);
    // なまえは いちばん したの ぎょうの みぎ
    expect(from[0].line).toBe(l.lines - 1);
    expect(from[from.length - 1].pos).toBe(l.per - 1);
    for (const c of l.cells) expect(inArea(c.x, c.y, c.s), c.key).toBe(true);
  });

  it('ことばの とちゅうで ぎょうを かえない', () => {
    const l = layoutLetter(text('おばあちゃん', ['おたんじょうび おめでとう', 'また あそぼうね'], 'さくら'), AREA, false);
    expect(l.overflow).toBe(false);
    const word = l.cells.filter((c) => c.key.startsWith('b0.') && Number(c.key.slice(3)) < 7);
    expect(new Set(word.map((c) => c.line)).size).toBe(1);
    // つぎの ことばは つぎの ぎょうか、1マス あけて おなじ ぎょう
    const omedetou = l.cells.find((c) => c.key === 'b0.8')!;
    const last = word[word.length - 1];
    expect(omedetou.line > last.line || omedetou.pos === last.pos + 2).toBe(true);
  });

  it('おなじ マスに 2つの もじを おかない', () => {
    for (const tate of [false, true]) {
      const l = layoutLetter(text('おじいちゃん', ['いつも ありがとう', 'ずっと げんきでね', 'また あそぼうね'], 'ゆいと'), AREA, tate);
      const seen = new Set<string>();
      for (const c of l.cells) {
        const k = `${c.line}:${c.pos}`;
        expect(seen.has(k), k).toBe(false);
        seen.add(k);
        expect(inArea(c.x, c.y, c.s), `${tate} ${c.key}`).toBe(true);
      }
      expect(l.cells.length).toBe(
        letterSlots(text('おじいちゃん', ['いつも ありがとう', 'ずっと げんきでね', 'また あそぼうね'], 'ゆいと')).length,
      );
    }
  });

  it('たてがきは みぎの れつから、うえから したへ', () => {
    const l = layoutLetter(text('ぱぱ', ['ありがとう'], 'ゆい'), AREA, true);
    const to = l.cells.filter((c) => c.part === 'to');
    const body = l.cells.filter((c) => c.part === 'body');
    expect(to[0].x).toBeGreaterThan(body[0].x);
    expect(to[1].y).toBeGreaterThan(to[0].y);
    expect(to[1].x).toBe(to[0].x);
    // なまえは ひだりの れつの いちばん した
    const from = l.cells.filter((c) => c.part === 'from');
    expect(from[0].x).toBeLessThan(body[0].x);
    expect(from[from.length - 1].pos).toBe(l.per - 1);
  });

  it('ながい ことばは わるが、ちいさい もじを ぎょうの はじめに しない', () => {
    const narrow = { x: 0, y: 0, w: 300, h: 1000 };
    const l = layoutLetter(text('', ['きょうりゅうきょうりゅう'], ''), narrow, false, { maxS: 100, minS: 100 });
    const starts = new Map<number, string>();
    for (const c of l.cells) if (!starts.has(c.line)) starts.set(c.line, c.ch);
    for (const ch of starts.values()) expect('ゃゅょっー').not.toContain(ch);
  });

  it('どんなに ながくても さいだいの ぶんは びんせんに はいる', () => {
    const long = 'あいうえおかきくけこさしすせ';
    expect([...long].length).toBeLessThanOrEqual(MAX_LINE_CHARS);
    for (const p of PAPERS) {
      for (const tate of [false, true]) {
        const l = layoutLetter(text('おねえちゃん', [long, long, long, long], 'ゆいと'), p.area, tate);
        expect(l.overflow, `${p.id} ${tate}`).toBe(false);
      }
    }
  });
});

describe('glyphTransform', () => {
  it('ちいさい もじ・てんは ちいさく、たてがきの ー は たおす', () => {
    expect(glyphTransform('あ', false)).toEqual({ t: '', k: 1 });
    expect(glyphTransform('ゃ', false).k).toBeLessThan(1);
    expect(glyphTransform('、', true).k).toBeLessThan(glyphTransform('ゃ', true).k);
    expect(glyphTransform('ー', true).t).toContain('rotate(90');
    expect(glyphTransform('ー', false).t).toBe('');
  });
});

describe('letter data', () => {
  it('ぶん・あて名は ぜんぶ かける もじ', () => {
    for (const p of PHRASES) {
      expect([...p.text].every(isLetterChar), p.text).toBe(true);
      expect([...p.text].length, p.text).toBeLessThanOrEqual(MAX_LINE_CHARS);
      expect(p.text).toBe(normalizeLetterText(p.text));
    }
    for (const r of RECIPIENTS) for (const name of [r.label, r.kata ?? r.label]) expect([...name].every(isLetterChar), name).toBe(true);
  });

  it('にゅうりょくの ゆれを そろえる', () => {
    expect(normalizeLetterText(' だいすき! ありがとう? ')).toBe('だいすき！ ありがとう？');
    expect(normalizeLetterText('またね～　♥')).toBe('またね〜 ♡');
    expect(normalizeLetterText('またね～ ❤️')).toBe('またね〜 ♡');
  });

  it('きごうの かきじゅんは じぶん じしんで ごうかくする', () => {
    for (const ch of ['、', '。', '！', '？', '♡', '〜']) {
      const s = getStrokes(ch)!;
      expect(s, ch).not.toBeNull();
      expect(s.numbers.length).toBe(s.paths.length);
      for (const p of s.points) expect(evaluateStroke(p, p, { level: 'hard' }).ok, ch).toBe(true);
    }
    // まるは はんたいまわりでも よい
    const maru = getStrokes('。')!;
    expect(maru.alts?.[0]).toBeTruthy();
    expect(evaluateStroke(maru.alts![0]!, maru.points[0], { level: 'easy' }).ok).toBe(false);
  });
});
