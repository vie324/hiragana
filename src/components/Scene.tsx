import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Actor, Bg } from '../data/scene';
import Mascot from './Mascot';
import { useApp } from '../state/store';
import './scene.css';

export function SceneBackground({ bg }: { bg: Bg }) {
  return (
    <svg className="scene-bg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`sky-${bg}`} x1="0" y1="0" x2="0" y2="1">
          {skyStops(bg).map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="160" height="100" fill={`url(#sky-${bg})`} />
      {BG_LAYERS[bg]}
    </svg>
  );
}

function skyStops(bg: Bg): [string, string][] {
  switch (bg) {
    case 'night':
      return [['0', '#141a4d'], ['1', '#3b3a88']];
    case 'space':
      return [['0', '#0d0f33'], ['1', '#3a2468']];
    case 'evening':
      return [['0', '#ff9a76'], ['0.6', '#ffd29d'], ['1', '#ffe9c7']];
    case 'rain':
      return [['0', '#9fb0c4'], ['1', '#d4dde8']];
    case 'hole':
      return [['0', '#8a6143'], ['1', '#5e3f29']];
    case 'room':
    case 'party':
      return [['0', '#fff1dc'], ['1', '#ffe6c4']];
    case 'kitchen':
      return [['0', '#eaf7f0'], ['1', '#d9f0e4']];
    case 'forest':
      return [['0', '#c9f0d5'], ['1', '#eefbe0']];
    case 'snow':
      return [['0', '#d7e9ff'], ['1', '#f5faff']];
    default:
      return [['0', '#9fdcff'], ['1', '#e6f8ff']];
  }
}

const cloud = (x: number, y: number, s = 1, key?: string) => (
  <g key={key ?? `c${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`} className="bg-cloud" fill="#fff">
    <ellipse cx="0" cy="0" rx="10" ry="5" />
    <ellipse cx="7" cy="-3" rx="7" ry="5" />
    <ellipse cx="-7" cy="-1" rx="6" ry="4" />
  </g>
);

const sun = (x: number, y: number) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="bg-sun-rays" stroke="#ffd23f" strokeWidth="1.6" strokeLinecap="round">
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * 14} y2={Math.sin(a) * 14} />;
      })}
    </g>
    <circle r="8" fill="#ffd23f" />
    <circle r="8" fill="#ffe680" opacity="0.6" cx="-2" cy="-2" />
  </g>
);

const starsLayer = (n: number, seed = 1) => {
  const out: ReactNode[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < n; i++) {
    out.push(
      <circle
        key={i}
        cx={rnd() * 160}
        cy={rnd() * 60}
        r={0.4 + rnd() * 0.8}
        fill="#fff"
        className="bg-twinkle"
        style={{ animationDelay: `${(rnd() * 3).toFixed(2)}s` }}
      />,
    );
  }
  return out;
};

const hills = (c1: string, c2: string) => (
  <>
    <ellipse cx="30" cy="92" rx="70" ry="26" fill={c1} />
    <ellipse cx="130" cy="95" rx="75" ry="28" fill={c2} />
  </>
);

const tree = (x: number, y: number, s = 1, key?: string) => (
  <g key={key ?? `t${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-1.5" y="0" width="3" height="10" fill="#9b6b43" rx="1" />
    <circle cx="0" cy="-3" r="7" fill="#58b85f" />
    <circle cx="-4" cy="1" r="5" fill="#4aa653" />
    <circle cx="4" cy="1" r="5" fill="#4aa653" />
  </g>
);

const pine = (x: number, y: number, s = 1, key?: string) => (
  <g key={key ?? `p${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-1.2" y="4" width="2.4" height="6" fill="#8a5a36" />
    <path d="M0 -14 L8 0 L-8 0 Z M0 -8 L10 6 L-10 6 Z" fill="#3f9a57" />
  </g>
);

const BG_LAYERS: Record<Bg, ReactNode> = {
  meadow: (
    <>
      {sun(138, 16)}
      {cloud(30, 16, 1.1)}
      {cloud(90, 24, 0.8)}
      {hills('#a6e38a', '#8fd672')}
      <rect x="0" y="80" width="160" height="20" fill="#8fd672" />
      {[12, 40, 70, 104, 144].map((x) => (
        <g key={x} transform={`translate(${x} ${88 + (x % 3) * 3})`}>
          <circle r="1.6" fill="#fff" />
          <circle r="0.8" fill="#ffd23f" />
        </g>
      ))}
    </>
  ),
  forest: (
    <>
      {cloud(36, 14, 0.9)}
      {[8, 30, 56, 84, 112, 140, 158].map((x, i) => pine(x, 62 + (i % 2) * 4, 1.6 + (i % 3) * 0.3))}
      <rect x="0" y="74" width="160" height="26" fill="#72c66f" />
      {[20, 60, 100, 140].map((x) => tree(x, 76, 1.2))}
    </>
  ),
  sea: (
    <>
      {sun(136, 16)}
      {cloud(40, 18, 1)}
      <rect x="0" y="46" width="160" height="54" fill="#4fb3e8" />
      <path className="bg-wave" d="M-20 50 Q-10 46 0 50 T20 50 T40 50 T60 50 T80 50 T100 50 T120 50 T140 50 T160 50 T180 50 V100 H-20 Z" fill="#6cc4f0" />
      <path className="bg-wave slow" d="M-20 64 Q-10 60 0 64 T20 64 T40 64 T60 64 T80 64 T100 64 T120 64 T140 64 T160 64 T180 64 V100 H-20 Z" fill="#43a6de" />
      <path className="bg-wave" d="M-20 80 Q-10 76 0 80 T20 80 T40 80 T60 80 T80 80 T100 80 T120 80 T140 80 T160 80 T180 80 V100 H-20 Z" fill="#3597d1" />
    </>
  ),
  beach: (
    <>
      {sun(24, 16)}
      {cloud(110, 18, 1)}
      <rect x="0" y="48" width="160" height="30" fill="#5cc0ef" />
      <path className="bg-wave" d="M-20 52 Q-10 49 0 52 T20 52 T40 52 T60 52 T80 52 T100 52 T120 52 T140 52 T160 52 T180 52 V60 H-20 Z" fill="#8fd9f7" />
      <path d="M0 72 Q40 66 80 70 T160 68 V100 H0 Z" fill="#ffe3a3" />
    </>
  ),
  night: (
    <>
      {starsLayer(40, 3)}
      {hills('#2e3478', '#262b66')}
      <rect x="0" y="84" width="160" height="16" fill="#262b66" />
    </>
  ),
  room: (
    <>
      <g opacity="0.35">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={i * 20} y1="0" x2={i * 20} y2="70" stroke="#f5c9a0" strokeWidth="3" />
        ))}
      </g>
      <g transform="translate(112 12)">
        <rect width="36" height="30" rx="3" fill="#bfe8ff" stroke="#fff" strokeWidth="3" />
        <line x1="18" y1="0" x2="18" y2="30" stroke="#fff" strokeWidth="2" />
        <line x1="0" y1="15" x2="36" y2="15" stroke="#fff" strokeWidth="2" />
      </g>
      <rect x="0" y="70" width="160" height="30" fill="#e2b98c" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={i * 22} y1="70" x2={i * 22 - 8} y2="100" stroke="#d3a676" strokeWidth="1" />
      ))}
      <ellipse cx="80" cy="88" rx="46" ry="8" fill="#ff9ebd" opacity="0.7" />
    </>
  ),
  party: (
    <>
      <path d="M0 6 Q40 20 80 6 T160 6" fill="none" stroke="#c9a27a" strokeWidth="0.8" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 6 + i * 13;
        const y = 6 + Math.sin((x / 160) * Math.PI * 2) * 7 * (i % 2 ? 1 : 1);
        const colors = ['#ff7eaa', '#ffd23f', '#4db4ff', '#4cc76f', '#a78bff'];
        return <path key={i} d={`M${x - 4} ${y + 3} L${x + 4} ${y + 3} L${x} ${y + 12} Z`} fill={colors[i % 5]} />;
      })}
      <rect x="0" y="72" width="160" height="28" fill="#f3c998" />
      <circle cx="16" cy="40" r="7" fill="#ff7eaa" className="bg-sway" />
      <circle cx="146" cy="36" r="7" fill="#4db4ff" className="bg-sway" />
    </>
  ),
  kitchen: (
    <>
      <g opacity="0.5">
        {Array.from({ length: 16 }, (_, i) =>
          Array.from({ length: 7 }, (_, j) => (
            <rect key={`${i}-${j}`} x={i * 10 + 0.5} y={j * 10 + 0.5} width="9" height="9" fill="none" stroke="#bfe3cf" strokeWidth="0.6" />
          )),
        )}
      </g>
      <rect x="0" y="70" width="160" height="30" fill="#f2c99a" />
      <rect x="8" y="66" width="144" height="8" rx="3" fill="#d9a46d" />
    </>
  ),
  town: (
    <>
      {cloud(30, 14, 0.9)}
      {sun(140, 14)}
      {[
        [6, 40, 22, '#ffb6a3'],
        [30, 30, 20, '#9fd3ff'],
        [52, 44, 26, '#ffe08a'],
        [80, 34, 22, '#b9e6a8'],
        [104, 42, 24, '#d7c1ff'],
        [130, 32, 26, '#ffc7de'],
      ].map(([x, y, w, c]) => (
        <g key={String(x)}>
          <rect x={x as number} y={y as number} width={w as number} height={80 - (y as number)} fill={c as string} rx="2" />
          {Array.from({ length: 3 }, (_, i) => (
            <rect key={i} x={(x as number) + 4 + (i % 2) * 8} y={(y as number) + 5 + i * 9} width="5" height="5" fill="#fff" opacity="0.8" rx="1" />
          ))}
        </g>
      ))}
      <rect x="0" y="80" width="160" height="20" fill="#b9c3c9" />
      <rect x="0" y="89" width="160" height="2" fill="#fff" opacity="0.7" />
    </>
  ),
  snow: (
    <>
      {cloud(40, 16, 1)}
      {cloud(120, 22, 0.8)}
      <ellipse cx="40" cy="96" rx="80" ry="26" fill="#ffffff" />
      <ellipse cx="130" cy="98" rx="70" ry="24" fill="#f1f7ff" />
      <g className="bg-snowfall" fill="#fff">
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={(i * 37) % 160} cy={(i * 23) % 70} r={0.8 + (i % 3) * 0.4} />
        ))}
      </g>
    </>
  ),
  sky: (
    <>
      {cloud(20, 20, 1.2)}
      {cloud(80, 12, 0.9)}
      {cloud(130, 30, 1.1)}
      {cloud(50, 70, 1.3)}
      {cloud(120, 82, 1)}
    </>
  ),
  field: (
    <>
      {sun(136, 16)}
      {cloud(40, 16, 1)}
      <rect x="0" y="56" width="160" height="44" fill="#b98a5b" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M0 ${62 + i * 7} Q80 ${58 + i * 7} 160 ${62 + i * 7}`} stroke="#a3764a" strokeWidth="2" fill="none" />
      ))}
      <rect x="0" y="52" width="160" height="6" fill="#8fd672" />
    </>
  ),
  mountain: (
    <>
      {cloud(24, 16, 0.9)}
      {sun(140, 16)}
      <path d="M-10 80 L40 22 L90 80 Z" fill="#8fb8d8" />
      <path d="M28 36 L40 22 L52 36 L46 34 L40 38 L34 34 Z" fill="#fff" />
      <path d="M50 84 L110 16 L170 84 Z" fill="#7aa6cc" />
      <path d="M96 32 L110 16 L124 32 L117 30 L110 35 L103 30 Z" fill="#fff" />
      <rect x="0" y="76" width="160" height="24" fill="#8fd672" />
    </>
  ),
  space: (
    <>
      {starsLayer(55, 9)}
      <g transform="translate(128 26)">
        <circle r="12" fill="#ffb86b" />
        <ellipse rx="20" ry="4" fill="none" stroke="#ffe0b0" strokeWidth="2" transform="rotate(-15)" />
      </g>
      <circle cx="22" cy="80" r="26" fill="#7a6cc9" opacity="0.8" />
    </>
  ),
  hole: (
    <>
      <rect x="0" y="0" width="160" height="16" fill="#8fd672" />
      <rect x="0" y="16" width="160" height="4" fill="#6fa84f" />
      <ellipse cx="80" cy="60" rx="64" ry="32" fill="#3e2616" />
      <ellipse cx="80" cy="64" rx="56" ry="24" fill="#4b2e1a" />
      {[20, 50, 110, 140].map((x) => (
        <circle key={x} cx={x} cy={30 + (x % 4) * 4} r="2" fill="#a57b54" />
      ))}
    </>
  ),
  rain: (
    <>
      {cloud(30, 14, 1.3)}
      {cloud(90, 10, 1.1)}
      {cloud(140, 16, 1.2)}
      <rect x="0" y="80" width="160" height="20" fill="#8fbf8a" />
      <g className="bg-rain" stroke="#6f8fb8" strokeWidth="0.8" strokeLinecap="round">
        {Array.from({ length: 40 }, (_, i) => (
          <line key={i} x1={(i * 41) % 160} y1={(i * 17) % 80} x2={((i * 41) % 160) - 2} y2={((i * 17) % 80) + 6} />
        ))}
      </g>
      <ellipse cx="40" cy="90" rx="14" ry="2.5" fill="#7fa7cf" opacity="0.7" />
      <ellipse cx="120" cy="92" rx="18" ry="3" fill="#7fa7cf" opacity="0.7" />
    </>
  ),
  evening: (
    <>
      <circle cx="120" cy="66" r="14" fill="#ff7b54" opacity="0.9" />
      {cloud(40, 20, 1)}
      {hills('#c46b8a', '#9c5277')}
      <rect x="0" y="84" width="160" height="16" fill="#9c5277" />
    </>
  ),
  rainbow: (
    <>
      <g fill="none" strokeWidth="5" className="bg-rainbow">
        {['#ff6b6b', '#ff9f43', '#ffd23f', '#4cc76f', '#4db4ff', '#a78bff'].map((c, i) => (
          <path key={c} d={`M${20 + i * 5} 80 A${60 - i * 5} ${60 - i * 5} 0 0 1 ${140 - i * 5} 80`} stroke={c} />
        ))}
      </g>
      {cloud(22, 78, 1.4)}
      {cloud(138, 78, 1.4)}
      <rect x="0" y="86" width="160" height="14" fill="#9fe08a" />
    </>
  ),
};

/** かぶ (えもじが ないので え で かく) */
function Kabu() {
  return (
    <svg viewBox="0 0 100 120" className="kabu-svg">
      <path d="M50 44 C40 20 26 10 14 12 C26 22 36 34 44 46 Z" fill="#4cb35c" />
      <path d="M50 44 C50 18 56 4 66 0 C62 16 58 30 54 46 Z" fill="#5cc46b" />
      <path d="M52 46 C66 22 82 16 92 20 C80 26 68 36 58 48 Z" fill="#43a653" />
      <path d="M50 44 C24 44 12 66 18 86 C24 104 40 112 50 118 C60 112 76 104 82 86 C88 66 76 44 50 44 Z" fill="#fbf7ff" stroke="#e3d6ef" strokeWidth="2" />
      <path d="M50 44 C30 44 20 56 20 66 C32 58 68 58 80 66 C80 56 70 44 50 44 Z" fill="#c889e8" />
      <ellipse cx="38" cy="78" rx="6" ry="10" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function ActorView({ actor, sceneH }: { actor: Actor; sceneH: number }) {
  const buddy = useApp((s) => s.profile.buddy);
  const wear = useApp((s) => s.wear);
  const avatar = useApp((s) => s.profile.avatar);
  const size = ((actor.s ?? 20) / 100) * sceneH;
  let content: ReactNode;
  if (actor.e === 'buddy') {
    content = <Mascot kind={buddy} outfit={wear} mood={actor.mood === 'wow' ? 'wow' : actor.mood ?? 'normal'} size={size * 1.15} talking={false} />;
  } else if (actor.e === 'kabu') {
    content = (
      <div style={{ width: size * 0.85, height: size }}>
        <Kabu />
      </div>
    );
  } else {
    const e = actor.e === 'child' ? avatar : actor.e;
    content = (
      <span className="emoji" style={{ fontSize: size, display: 'block', transform: actor.flip ? 'scaleX(-1)' : undefined }}>
        {e}
      </span>
    );
  }
  return (
    <div
      className="actor"
      style={{ left: `${actor.x}%`, top: `${actor.y}%`, zIndex: actor.z ?? 1 }}
    >
      <div className={`actor-in a-${actor.a ?? 'bob'}`} style={{ animationDelay: `${actor.d ?? 0}s` }}>
        {content}
      </div>
    </div>
  );
}

export default function Scene({ bg, actors, className = '', children }: { bg: Bg; actors: Actor[]; className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(400);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  return (
    <div className={`scene ${className}`} ref={ref}>
      <SceneBackground bg={bg} />
      {actors.map((a, i) => (
        <ActorView key={`${i}-${a.e}-${a.x}-${a.y}`} actor={a} sceneH={h} />
      ))}
      {children}
    </div>
  );
}
