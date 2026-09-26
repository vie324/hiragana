/**
 * 手書きの 1画を お手本 (KanjiVG の 109x109 座標) と くらべる ための 計算。
 * 4さいの こどもでも たのしく つづけられるよう、ゆるめに はんていする。
 */

export interface Pt {
  x: number;
  y: number;
}

/** KanjiVG の 座標系の おおきさ */
export const BOX = 109;

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** SVG path の d 属性を 折れ線に する (M L H V C S Q T Z と 相対コマンドに 対応) */
export function flattenPath(d: string, steps = 16): Pt[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const pts: Pt[] = [];
  let i = 0;
  let cmd = '';
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  let lastCtrl: Pt | null = null;
  let lastCmd = '';
  const num = () => Number(tokens[i++]);
  const isNum = (t: string | undefined) => t !== undefined && !/^[a-zA-Z]$/.test(t);

  const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) => {
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      pts.push({
        x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
        y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
      });
    }
  };
  const quad = (p0: Pt, p1: Pt, p2: Pt) => {
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      pts.push({
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      });
    }
  };

  while (i < tokens.length) {
    if (!isNum(tokens[i])) {
      cmd = tokens[i++];
    } else if (cmd === 'M') {
      cmd = 'L';
    } else if (cmd === 'm') {
      cmd = 'l';
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cur.x : 0;
    const oy = rel ? cur.y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        cur = { x: ox + num(), y: oy + num() };
        start = cur;
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case 'L': {
        cur = { x: ox + num(), y: oy + num() };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case 'H': {
        cur = { x: (rel ? cur.x : 0) + num(), y: cur.y };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case 'V': {
        cur = { x: cur.x, y: (rel ? cur.y : 0) + num() };
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case 'C': {
        const p1 = { x: ox + num(), y: oy + num() };
        const p2 = { x: ox + num(), y: oy + num() };
        const p3 = { x: ox + num(), y: oy + num() };
        cubic(cur, p1, p2, p3);
        lastCtrl = p2;
        cur = p3;
        break;
      }
      case 'S': {
        const p1: Pt =
          lastCtrl && /[CS]/i.test(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
        const p2 = { x: ox + num(), y: oy + num() };
        const p3 = { x: ox + num(), y: oy + num() };
        cubic(cur, p1, p2, p3);
        lastCtrl = p2;
        cur = p3;
        break;
      }
      case 'Q': {
        const p1 = { x: ox + num(), y: oy + num() };
        const p2 = { x: ox + num(), y: oy + num() };
        quad(cur, p1, p2);
        lastCtrl = p1;
        cur = p2;
        break;
      }
      case 'T': {
        const p1: Pt =
          lastCtrl && /[QT]/i.test(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur;
        const p2 = { x: ox + num(), y: oy + num() };
        quad(cur, p1, p2);
        lastCtrl = p1;
        cur = p2;
        break;
      }
      case 'Z': {
        cur = start;
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      default:
        // 未対応コマンドは 読みとばす
        i++;
    }
    lastCmd = cmd;
  }
  return pts;
}

export function polylineLength(p: readonly Pt[]): number {
  let len = 0;
  for (let i = 1; i < p.length; i++) len += dist(p[i - 1], p[i]);
  return len;
}

/** 折れ線を 弧長で 等間隔の n 点に しなおす */
export function resample(p: readonly Pt[], n: number): Pt[] {
  if (p.length === 0) return [];
  if (p.length === 1 || n < 2) return Array.from({ length: Math.max(n, 1) }, () => ({ ...p[0] }));
  const total = polylineLength(p);
  if (total === 0) return Array.from({ length: n }, () => ({ ...p[0] }));
  const step = total / (n - 1);
  const out: Pt[] = [{ ...p[0] }];
  let acc = 0;
  let target = step;
  for (let i = 1; i < p.length && out.length < n - 1; i++) {
    const a = p[i - 1];
    const b = p[i];
    const seg = dist(a, b);
    while (seg > 0 && acc + seg >= target && out.length < n - 1) {
      const t = (target - acc) / seg;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      target += step;
    }
    acc += seg;
  }
  out.push({ ...p[p.length - 1] });
  while (out.length < n) out.push({ ...p[p.length - 1] });
  return out;
}

/** DTW による 平均距離 (1ステップあたり) */
export function dtwDistance(a: readonly Pt[], b: readonly Pt[]): number {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;
  const cost = new Float64Array(n * m);
  const steps = new Float64Array(n * m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const c = dist(a[i], b[j]);
      const k = i * m + j;
      if (i === 0 && j === 0) {
        cost[k] = c;
        steps[k] = 1;
        continue;
      }
      let best = Infinity;
      let bestSteps = 0;
      if (i > 0 && cost[k - m] < best) {
        best = cost[k - m];
        bestSteps = steps[k - m];
      }
      if (j > 0 && cost[k - 1] < best) {
        best = cost[k - 1];
        bestSteps = steps[k - 1];
      }
      if (i > 0 && j > 0 && cost[k - m - 1] <= best) {
        best = cost[k - m - 1];
        bestSteps = steps[k - m - 1];
      }
      cost[k] = best + c;
      steps[k] = bestSteps + 1;
    }
  }
  return cost[n * m - 1] / steps[n * m - 1];
}

export type WriteLevel = 'easy' | 'normal' | 'hard';

export type StrokeReason = 'ok' | 'short' | 'long' | 'reverse' | 'start' | 'far';

export interface StrokeResult {
  ok: boolean;
  /** 0〜1 (1 が お手本どおり) */
  score: number;
  reason: StrokeReason;
  /** 判定に つかった ずれの おおきさ (109座標) */
  error: number;
}

export interface EvaluateOptions {
  level: WriteLevel;
  /** お手本を みないで かく モード (すこし ゆるくする) */
  noGuide?: boolean;
}

const BASE_TOL: Record<WriteLevel, number> = { easy: 16, normal: 12, hard: 9 };
const LEN_RANGE: Record<WriteLevel, [number, number]> = {
  easy: [0.35, 2.6],
  normal: [0.45, 2.1],
  hard: [0.55, 1.7],
};

const N = 32;

/** 1画を はんていする */
export function evaluateStroke(user: readonly Pt[], ref: readonly Pt[], opts: EvaluateOptions): StrokeResult {
  const { level } = opts;
  const lenU = polylineLength(user);
  const lenR = polylineLength(ref);
  const shortRef = lenR < 14;
  const tol = BASE_TOL[level] * (opts.noGuide ? 1.35 : 1) * (1 + Math.min(Math.max((lenR - 40) / 150, 0), 0.5));

  // ながさ
  const [minR, maxR] = LEN_RANGE[level];
  const minLen = shortRef ? Math.min(3, lenR * 0.3) : lenR * minR;
  const maxLen = shortRef ? lenR + 28 : lenR * maxR + 10;
  if (user.length < 2 || lenU < minLen) return { ok: false, score: 0, reason: 'short', error: Infinity };

  const u = resample(user, N);
  const r = resample(ref, N);
  const uRev = u.slice().reverse();

  // むき (はじめと おわりが 逆になっていないか)
  const fwd = dist(u[0], r[0]) + dist(u[N - 1], r[N - 1]);
  const bwd = dist(u[0], r[N - 1]) + dist(u[N - 1], r[0]);
  const reversed = !shortRef && bwd < fwd * 0.7;

  const error = reversed && level === 'easy' ? dtwDistance(uRev, r) : dtwDistance(u, r);
  const score = Math.max(0, Math.min(1, 1 - error / (tol * 1.15)));

  if (reversed && level !== 'easy') {
    return { ok: false, score: 0, reason: 'reverse', error };
  }
  if (lenU > maxLen) return { ok: false, score, reason: 'long', error };
  if (level !== 'easy' && !reversed && dist(u[0], r[0]) > tol * 1.9) {
    return { ok: false, score, reason: 'start', error };
  }
  if (error > tol) return { ok: false, score, reason: 'far', error };
  return { ok: true, score, reason: 'ok', error };
}

/** 画の とくてんの 平均から ほし(1〜3)を きめる */
export function starsFromScores(scores: readonly number[], retries = 0): 1 | 2 | 3 {
  if (!scores.length) return 1;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length - retries * 0.05;
  if (avg >= 0.5) return 3;
  if (avg >= 0.25) return 2;
  return 1;
}

/** 間引き (Ramer–Douglas–Peucker) : 保存サイズを へらす */
export function simplify(points: readonly Pt[], epsilon = 0.6): Pt[] {
  if (points.length < 3) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let index = -1;
  let maxD = 0;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const d = Math.abs(dy * p.x - dx * p.y + last.x * first.y - last.y * first.x) / len;
    if (d > maxD) {
      maxD = d;
      index = i;
    }
  }
  if (maxD > epsilon && index > 0) {
    const left = simplify(points.slice(0, index + 1), epsilon);
    const right = simplify(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}
