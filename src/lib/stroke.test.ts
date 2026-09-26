import { describe, expect, it } from 'vitest';
import { dtwDistance, evaluateStroke, flattenPath, polylineLength, resample, simplify, starsFromScores, type Pt } from './stroke';
import { getStrokes } from './strokes';
import { WRITABLE_KANA } from './kana';
import { mulberry32 } from './random';

const shift = (p: Pt[], dx: number, dy: number) => p.map((q) => ({ x: q.x + dx, y: q.y + dy }));
const wobble = (p: Pt[], amp: number, seed = 1) => {
  const rng = mulberry32(seed);
  return resample(p, 60).map((q) => ({ x: q.x + (rng() - 0.5) * 2 * amp, y: q.y + (rng() - 0.5) * 2 * amp }));
};

describe('flattenPath', () => {
  it('parses absolute and relative commands', () => {
    const p = flattenPath('M10,10 L20,10 l0,10 H40 v5 Z', 4);
    expect(p[0]).toEqual({ x: 10, y: 10 });
    expect(p[1]).toEqual({ x: 20, y: 10 });
    expect(p[2]).toEqual({ x: 20, y: 20 });
    expect(p[3]).toEqual({ x: 40, y: 20 });
    expect(p[4]).toEqual({ x: 40, y: 25 });
    expect(p[5]).toEqual({ x: 10, y: 10 });
  });

  it('handles KanjiVG style cubic curves with packed numbers', () => {
    const p = flattenPath('M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25', 8);
    expect(p[0]).toEqual({ x: 31.01, y: 33 });
    const last = p[p.length - 1];
    expect(last.x).toBeCloseTo(31.01 + 5.25 + 29.5, 5);
    expect(last.y).toBeCloseTo(33 + 1.75 - 4.25, 5);
  });

  it('handles smooth curve (s) reflection', () => {
    const p = flattenPath('M0,0 C0,10 10,10 10,0 S20,-10 20,0', 10);
    const last = p[p.length - 1];
    expect(last).toEqual({ x: 20, y: 0 });
    // 2つめの曲線は 下むきに ふくらむ
    expect(Math.min(...p.slice(11).map((q) => q.y))).toBeLessThan(-3);
  });
});

describe('resample', () => {
  it('returns n points with equal spacing', () => {
    const r = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 5);
    expect(r).toHaveLength(5);
    expect(r[0]).toEqual({ x: 0, y: 0 });
    expect(r[2].x).toBeCloseTo(10);
    expect(r[2].y).toBeCloseTo(0);
    expect(r[4]).toEqual({ x: 10, y: 10 });
  });
  it('copes with degenerate input', () => {
    expect(resample([{ x: 1, y: 1 }], 3)).toHaveLength(3);
    expect(resample([{ x: 1, y: 1 }, { x: 1, y: 1 }], 4)).toHaveLength(4);
  });
});

describe('dtwDistance', () => {
  it('is zero for identical and equals the offset for translated copies', () => {
    const a = resample(flattenPath('M10,10 C30,40 60,40 90,10'), 32);
    expect(dtwDistance(a, a)).toBeCloseTo(0);
    // 曲線に そった ずれは 伸縮で 吸収されるので オフセット以下になる
    const d = dtwDistance(shift(a, 5, 0), a);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThanOrEqual(5.01);
    // 直線に 垂直な ずれは そのまま
    const line = resample([{ x: 0, y: 0 }, { x: 50, y: 0 }], 32);
    expect(dtwDistance(shift(line, 0, 5), line)).toBeCloseTo(5, 1);
  });
});

describe('stroke data', () => {
  it('has data for every writable kana', () => {
    for (const k of WRITABLE_KANA) {
      const s = getStrokes(k);
      expect(s, k).not.toBeNull();
      expect(s!.paths.length).toBeGreaterThan(0);
      for (const pts of s!.points) expect(polylineLength(pts)).toBeGreaterThan(2);
    }
  });

  it('has the standard stroke counts', () => {
    const expected: Record<string, number> = { あ: 3, き: 4, さ: 3, そ: 1, ふ: 4, を: 3, ん: 1, な: 4, ほ: 4, が: 5 };
    for (const [k, n] of Object.entries(expected)) expect(getStrokes(k)!.paths.length, k).toBe(n);
  });
});

describe('evaluateStroke', () => {
  const a = getStrokes('あ')!;
  const s1 = a.points[0];
  const s2 = a.points[1];
  const s3 = a.points[2];

  it('accepts the reference stroke itself with a high score', () => {
    for (const level of ['easy', 'normal', 'hard'] as const) {
      const r = evaluateStroke(s3, s3, { level });
      expect(r.ok).toBe(true);
      expect(r.score).toBeGreaterThan(0.95);
    }
  });

  it('accepts a wobbly child-like stroke on easy and normal', () => {
    const w = wobble(s3, 4);
    expect(evaluateStroke(w, s3, { level: 'easy' }).ok).toBe(true);
    expect(evaluateStroke(w, s3, { level: 'normal' }).ok).toBe(true);
  });

  it('tolerates a small offset but rejects a large one', () => {
    expect(evaluateStroke(shift(s1, 6, 4), s1, { level: 'normal' }).ok).toBe(true);
    const far = evaluateStroke(shift(s1, 0, 30), s1, { level: 'normal' });
    expect(far.ok).toBe(false);
    expect(['far', 'start']).toContain(far.reason);
  });

  it('rejects reversed strokes except on easy', () => {
    const rev = s2.slice().reverse();
    const normal = evaluateStroke(rev, s2, { level: 'normal' });
    expect(normal.ok).toBe(false);
    expect(normal.reason).toBe('reverse');
    expect(evaluateStroke(rev, s2, { level: 'easy' }).ok).toBe(true);
  });

  it('rejects taps and tiny scribbles', () => {
    const r = evaluateStroke([{ x: 40, y: 30 }, { x: 41, y: 30 }], s1, { level: 'easy' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('short');
  });

  it('rejects the wrong stroke of the same character', () => {
    expect(evaluateStroke(s2, s1, { level: 'easy' }).ok).toBe(false);
    expect(evaluateStroke(s1, s3, { level: 'easy' }).ok).toBe(false);
  });

  it('accepts short dakuten strokes drawn roughly in place', () => {
    const ga = getStrokes('が')!;
    const dot = ga.points[3];
    expect(evaluateStroke(shift(dot, 2, 1), dot, { level: 'normal' }).ok).toBe(true);
    expect(evaluateStroke(shift(dot, 0, 40), dot, { level: 'normal' }).ok).toBe(false);
  });

  it('every reference stroke passes against itself at every level', () => {
    for (const k of ['し', 'つ', 'く', 'の', 'ぬ', 'ね', 'を', 'ゆ', 'ふ']) {
      for (const p of getStrokes(k)!.points) {
        expect(evaluateStroke(p, p, { level: 'hard' }).ok, k).toBe(true);
      }
    }
  });
});

describe('starsFromScores', () => {
  it('maps averages to stars', () => {
    expect(starsFromScores([0.9, 0.8])).toBe(3);
    expect(starsFromScores([0.3, 0.4])).toBe(2);
    expect(starsFromScores([0.1])).toBe(1);
    expect(starsFromScores([])).toBe(1);
  });
});

describe('simplify', () => {
  it('drops collinear points but keeps corners', () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 5 }];
    expect(simplify(pts, 0.1)).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 5 }]);
  });
});
