import { beforeEach, describe, expect, it } from 'vitest';
import { daysReading, levelInfo, missionStates, streakDays, streakWorthPraising, unseenMissions, xpToNext } from './progress';
import { missionsFor, MISSIONS, MISSION_XP } from '../data/missions';
import { defaultData, getData, normalizeData, replaceData, todayKey } from './store';
import { completeActivity, markMissionsSeen, openMissionChest, recordWriting, waterTree } from './actions';
import { RARE } from '../data/stickers';

describe('levels', () => {
  it('grows the needed xp a little every level', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 8 });
    expect(levelInfo(7)).toEqual({ level: 1, into: 7, need: 8 });
    expect(levelInfo(8)).toEqual({ level: 2, into: 0, need: 12 });
    expect(levelInfo(8 + 12 + 5)).toEqual({ level: 3, into: 5, need: 16 });
    expect(xpToNext(10)).toBe(44);
    expect(levelInfo(1e9).level).toBe(99);
    expect(levelInfo(-5).level).toBe(1);
    expect(levelInfo(Number.NaN).level).toBe(1);
  });
});

describe('streak', () => {
  const day = (acts: number) => ({ sec: 0, acts, stamp: acts > 0 });
  const now = new Date(2026, 8, 26, 9);

  it('counts days in a row up to today (or yesterday)', () => {
    expect(streakDays({}, now)).toBe(0);
    expect(streakDays({ '2026-09-26': day(1) }, now)).toBe(1);
    expect(streakDays({ '2026-09-24': day(1), '2026-09-25': day(2), '2026-09-26': day(1) }, now)).toBe(3);
    // きょうは まだ → きのうまでの ぶん
    expect(streakDays({ '2026-09-24': day(1), '2026-09-25': day(2) }, now)).toBe(2);
    // あいだが あいたら きれる
    expect(streakDays({ '2026-09-23': day(1), '2026-09-25': day(2), '2026-09-26': day(1) }, now)).toBe(2);
    // みずやり だけの ひは かぞえない
    expect(streakDays({ '2026-09-25': { sec: 0, acts: 0, stamp: false, water: true }, '2026-09-26': day(1) }, now)).toBe(1);
  });

  it('crosses month and year boundaries', () => {
    expect(streakDays({ '2026-12-31': day(1), '2027-01-01': day(1) }, new Date(2027, 0, 1, 20))).toBe(2);
  });

  it('reads day counts naturally', () => {
    expect(daysReading(3)).toBe('みっか');
    expect(daysReading(20)).toBe('はつか');
    expect(daysReading(11)).toBe('11にち');
    expect(streakWorthPraising(1)).toBe(false);
    expect(streakWorthPraising(2)).toBe(true);
    expect(streakWorthPraising(33)).toBe(false);
    expect(streakWorthPraising(40)).toBe(true);
  });
});

describe('missions', () => {
  it('always has the adventure plus two others, fixed per day', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 28; i++) {
      const key = `2026-02-${String(i).padStart(2, '0')}`;
      const ms = missionsFor(key);
      expect(ms).toHaveLength(3);
      expect(ms[0].kind).toBe('adventure');
      expect(new Set(ms.map((m) => m.kind)).size).toBe(3);
      expect(missionsFor(key)).toEqual(ms);
      ms.forEach((m) => seen.add(m.kind));
    }
    expect([...seen].sort()).toEqual(Object.keys(MISSIONS).sort());
  });
});

describe('rewards with missions and levels', () => {
  beforeEach(() => replaceData(defaultData()));

  it('counts map nodes for the adventure mission and gives bonus xp', () => {
    const first = completeActivity({ nodeId: 'a:lesson:あ', stars: 3, kind: 'lesson' });
    expect(first.stamp).toBe(true);
    expect(first.streak).toBe(1);
    expect(first.missions).toEqual([]);
    expect(first.xp).toBe(3);
    const second = completeActivity({ nodeId: 'a:lesson:い', stars: 2, kind: 'lesson' });
    expect(second.stamp).toBe(false);
    expect(second.streak).toBe(0);
    expect(second.missions).toEqual(['adventure']);
    expect(second.xp).toBe(2 + MISSION_XP);
    // レベル 1 → 2 (8)
    expect(second.levelUp).toBe(2);
    expect(getData().xp).toBe(3 + 2 + MISSION_XP);
    // 3かいめ: もう クリアずみなので でない
    expect(completeActivity({ nodeId: 'a:balloon:1', stars: 3, kind: 'game' }).missions).toEqual([]);
  });

  it('opens the chest only after all missions are done', () => {
    const key = todayKey();
    expect(openMissionChest()).toBeNull();
    for (const m of missionsFor(key)) {
      for (let i = 0; i < m.goal; i++) {
        if (m.kind === 'write') recordWriting('あ', 3);
        else completeActivity({ nodeId: m.kind === 'adventure' ? 'a:lesson:あ' : undefined, stars: 3, kind: m.kind === 'adventure' ? 'lesson' : m.kind });
      }
    }
    expect(missionStates(getData().days).every((m) => m.done)).toBe(true);
    // write だけは completeActivity を とおらないので ホームで 「クリア!」 を いう
    const unseen = unseenMissions(getData().days);
    expect(unseen.every((k) => k === 'write')).toBe(true);
    markMissionsSeen(unseen);
    expect(unseenMissions(getData().days)).toEqual([]);
    const xp = getData().xp;
    const chest = openMissionChest();
    expect(chest).not.toBeNull();
    expect(RARE.has(chest!.sticker)).toBe(true);
    expect(getData().xp).toBe(xp + 10);
    expect(openMissionChest()).toBeNull();
  });

  it('waters the tree once a day', () => {
    expect(waterTree()).toBe(true);
    expect(waterTree()).toBe(false);
    expect(getData().days[todayKey()].acts).toBe(0);
  });
});

describe('xp migration', () => {
  it('estimates xp for data saved before levels existed', () => {
    const d = normalizeData({ days: { '2026-09-01': { sec: 10, acts: 3, stamp: true }, '2026-09-02': { sec: 5, acts: 2, stamp: true } } });
    expect(d.xp).toBe(10);
    expect(normalizeData({ xp: 42 }).xp).toBe(42);
    expect(normalizeData({ xp: -3 }).xp).toBe(0);
  });

  it('drops broken day records', () => {
    const d = normalizeData({ xp: 1, days: { a: 'x', '2026-09-01': { sec: 1, acts: 1, stamp: true, m: 'oops', seen: 3 } } });
    expect(Object.keys(d.days)).toEqual(['2026-09-01']);
    expect(d.days['2026-09-01'].m).toBeUndefined();
    expect(d.days['2026-09-01'].seen).toBeUndefined();
    expect(missionStates(d.days, '2026-09-01').every((m) => m.count === 0)).toBe(true);
  });
});
