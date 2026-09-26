import { describe, expect, it } from 'vitest';
import { defaultData, normalizeData, callName, todayKey } from './store';

describe('normalizeData (保存データの読み込み)', () => {
  it('fills defaults for empty or broken input', () => {
    expect(normalizeData({})).toEqual({ ...defaultData(), profile: { ...defaultData().profile, created: expect.any(Number) } });
    expect(normalizeData(null).settings.rate).toBe(0.9);
    expect(normalizeData('oops').profile.buddy).toBe('usagi');
  });

  it('keeps saved values and adds new keys from newer versions', () => {
    const saved = {
      v: 1,
      profile: { name: 'ゆい', buddy: 'kuma' },
      settings: { rate: 0.8, sfx: false },
      kana: { あ: { intro: true, box: 3, last: 1, ok: 4, ng: 1, write: 2, writeBest: 3 } },
      stickers: { '🐶': 2 },
    };
    const d = normalizeData(saved);
    expect(d.profile.name).toBe('ゆい');
    expect(d.profile.buddy).toBe('kuma');
    expect(d.profile.suffix).toBe('ちゃん');
    expect(d.settings.rate).toBe(0.8);
    expect(d.settings.sfx).toBe(false);
    expect(d.settings.writeLevel).toBe('easy');
    expect(d.kana['あ'].box).toBe(3);
    expect(d.stickers['🐶']).toBe(2);
    expect(d.placed).toEqual({});
  });

  it('replaces values with the wrong type by defaults', () => {
    const d = normalizeData({ settings: { rate: 'fast', unlockAll: 'yes', voiceURI: 'Kyoko' }, outfits: 'crown', wear: 'crown' });
    expect(d.settings.rate).toBe(0.9);
    expect(d.settings.unlockAll).toBe(false);
    expect(d.settings.voiceURI).toBe('Kyoko');
    expect(d.outfits).toEqual([]);
    expect(d.wear).toBe('crown');
  });
});

describe('helpers', () => {
  it('callName uses the suffix or きみ', () => {
    const p = defaultData().profile;
    expect(callName(p)).toBe('きみ');
    expect(callName({ ...p, name: 'ゆい' })).toBe('ゆいちゃん');
    expect(callName({ ...p, name: 'はると', suffix: 'くん' })).toBe('はるとくん');
  });

  it('todayKey formats local dates', () => {
    expect(todayKey(new Date(2027, 0, 5))).toBe('2027-01-05');
  });
});
