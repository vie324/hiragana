import { describe, expect, it } from 'vitest';
import { NAME_MARK, isTinyFragment, splitNames, splitSentences, voiceKey } from './split';
import { buildCatalog } from './catalog';
import { L, WRITE_MODE_SAY } from './lines';
import { WORDS, lastSound } from '../data/words';
import { BASIC_KANA, WRITABLE_KANA, splitUnits } from '../lib/kana';
import { BOOKS, tokenize } from '../data/books';

describe('split', () => {
  it('ぶんに わける', () => {
    expect(splitSentences('「あ」! あたり!')).toEqual(['「あ」!', 'あたり!']);
    expect(splitSentences('これは「あ」。「い」は どれかな?')).toEqual(['これは「あ」。', '「い」は どれかな?']);
    expect(splitSentences('もういちど、よんで みよう。')).toEqual(['もういちど、よんで みよう。']);
    expect(splitSentences('あげよう。」')).toEqual(['あげよう。」']);
    expect(splitSentences('ふわ ふわ……')).toEqual(['ふわ ふわ……']);
    expect(splitSentences('  ')).toEqual([]);
  });

  it('キーは 空白と さいごの 。を むしする', () => {
    expect(voiceKey('なぞって かこう。')).toBe(voiceKey('なぞって かこう'));
    expect(voiceKey('すごい！')).toBe('すごい!');
    expect(voiceKey('どれかな?')).not.toBe(voiceKey('どれかな'));
  });

  it('なまえで わける', () => {
    expect(splitNames('ゆいちゃん、つぎは なにに する?', ['ゆいちゃん'])).toEqual([{ name: 'ゆいちゃん' }, { text: 'つぎは なにに する?' }]);
    expect(splitNames('やったあ!', ['ゆいちゃん'])).toEqual([{ text: 'やったあ!' }]);
    expect(splitNames('ゆいちゃんも', ['ゆいちゃん', 'もこ'])).toEqual([{ name: 'ゆいちゃん' }, { text: 'も' }]);
    expect(isTinyFragment('も')).toBe(true);
    expect(isTinyFragment('の なまえを かこう!')).toBe(false);
  });
});

describe('catalog', () => {
  const entries = buildCatalog(['シールを もらったよ!']);
  const keys = new Set(entries.map((e) => e.key));

  /** アプリの planVoice と おなじ きまりで、ぜんぶ 声の ファイルが あるか */
  const covered = (text: string, names: string[] = []) =>
    splitSentences(text).every((s) => {
      if (keys.has(voiceKey(s))) return true;
      const pieces = splitNames(s, names);
      return pieces.some((p) => 'name' in p) && pieces.every((p) => 'name' in p || keys.has(voiceKey(p.text)) || isTinyFragment(p.text));
    });

  it('キーが かさならず、なまえの めじるしを ふくまない', () => {
    expect(keys.size).toBe(entries.length);
    expect(entries.some((e) => e.text.includes(NAME_MARK))).toBe(false);
    expect(entries.length).toBeGreaterThan(1000);
  });

  it('もじ・ことばの セリフが ぜんぶ ある', () => {
    for (const k of BASIC_KANA) {
      expect(covered(L.balloonAsk(k)), k).toBe(true);
      expect(covered(L.lessonIntro(k)), k).toBe(true);
      expect(covered(L.findOther('あ', k)), k).toBe(true);
    }
    for (const k of WRITABLE_KANA) {
      expect(covered(L.writeKana(k, WRITE_MODE_SAY.blank)), k).toBe(true);
      expect(covered(L.nameStart('ゆいちゃん', k), ['ゆいちゃん']), k).toBe(true);
    }
    for (const w of WORDS) {
      const first = splitUnits(w.w)[0];
      expect(covered(L.firstMiss(w, first)), w.w).toBe(true);
      expect(covered(L.readMiss(w)), w.w).toBe(true);
      expect(covered(L.shiriAsk(w, lastSound(w.w))), w.w).toBe(true);
      expect(covered(L.buildMiss(splitUnits(w.w)[0], false)), w.w).toBe(true);
    }
  });

  it('なまえが はいる セリフは なまえ いがいが ある', () => {
    const names = ['さくらちゃん', 'もこ'];
    expect(covered(L.homeNext('さくらちゃん'), names)).toBe(true);
    expect(covered(L.sleep('さくらちゃん'), names)).toBe(true);
    expect(covered(L.nameDone('さくらちゃん'), names)).toBe(true);
    expect(covered(L.hello('きみ', 'おはよう'))).toBe(true);
    expect(covered('シールを もらったよ!')).toBe(true);
  });

  it('あいぼうの なまえを かえても、なまえ いがいは ある', () => {
    const names = ['さくらちゃん', 'ぴょん'];
    expect(covered(L.dressAsk('ぴょん'), names)).toBe(true);
    expect(covered(L.gotOutfit('リボン', 'ぴょん'), names)).toBe(true);
    for (const b of BOOKS) {
      for (const p of b.pages) {
        for (const line of tokenize(p.text, { name: 'さくらちゃん', buddy: 'ぴょん' })) {
          for (const t of line) expect(covered(t.say, names), `${b.id}: ${t.say}`).toBe(true);
        }
      }
    }
  });

  it('えほんの ことばが ぜんぶ ある (なまえ いがい)', () => {
    const names = ['さくらちゃん', 'もこ'];
    for (const b of BOOKS) {
      for (const p of b.pages) {
        for (const line of tokenize(p.text, { name: 'さくらちゃん', buddy: 'もこ' })) {
          for (const t of line) expect(covered(t.say, names), `${b.id}: ${t.say}`).toBe(true);
        }
      }
    }
  });
});
