/**
 * うごく そら (あさ・ひる・ゆうがた・よる で いろが かわる)。
 * くもが ながれ、よるは ほしが きらきら。ときどき とんでくる ふうせんは タッチで われる。
 */
import { useEffect, useRef, useState } from 'react';
import { mulberry32 } from '../lib/random';
import { sfx } from '../lib/sound';
import { burstAt } from '../lib/confetti';
import './sky.css';

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export function dayPhase(d = new Date()): DayPhase {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 16) return 'day';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

const rng = mulberry32(42);
const STARS = Array.from({ length: 26 }, () => ({
  x: rng() * 100,
  y: rng() * 52,
  s: 2 + rng() * 3,
  d: rng() * 4,
}));

const BALLOON_COLORS = ['#ff6b8b', '#4db4ff', '#ffc21a', '#4cc76f', '#a78bff', '#ff9f43'];

function Cloud({ className }: { className: string }) {
  return (
    <svg className={`cloud ${className}`} viewBox="0 0 120 60" aria-hidden>
      <path d="M22 52 a17 17 0 0 1 3 -33 a24 24 0 0 1 44 -7 a19 19 0 0 1 33 13 a14 14 0 0 1 -3 27 z" />
    </svg>
  );
}

interface FloatBalloon {
  id: number;
  left: number;
  color: string;
}

/** ときどき とんでくる ふうせん (left の はんい: %) */
function Balloons({ range }: { range: [number, number] }) {
  const [list, setList] = useState<FloatBalloon[]>([]);
  const id = useRef(0);
  const [lo, hi] = range;
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const spawn = () => {
      if (!document.hidden) {
        const b = {
          id: ++id.current,
          left: lo + Math.random() * (hi - lo),
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        };
        setList((l) => [...l.slice(-2), b]);
      }
      t = setTimeout(spawn, 14000 + Math.random() * 12000);
    };
    t = setTimeout(spawn, 5000);
    return () => clearTimeout(t);
  }, [lo, hi]);
  const remove = (bid: number) => setList((l) => l.filter((x) => x.id !== bid));
  return (
    <>
      {list.map((b) => (
        <button
          key={b.id}
          type="button"
          className="sky-balloon"
          style={{ left: `${b.left}%`, ['--c' as string]: b.color }}
          aria-label="ふうせん"
          onAnimationEnd={() => remove(b.id)}
          onClick={(e) => {
            sfx.pop();
            burstAt(e.currentTarget, 26);
            remove(b.id);
          }}
        />
      ))}
    </>
  );
}

const DEFAULT_RANGE: [number, number] = [4, 30];

export default function SkyScene({ phase = dayPhase(), balloons = false, balloonRange = DEFAULT_RANGE }: { phase?: DayPhase; balloons?: boolean; balloonRange?: [number, number] }) {
  return (
    <div className={`sky-scene phase-${phase}`} data-phase={phase}>
      <div className="sky-gradient" />
      {phase === 'night' ? (
        <>
          <div className="sky-stars" aria-hidden>
            {STARS.map((s, i) => (
              <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
            ))}
          </div>
          <div className="moon" aria-hidden />
        </>
      ) : (
        <div className="sun" aria-hidden />
      )}
      <div className="clouds" aria-hidden>
        <Cloud className="c1" />
        <Cloud className="c2" />
        <Cloud className="c3" />
      </div>
      {balloons && <Balloons range={balloonRange} />}
      <svg className="hills" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden>
        <path className="hill h1" d="M0 170 C 170 110 360 118 540 158 C 720 198 900 110 1200 140 L1200 400 L0 400 Z" />
        <path className="hill h2" d="M0 250 C 220 190 430 222 610 244 C 810 268 990 204 1200 224 L1200 400 L0 400 Z" />
        <path className="hill h3" d="M0 320 C 260 282 520 312 760 322 C 960 330 1100 294 1200 304 L1200 400 L0 400 Z" />
      </svg>
    </div>
  );
}
