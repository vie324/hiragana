import { beforeEach, describe, expect, it } from 'vitest';

// node には localStorage が ないので かんたんな ものを よういする
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
  },
});

const letters = await import('./letters');
const store = await import('./store');
const backup = await import('./backup');
const { letterSlots } = await import('../lib/letterLayout');

const INK: [number, number][][] = [
  [
    [20, 30],
    [60.5, 31.2],
  ],
];

describe('letters', () => {
  beforeEach(() => {
    mem.clear();
    letters.clearLetters();
    store.replaceData(store.defaultData());
  });

  it('つくって、かいて、ポストに いれる', () => {
    const l = letters.createLetter({ to: 'まま', toId: 'mama', from: 'ゆい', lines: ['だいすき'] });
    expect(letters.getLetter(l.id)?.paper).toBe('sakura');
    const slots = letterSlots(l);
    expect(letters.missingSlots(letters.getLetter(l.id)!).length).toBe(slots.length);
    for (const s of slots) letters.setLetterInk(l.id, s, INK, s.ch === 'だ');
    const done = letters.getLetter(l.id)!;
    expect(letters.isLetterDone(done)).toBe(true);
    expect(done.ink[slots.find((s) => s.ch === 'だ')!.key].practice).toBe(true);
    letters.postLetter(l.id);
    expect(letters.getLetter(l.id)!.posted).toBeGreaterThan(0);
    // ほぞん されている
    expect(JSON.parse(mem.get('hiragana-bouken:letters')!).letters[0].id).toBe(l.id);
  });

  it('ぶんを かえたら、もじが かわった ところだけ かきなおす', () => {
    const l = letters.createLetter({ to: 'ぱぱ', from: 'ゆい', lines: ['ありがとう'] });
    for (const s of letterSlots(l)) letters.setLetterInk(l.id, s, INK);
    letters.updateLetter(l.id, (d) => {
      d.lines = ['ありがと〜'];
      letters.pruneInk(d);
    });
    const after = letters.getLetter(l.id)!;
    expect(letters.missingSlots(after).map((s) => s.ch)).toEqual(['〜']);
    expect(Object.keys(after.ink)).not.toContain('b0.4');
  });

  it('なにも かいていない かきかけは、あたらしい てがみを つくると きえる', () => {
    const empty = letters.createLetter({ to: 'まま', from: '' });
    const written = letters.createLetter({ to: 'ぱぱ', from: '' });
    letters.setLetterInk(written.id, letterSlots(written)[0], INK);
    letters.createLetter({ to: 'せんせい', from: '' });
    const ids = letters.getLetters().map((l) => l.id);
    expect(ids).not.toContain(empty.id);
    expect(ids).toContain(written.id);
    expect(letters.getLetters()[0].to).toBe('せんせい');
  });

  it('じぶんで いれた あて名を おぼえる (あたらしい じゅん・4つまで)', () => {
    for (const n of ['けんた', 'はな', 'けんた', 'りく', 'そら', 'みお']) letters.rememberName(n);
    expect(letters.recentNames()).toEqual(['みお', 'そら', 'りく', 'けんた']);
  });

  it('こわれた データは すてるか なおす', () => {
    letters.importLetters({
      letters: [
        {
          id: 'a',
          to: 'まま',
          lines: ['だいすき', 3],
          ink: { t0: { ch: 'ま', ink: INK }, t1: { ch: 'ま', ink: 'x' } },
          paper: 'nope',
          stickers: [{ s: '⭐', x: 10 }, { x: 1 }],
        },
        { to: 'id が ない' },
        'oops',
      ],
      recent: ['けんた', 4],
    });
    const all = letters.getLetters();
    expect(all.length).toBe(1);
    expect(all[0].lines).toEqual(['だいすき']);
    expect(Object.keys(all[0].ink)).toEqual(['t0']);
    expect(all[0].paper).toBe('sakura');
    expect(all[0].stickers).toEqual([expect.objectContaining({ s: '⭐', x: 10, y: 50, k: 1 })]);
    expect(letters.recentNames()).toEqual(['けんた']);
  });

  it('バックアップに はいり、よみこむと もどる', () => {
    store.update((d) => void (d.profile.name = 'ゆい'));
    const l = letters.createLetter({ to: 'まま', from: 'ゆい', lines: ['だいすき'] });
    letters.setLetterInk(l.id, letterSlots(l)[0], INK);
    const text = backup.backupPayload();
    letters.clearLetters();
    const parsed = backup.parseBackup(text);
    expect(parsed.summary.letters).toBe(1);
    backup.restoreBackup(parsed);
    expect(letters.getLetters().map((x) => x.id)).toEqual([l.id]);
    // もとに もどすと よみこむ まえ (てがみ なし) に もどる
    expect(backup.applyUndo()).toBe(true);
    expect(letters.getLetters()).toEqual([]);
  });

  it('てがみが ない ふるい バックアップでは、いまの てがみを のこす', () => {
    const l = letters.createLetter({ to: 'まま', from: '', lines: ['だいすき'] });
    letters.setLetterInk(l.id, letterSlots(l)[0], INK);
    const old = JSON.stringify({ app: 'hiragana-bouken', data: store.defaultData() });
    const parsed = backup.parseBackup(old);
    expect(parsed.summary.letters).toBeNull();
    backup.restoreBackup(parsed);
    expect(letters.getLetters().length).toBe(1);
  });
});
