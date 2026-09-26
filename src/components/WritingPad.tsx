import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStrokes } from '../lib/strokes';
import { evaluateStroke, resample, simplify, starsFromScores, type Pt, type StrokeResult, type WriteLevel } from '../lib/stroke';
import type { FingerMode } from '../state/store';
import { GridLines } from './StrokeOrder';
import { sfx } from '../lib/sound';
import './writing.css';

export type PadMode = 'trace' | 'faint' | 'blank';

export interface PadResult {
  stars: 1 | 2 | 3;
  scores: number[];
  strokes: Pt[][];
  retries: number;
}

interface Props {
  kana: string;
  mode: PadMode;
  level: WriteLevel;
  finger: FingerMode;
  /** かわると さいしょから */
  resetKey?: number;
  /** かわると いまの 画の おてほんを うごかして みせる */
  hintKey?: number;
  onStroke?: (index: number, result: StrokeResult, total: number) => void;
  onComplete: (r: PadResult) => void;
  /** 画を なぞりはじめた */
  onStart?: () => void;
}

const INK_COLORS = ['#ff6b8b', '#ff9f43', '#4db4ff', '#4cc76f', '#a78bff', '#ff7eaa'];
const MAX_TRIES = 3;

/** pen を いちど つかったら 指の タッチは むし する (てのひら たいさく) */
let penSeen = false;

function toPath(pts: readonly Pt[]): string {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} l0.01,0`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const l = pts[pts.length - 1];
  d += ` L${l.x.toFixed(1)},${l.y.toFixed(1)}`;
  return d;
}

/** 画の うえを うごいて かくむきを おしえる まる */
function HintDot({ pts, delay = 250, dur = 1300, repeat = 2 }: { pts: readonly Pt[]; delay?: number; dur?: number; repeat?: number }) {
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const path = resample(pts, 60);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (t: number) => {
      const el = ref.current;
      if (!el) return;
      const e = t - start;
      if (e < 0) {
        el.setAttribute('opacity', '0');
        raf = requestAnimationFrame(tick);
        return;
      }
      if (e >= dur * repeat) {
        el.setAttribute('opacity', '0');
        return;
      }
      const f = (e % dur) / dur;
      const eased = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      const p = path[Math.min(path.length - 1, Math.round(eased * (path.length - 1)))];
      el.setAttribute('cx', p.x.toFixed(2));
      el.setAttribute('cy', p.y.toFixed(2));
      el.setAttribute('opacity', '1');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pts, delay, dur, repeat]);
  return <circle ref={ref} r="3.6" fill="#ff6b8b" stroke="#fff" strokeWidth="1.4" opacity="0" className="hint-dot" />;
}

export default function WritingPad({ kana, mode, level, finger, resetKey = 0, hintKey = 0, onStroke, onComplete, onStart }: Props) {
  const data = getStrokes(kana);
  const svgRef = useRef<SVGSVGElement>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const active = useRef<{ id: number; type: string; pts: Pt[] } | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<{ pts: Pt[]; auto?: boolean }[]>([]);
  const [failed, setFailed] = useState<{ d: string; key: number } | null>(null);
  const [hint, setHint] = useState(0);
  const [sparkle, setSparkle] = useState<{ p: Pt; key: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const scores = useRef<number[]>([]);
  const tries = useRef(0);
  const retries = useRef(0);
  const cb = useRef({ onStroke, onComplete, onStart });
  cb.current = { onStroke, onComplete, onStart };

  const total = data?.paths.length ?? 0;

  // リセット
  useEffect(() => {
    setIndex(0);
    setDone([]);
    setFailed(null);
    setFinished(false);
    scores.current = [];
    tries.current = 0;
    retries.current = 0;
    setHint((h) => h + 1);
  }, [kana, resetKey, mode]);

  useEffect(() => {
    if (hintKey) setHint((h) => h + 1);
  }, [hintKey]);

  const toLocal = useCallback((e: { clientX: number; clientY: number }): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 109, y: ((e.clientY - r.top) / r.height) * 109 };
  }, []);

  const finishStroke = useCallback(
    (pts: Pt[]) => {
      if (!data || finished) return;
      const ref = data.points[index];
      const result = evaluateStroke(pts, ref, { level, noGuide: mode === 'blank' });
      if (result.reason === 'short' && pts.length < 3) {
        // タップだけ: なにも しない
        return;
      }
      cb.current.onStroke?.(index, result, total);
      if (result.ok) {
        sfx.stroke();
        scores.current.push(result.score);
        const next = [...done, { pts: simplify(pts, 0.35) }];
        setDone(next);
        setSparkle({ p: pts[pts.length - 1], key: Date.now() });
        tries.current = 0;
        if (index + 1 >= total) {
          setFinished(true);
          const stars = starsFromScores(scores.current, retries.current);
          setTimeout(() => cb.current.onComplete({ stars, scores: scores.current, strokes: next.map((s) => s.pts), retries: retries.current }), 450);
        } else {
          setIndex(index + 1);
          if (mode === 'trace') setHint((h) => h + 1);
        }
      } else {
        sfx.wrong();
        tries.current += 1;
        retries.current += 1;
        setFailed({ d: toPath(pts), key: Date.now() });
        if (tries.current >= MAX_TRIES) {
          // 3かい まちがえたら いっしょに かく (おてほんを つかう)
          tries.current = 0;
          scores.current.push(0.1);
          const next = [...done, { pts: ref, auto: true }];
          setDone(next);
          if (index + 1 >= total) {
            setFinished(true);
            const stars = starsFromScores(scores.current, retries.current);
            setTimeout(() => cb.current.onComplete({ stars, scores: scores.current, strokes: next.map((s) => s.pts), retries: retries.current }), 700);
          } else {
            setIndex(index + 1);
          }
        }
        setHint((h) => h + 1);
      }
    },
    [data, done, finished, index, level, mode, total],
  );

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (finished || !data) return;
    if (e.pointerType === 'pen') penSeen = true;
    if (e.pointerType === 'touch') {
      if (finger === 'pen') return;
      if (finger === 'auto' && penSeen) return;
    }
    if (active.current) {
      // てのひらの あとに ペンが きたら ペンを ゆうせん
      if (e.pointerType === 'pen' && active.current.type !== 'pen') {
        active.current = null;
      } else {
        return;
      }
    }
    e.preventDefault();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    const p = toLocal(e);
    active.current = { id: e.pointerId, type: e.pointerType, pts: [p] };
    if (liveRef.current) liveRef.current.setAttribute('d', toPath([p]));
    setFailed(null);
    cb.current.onStart?.();
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = active.current;
    if (!a || a.id !== e.pointerId) return;
    e.preventDefault();
    const native = e.nativeEvent as PointerEvent;
    const events = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
    const list = events.length ? events : [native];
    for (const ev of list) {
      const p = toLocal(ev);
      const last = a.pts[a.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= 0.35) a.pts.push(p);
    }
    if (liveRef.current) liveRef.current.setAttribute('d', toPath(a.pts));
  };

  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = active.current;
    if (!a || a.id !== e.pointerId) return;
    active.current = null;
    if (e.type !== 'pointercancel' || a.pts.length > 4) {
      const p = toLocal(e);
      const last = a.pts[a.pts.length - 1];
      if (e.type !== 'pointercancel' && Math.hypot(p.x - last.x, p.y - last.y) > 0.3) a.pts.push(p);
      finishStroke(a.pts);
    }
    if (liveRef.current) liveRef.current.setAttribute('d', '');
  };

  const current = data && !finished ? data.paths[index] : null;
  const currentStart = data && !finished ? data.points[index][0] : null;
  const arrow = useMemo(() => {
    if (!data || finished) return null;
    const pts = data.points[index];
    if (pts.length < 3) return null;
    // 画の 35% あたりに やじるし
    const i = Math.min(pts.length - 2, Math.max(1, Math.floor(pts.length * 0.4)));
    const a = pts[i - 1];
    const b = pts[i + 1];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return { x: pts[i].x, y: pts[i].y, ang };
  }, [data, index, finished]);

  if (!data) return null;
  const guideOpacity = mode === 'trace' ? 1 : mode === 'faint' ? 0.45 : 0;

  return (
    <svg
      ref={svgRef}
      className={`writing-pad ${finished ? 'finished' : ''}`}
      viewBox="0 0 109 109"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="writing-pad"
      data-stroke-index={index}
      data-total={total}
    >
      <rect x="0" y="0" width="109" height="109" rx="9" fill="#fffdf8" />
      <GridLines />
      {/* おてほん */}
      <g fill="none" stroke="#e7dccf" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" opacity={guideOpacity}>
        {data.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* いまの 画 */}
      {current && mode !== 'blank' && (
        <g opacity={mode === 'trace' ? 1 : 0.7}>
          <path d={current} fill="none" stroke="#ffd9a8" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" />
          {arrow && mode === 'trace' && (
            <g transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.ang})`} opacity="0.9">
              <path d="M-3,-3.2 L3,0 L-3,3.2" fill="none" stroke="#e2691a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
      )}
      {/* かいた 画 */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {done.map((s, i) => (
          <path
            key={i}
            d={s.auto ? data.paths[i] : toPath(s.pts)}
            stroke={finished ? '#ff8f3f' : INK_COLORS[i % INK_COLORS.length]}
            strokeWidth="7.5"
            className={`ink-done ${s.auto ? 'auto' : ''}`}
          />
        ))}
      </g>
      {/* まちがえた 画 (きえていく) */}
      {failed && <path key={failed.key} d={failed.d} fill="none" stroke="#b9aea3" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="ink-failed" />}
      {/* ヒント: スタートの まる と うごく まる */}
      {current && currentStart && (mode === 'trace' || hint > 0) && (
        <g key={`hint-${hint}-${index}`} className={mode === 'trace' ? '' : 'hint-flash'}>
          {mode !== 'trace' && <path d={current} fill="none" stroke="#ffcf8a" strokeWidth="8" strokeLinecap="round" className="hint-path" />}
          <circle cx={currentStart.x} cy={currentStart.y} r="6" fill="#4cc76f" className="start-dot" />
          <text x={currentStart.x} y={currentStart.y + 0.3} fontSize="7" textAnchor="middle" dominantBaseline="central" fill="#fff" fontWeight="700" fontFamily="sans-serif">
            {index + 1}
          </text>
          <HintDot pts={data.points[index]} />
        </g>
      )}
      {sparkle && (
        <g key={sparkle.key} transform={`translate(${sparkle.p.x} ${sparkle.p.y})`} className="stroke-sparkle">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} r="1.6" fill="#ffd23f" style={{ ['--a' as string]: `${a}deg` }} />
          ))}
        </g>
      )}
      {/* なぞっている 画 */}
      <path ref={liveRef} fill="none" stroke={INK_COLORS[index % INK_COLORS.length]} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
