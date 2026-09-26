import { describe, expect, it } from 'vitest';
import { answer, emptyProgress, introduce, isDue, isKnown, masteryStars, pickForReview, recordWrite } from './srs';
import { mulberry32 } from './random';

const DAY = 86400_000;

describe('srs', () => {
  it('introduces a kana into box 1', () => {
    const p = introduce(undefined, 1000);
    expect(p.intro).toBe(true);
    expect(p.box).toBe(1);
    expect(masteryStars(p)).toBe(1);
    expect(isKnown(p)).toBe(false);
  });

  it('raises the box only when due', () => {
    let p = introduce(undefined, 0);
    p = answer(p, true, 1000);
    expect(p.box).toBe(2);
    expect(isKnown(p)).toBe(true);
    p = answer(p, true, 2000);
    expect(p.box).toBe(2); // まだ 間隔が たっていない
    p = answer(p, true, 2000 + DAY);
    expect(p.box).toBe(3);
    expect(p.ok).toBe(3);
    expect(masteryStars(p)).toBe(2);
  });

  it('drops one box on a mistake but never below 1', () => {
    let p = { ...emptyProgress(), intro: true, box: 3, last: 0 };
    p = answer(p, false, 10);
    expect(p.box).toBe(2);
    p = answer(answer(p, false, 20), false, 30);
    expect(p.box).toBe(1);
    expect(p.ng).toBe(3);
  });

  it('needs long-term memory and writing for 3 stars', () => {
    const p = { ...emptyProgress(), intro: true, box: 4, ok: 6 };
    expect(masteryStars(p)).toBe(2);
    expect(masteryStars(recordWrite(p, 2, 0))).toBe(3);
  });

  it('isDue respects intervals', () => {
    const p = { ...emptyProgress(), box: 3, last: 0 };
    expect(isDue(p, DAY / 2)).toBe(false);
    expect(isDue(p, DAY)).toBe(true);
  });

  it('prefers weak and due kana when picking for review', () => {
    const now = 100 * DAY;
    const progress = {
      あ: { ...emptyProgress(), intro: true, box: 5, last: now - 1000, ok: 20 },
      い: { ...emptyProgress(), intro: true, box: 1, last: now - 1000, ng: 5, ok: 1 },
    };
    const rng = mulberry32(7);
    let weakFirst = 0;
    for (let i = 0; i < 200; i++) if (pickForReview(progress, ['あ', 'い'], 1, now, rng)[0] === 'い') weakFirst++;
    expect(weakFirst).toBeGreaterThan(150);
    expect(pickForReview(progress, ['あ', 'い'], 5, now, rng)).toHaveLength(2);
  });
});
