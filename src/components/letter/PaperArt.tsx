/**
 * びんせんの え (1000 x 1414)。えもじは つかわず SVG の かたちだけで えがく
 * (画像に する ときに どの きかいでも おなじに みえるように)。
 */
import type { ReactNode } from 'react';
import type { PaperDef, PaperId } from '../../data/letters';
import type { Layout } from '../../lib/letterLayout';

interface ArtProps {
  uid: string;
}

/* ---------- こまかい ぶひん ---------- */

/** いつも おなじ ならびに なる らんすう */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PETAL = 'M0,0C-14,-8 -20,-26 -14,-40C-11,-46 -5,-49 0,-44C5,-49 11,-46 14,-40C20,-26 14,-8 0,0Z';

function SakuraFlower({ x, y, r, rot = 0, uid }: { x: number; y: number; r: number; rot?: number; uid: string }) {
  const k = r / 48;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={PETAL} transform={`rotate(${a})`} fill={`url(#${uid}-petal)`} stroke="#f39ab3" strokeWidth="1.6" />
      ))}
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={`s${a}`} transform={`rotate(${a + 36})`}>
          <line x1="0" y1="0" x2="0" y2="-15" stroke="#e5708f" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="0" cy="-16" r="2.6" fill="#f0a23a" />
        </g>
      ))}
      <circle r="6" fill="#ffd36b" />
    </g>
  );
}

function SakuraBud({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d={`M0,${r * 0.6}C${-r},0 ${-r * 0.6},${-r * 1.3} 0,${-r * 1.4}C${r * 0.6},${-r * 1.3} ${r},0 0,${r * 0.6}Z`}
        fill="#ff9fba"
        stroke="#ef7f9e"
        strokeWidth="1.5"
      />
      <path
        d={`M0,${r * 0.9}L${-r * 0.5},${r * 0.2}M0,${r * 0.9}L${r * 0.5},${r * 0.2}`}
        stroke="#7a9a4c"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function FallingPetal({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <path
      d={PETAL}
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 48})`}
      fill="#ffc3d3"
      stroke="#f6a2b9"
      strokeWidth={2.4}
      opacity="0.95"
    />
  );
}

function Cloud({ x, y, s = 1, shade = '#cde7f8' }: { x: number; y: number; s?: number; shade?: string }) {
  const body = (
    <>
      <circle cx="-70" cy="10" r="46" />
      <circle cx="-10" cy="-22" r="62" />
      <circle cx="58" cy="0" r="50" />
      <circle cx="104" cy="22" r="34" />
      <rect x="-112" y="10" width="248" height="46" rx="23" />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={shade} transform="translate(0 10)">
        {body}
      </g>
      <g fill="#ffffff">{body}</g>
      <ellipse cx="-24" cy="-44" rx="26" ry="12" fill="#ffffff" opacity="0.9" />
    </g>
  );
}

function Leaf({ x, y, s, rot, fill }: { x: number; y: number; s: number; rot: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 40})`}>
      <path d="M0,0C12,-12 13,-29 0,-42C-13,-29 -12,-12 0,0Z" fill={fill} />
      <path d="M0,-2L0,-34" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Mushroom({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16,0C-18,-18 -14,-34 -12,-40L12,-40C14,-34 18,-18 16,0Z" fill="#fff4dd" stroke="#e2c79c" strokeWidth="2.5" />
      <path
        d="M-54,-38C-52,-78 -24,-96 0,-96C24,-96 52,-78 54,-38C30,-30 -30,-30 -54,-38Z"
        fill="#ec5a52"
        stroke="#c93f39"
        strokeWidth="2.5"
      />
      <ellipse cx="-24" cy="-62" rx="9" ry="7" fill="#fff" />
      <ellipse cx="8" cy="-78" rx="10" ry="7" fill="#fff" />
      <ellipse cx="30" cy="-52" rx="7" ry="6" fill="#fff" />
      <ellipse cx="-38" cy="-44" rx="5" ry="4" fill="#fff" />
    </g>
  );
}

function Acorn({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="0" cy="10" rx="20" ry="26" fill="#d39050" stroke="#a8692f" strokeWidth="2.5" />
      <ellipse cx="-7" cy="6" rx="5" ry="10" fill="#e9b47c" opacity="0.8" />
      <path d="M-25,-6C-25,-26 25,-26 25,-6C12,0 -12,0 -25,-6Z" fill="#8a5a33" stroke="#6b4223" strokeWidth="2.5" />
      <path d="M-16,-14L16,-14M-20,-7L20,-7M-8,-20L8,-20" stroke="#6b4223" strokeWidth="1.6" opacity="0.6" />
      <path d="M0,-21C1,-28 4,-32 8,-34" stroke="#6b4223" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Daisy({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-12" rx="5.5" ry="11" transform={`rotate(${i * 45})`} fill="#fff" stroke="#e6e0d0" strokeWidth="1.2" />
      ))}
      <circle r="6.5" fill="#ffcf3f" />
    </g>
  );
}

function Fish({
  x,
  y,
  s = 1,
  flip = false,
  fill = '#ff9b3d',
  stripe = '#fff1d6',
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  fill?: string;
  stripe?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M26,0C26,-16 8,-24 -8,-22C-24,-20 -34,-8 -36,0C-34,8 -24,20 -8,22C8,24 26,16 26,0Z" fill={fill} />
      <path d="M24,0L44,-16C42,-6 42,6 44,16Z" fill={fill} />
      <path d="M-4,-21C-10,-8 -10,8 -4,21" stroke={stripe} strokeWidth="5" fill="none" opacity="0.85" />
      <circle cx="-22" cy="-5" r="4.2" fill="#3a2a22" />
      <circle cx="-23.4" cy="-6.4" r="1.4" fill="#fff" />
    </g>
  );
}

function Bubble({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="rgba(255,255,255,0.45)" stroke="#8fd0f2" strokeWidth={Math.max(1.6, r * 0.12)} />
      <path
        d={`M${x - r * 0.55},${y - r * 0.15}A${r * 0.6},${r * 0.6} 0 0 1 ${x - r * 0.1},${y - r * 0.58}`}
        stroke="#fff"
        strokeWidth={Math.max(1.6, r * 0.16)}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Twinkle({ x, y, r, fill = '#fff3c4', opacity = 1 }: { x: number; y: number; r: number; fill?: string; opacity?: number }) {
  const c = r * 0.18;
  return (
    <path
      d={`M${x},${y - r}C${x + c},${y - c} ${x + c},${y - c} ${x + r},${y}C${x + c},${y + c} ${x + c},${y + c} ${x},${y + r}C${x - c},${y + c} ${x - c},${y + c} ${x - r},${y}C${x - c},${y - c} ${x - c},${y - c} ${x},${y - r}Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

function Star5({ x, y, r, fill, rot = 0, stroke }: { x: number; y: number; r: number; fill: string; rot?: number; stroke?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2 + (rot * Math.PI) / 180;
    const rr = i % 2 ? r * 0.48 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return <polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth={stroke ? r * 0.12 : undefined} strokeLinejoin="round" />;
}

function Strawberry({ x, y, s = 1, rot = 0, uid }: { x: number; y: number; s?: number; rot?: number; uid: string }) {
  const seeds: [number, number][] = [
    [-14, -8],
    [0, -12],
    [14, -8],
    [-20, 6],
    [-6, 4],
    [8, 4],
    [20, 6],
    [-12, 18],
    [2, 18],
    [14, 18],
    [-4, 31],
    [8, 30],
  ];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0,-26C24,-30 38,-12 32,10C26,32 8,46 0,48C-8,46 -26,32 -32,10C-38,-12 -24,-30 0,-26Z" fill={`url(#${uid}-berry)`} />
      {seeds.map(([sx, sy], i) => (
        <ellipse key={i} cx={sx} cy={sy} rx="2.2" ry="3.4" fill="#ffe28a" transform={`rotate(${sx * 0.8} ${sx} ${sy})`} />
      ))}
      <path
        d="M0,-24L-22,-34L-8,-26L-16,-44L0,-30L16,-44L8,-26L22,-34Z"
        fill="#4caf50"
        stroke="#3a8f3e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M0,-32C0,-40 3,-46 8,-50" stroke="#3a8f3e" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Blossom({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx="0" cy="-11" r="9.5" transform={`rotate(${a})`} fill="#fff" stroke="#f3d6d2" strokeWidth="1.5" />
      ))}
      <circle r="6" fill="#ffd54a" />
    </g>
  );
}

/** やまなりに たれる ひもと、さんかくの はた */
function Bunting({ x1, y1, x2, y2, sag, colors }: { x1: number; y1: number; x2: number; y2: number; sag: number; colors: string[] }) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag;
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2,
    y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2,
  });
  const n = 11;
  return (
    <g>
      <path d={`M${x1},${y1}Q${cx},${cy} ${x2},${y2}`} stroke="#c9a46a" strokeWidth="4" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const p = at(t);
        const q = at(t + 0.01);
        const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
            <path d="M-34,0L34,0L0,74Z" fill={colors[i % colors.length]} stroke="rgba(0,0,0,0.08)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="-9" cy="16" r="4" fill="rgba(255,255,255,0.7)" />
            <circle cx="9" cy="16" r="4" fill="rgba(255,255,255,0.7)" />
            <circle cx="0" cy="34" r="4" fill="rgba(255,255,255,0.7)" />
          </g>
        );
      })}
    </g>
  );
}

/** なみ (y を ちゅうしんに ゆれて、したまで ぬりつぶす) */
function wave(y: number, amp: number, len: number, phase: number, bottom = 1414): string {
  let d = `M-20,${bottom}L-20,${(y + Math.sin(phase) * amp).toFixed(1)}`;
  for (let x = -20; x <= 1020; x += 8) d += `L${x},${(y + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1)}`;
  return `${d}L1020,${bottom}Z`;
}

function crest(y: number, amp: number, len: number, phase: number): string {
  let d = '';
  for (let x = -20; x <= 1020; x += 8) d += `${d ? 'L' : 'M'}${x},${(y + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1)}`;
  return d;
}

/** かみの ざらざら (うすく) */
function Grain({ uid, opacity = 0.06, light = false }: { uid: string; opacity?: number; light?: boolean }) {
  const c = light ? '1' : '0.3';
  return (
    <>
      <filter id={`${uid}-grain`} x="0" y="0" width="1000" height="1414" filterUnits="userSpaceOnUse">
        <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="3" seed="11" result="n" />
        <feColorMatrix in="n" type="matrix" values={`0 0 0 0 ${c}  0 0 0 0 ${c}  0 0 0 0 ${c}  1.6 0 0 0 -0.75`} />
      </filter>
      <rect width="1000" height="1414" filter={`url(#${uid}-grain)`} opacity={opacity * 2.2} />
    </>
  );
}

/* ---------- びんせん ---------- */

function Sakura({ uid }: ArtProps) {
  const rnd = seeded(3);
  const petals: { x: number; y: number; s: number; rot: number }[] = [
    { x: 560, y: 120, s: 20, rot: 24 },
    { x: 470, y: 176, s: 16, rot: -36 },
    { x: 404, y: 96, s: 14, rot: 70 },
    { x: 320, y: 150, s: 12, rot: 130 },
    { x: 220, y: 92, s: 11, rot: -70 },
    { x: 930, y: 300, s: 15, rot: -12 },
    { x: 955, y: 470, s: 12, rot: 48 },
    { x: 926, y: 640, s: 13, rot: -60 },
    { x: 958, y: 820, s: 10, rot: 100 },
    { x: 60, y: 520, s: 11, rot: 20 },
    { x: 46, y: 760, s: 13, rot: -40 },
    { x: 66, y: 980, s: 10, rot: 75 },
    { x: 300, y: 1360, s: 12, rot: -20 },
    { x: 420, y: 1384, s: 10, rot: 40 },
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8fa" />
          <stop offset="1" stopColor="#ffeef3" />
        </linearGradient>
        <radialGradient id={`${uid}-wash`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffc9d8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffc9d8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-petal`} cx="0" cy="0" r="48" gradientUnits="userSpaceOnUse">
          <stop offset="0.1" stopColor="#ff8fb0" />
          <stop offset="0.55" stopColor="#ffc3d4" />
          <stop offset="1" stopColor="#fff0f4" />
        </radialGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <ellipse cx="860" cy="120" rx="420" ry="300" fill={`url(#${uid}-wash)`} />
      <ellipse cx="120" cy="1310" rx="360" ry="260" fill={`url(#${uid}-wash)`} opacity="0.7" />
      <Grain uid={uid} />
      {/* さくらの えだ */}
      <g transform="translate(1000 0) scale(1.22) translate(-1000 0)">
        <g fill="none" stroke="#8a5a48" strokeLinecap="round">
          <path d="M1012,62C930,74 862,108 800,150C760,176 718,192 664,198" strokeWidth="14" />
          <path d="M872,104C858,66 828,42 784,30" strokeWidth="8" />
          <path d="M758,170C770,204 764,232 748,252" strokeWidth="6" />
          <path d="M700,190C690,212 668,226 640,230" strokeWidth="5" />
          <path d="M940,74C952,104 950,128 936,146" strokeWidth="6" />
        </g>
        <Leaf x={826} y={140} s={30} rot={-140} fill="#9ccc72" />
        <Leaf x={712} y={196} s={26} rot={-200} fill="#8cc163" />
        <Leaf x={944} y={120} s={22} rot={-150} fill="#a6d27f" />
        <SakuraFlower uid={uid} x={804} y={150} r={50} rot={8} />
        <SakuraFlower uid={uid} x={694} y={194} r={42} rot={-22} />
        <SakuraFlower uid={uid} x={892} y={92} r={38} rot={30} />
        <SakuraFlower uid={uid} x={772} y={36} r={30} rot={-8} />
        <SakuraFlower uid={uid} x={936} y={154} r={30} rot={50} />
        <SakuraBud x={748} y={262} r={14} rot={-10} />
        <SakuraBud x={630} y={232} r={12} rot={-50} />
      </g>
      {petals.map((p, i) => (
        <FallingPetal key={i} x={p.x} y={p.y} s={p.s} rot={p.rot + rnd() * 10} />
      ))}
      {/* みぎした */}
      <SakuraFlower uid={uid} x={900} y={1328} r={42} rot={14} />
      <SakuraFlower uid={uid} x={826} y={1366} r={28} rot={-30} />
      <SakuraBud x={958} y={1262} r={13} rot={30} />
    </g>
  );
}

function Sora({ uid }: ArtProps) {
  const bands = ['#ff9aa2', '#ffbc7a', '#ffe28a', '#a9e5a4', '#8fd2ff', '#a6b3ff', '#cfa8ff'];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6eaff" />
          <stop offset="0.42" stopColor="#e8f6ff" />
          <stop offset="1" stopColor="#f9fdff" />
        </linearGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <Grain uid={uid} opacity={0.04} />
      {/* にじ */}
      <g fill="none" opacity="0.8">
        {bands.map((c, i) => {
          const r = 236 - i * 17;
          return <path key={c} d={`M${760 - r},262A${r},${r} 0 0 1 ${760 + r},262`} stroke={c} strokeWidth="18" />;
        })}
      </g>
      <Cloud x={200} y={150} s={1.15} />
      <Cloud x={890} y={236} s={0.86} />
      <Cloud x={548} y={248} s={0.62} />
      {/* とり */}
      <g fill="none" stroke="#7fb4d9" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M404,92q12,-14 24,0q12,-14 24,0" />
        <path d="M466,128q9,-10 18,0q9,-10 18,0" />
      </g>
      {/* かみひこうき */}
      <path
        d="M40,1392C120,1380 150,1312 220,1318C270,1322 290,1360 350,1350"
        stroke="#94cdee"
        strokeWidth="4.5"
        strokeDasharray="12 14"
        strokeLinecap="round"
        fill="none"
      />
      <g transform="translate(418 1328) rotate(-14)">
        <path d="M-52,10L56,-26L-6,30Z" fill="#ffffff" stroke="#8fb9d9" strokeWidth="3" strokeLinejoin="round" />
        <path d="M-6,30L0,6L56,-26Z" fill="#e3f1fb" stroke="#8fb9d9" strokeWidth="3" strokeLinejoin="round" />
        <path d="M-52,10L0,6" stroke="#8fb9d9" strokeWidth="3" />
      </g>
      <Cloud x={890} y={1440} s={0.8} shade="#d8eefb" />
    </g>
  );
}

function Mori({ uid }: ArtProps) {
  const vine = 'M-20,104C120,56 222,150 362,104S604,58 724,106S902,150 1020,92';
  const leafPts: [number, number, number][] = [
    [40, 92, -40],
    [96, 76, 50],
    [160, 88, -60],
    [226, 118, 40],
    [292, 116, -30],
    [356, 102, 60],
    [420, 88, -50],
    [484, 76, 40],
    [548, 76, -40],
    [610, 86, 60],
    [672, 100, -50],
    [736, 110, 40],
    [800, 120, -60],
    [864, 118, 40],
    [930, 104, -40],
    [990, 92, 50],
  ];
  const greens = ['#8cc56c', '#6aa84f', '#a5d17f'];
  const rnd = seeded(5);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcfaee" />
          <stop offset="1" stopColor="#f5f3e2" />
        </linearGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <Grain uid={uid} opacity={0.07} />
      {/* ひだり・みぎの はっぱ */}
      {[160, 420, 700, 980, 1180].map((y, i) => (
        <Leaf
          key={`l${y}`}
          x={i % 2 ? 960 : 44}
          y={y + rnd() * 60}
          s={24 + rnd() * 10}
          rot={(i % 2 ? -1 : 1) * (120 + rnd() * 50)}
          fill={greens[i % 3]}
        />
      ))}
      {/* つる */}
      <path d={vine} stroke="#6f9e4f" strokeWidth="6" fill="none" strokeLinecap="round" />
      {leafPts.map(([x, y, r], i) => (
        <Leaf key={i} x={x} y={y} s={34 + (i % 3) * 4} rot={r} fill={greens[i % 3]} />
      ))}
      {[
        [256, 128],
        [588, 70],
        [842, 132],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="8" fill="#e8585a" />
          <circle cx={x + 13} cy={y + 6} r="7" fill="#d94a4c" />
          <circle cx={x + 3} cy={y + 13} r="6.5" fill="#ef6b6c" />
        </g>
      ))}
      {/* した: くさ・きのこ・どんぐり */}
      <path
        d={`M-10,1414L-10,1352${Array.from({ length: 52 }, (_, i) => `L${i * 20},${1338 + (i % 2 ? -14 : 6) + (i % 5) * 2}`).join('')}L1020,1350L1020,1414Z`}
        fill="#a6d585"
      />
      <path
        d={`M-10,1414L-10,1372${Array.from({ length: 52 }, (_, i) => `L${i * 20 + 10},${1364 + (i % 2 ? -12 : 4)}`).join('')}L1020,1372L1020,1414Z`}
        fill="#8cc56c"
      />
      <Mushroom x={110} y={1360} s={1.05} />
      <Mushroom x={188} y={1376} s={0.62} />
      <Acorn x={852} y={1346} s={1.05} rot={-14} />
      <Acorn x={914} y={1366} s={0.85} rot={18} />
      <Daisy x={322} y={1368} />
      <Daisy x={700} y={1374} s={0.8} />
      <Daisy x={760} y={1360} s={0.6} />
    </g>
  );
}

function Umi({ uid }: ArtProps) {
  const rnd = seeded(9);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5fcff" />
          <stop offset="0.72" stopColor="#e2f5fe" />
          <stop offset="1" stopColor="#cdeefc" />
        </linearGradient>
        <radialGradient id={`${uid}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe48a" />
          <stop offset="0.45" stopColor="#ffd25a" />
          <stop offset="0.5" stopColor="#ffd25a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffd25a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <Grain uid={uid} opacity={0.035} />
      {/* おひさま・かもめ */}
      <circle cx="880" cy="100" r="96" fill={`url(#${uid}-sun)`} />
      <g fill="none" stroke="#7aaed0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M640,96q14,-16 28,0q14,-16 28,0" />
        <path d="M712,62q10,-11 20,0q10,-11 20,0" />
      </g>
      {/* あわ */}
      {Array.from({ length: 9 }, (_, i) => (
        <Bubble key={i} x={56 + rnd() * 40} y={1140 - i * 70 - rnd() * 30} r={7 + (i % 4) * 4 + rnd() * 4} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Bubble key={`r${i}`} x={944 + rnd() * 28} y={1120 - i * 90 - rnd() * 30} r={6 + rnd() * 9} />
      ))}
      {/* なみ */}
      <path d={wave(1176, 14, 260, 0.6)} fill="#a8ddf7" />
      {/* くじら */}
      <g transform="translate(812 1238)">
        <g fill="#7cc3ee" stroke="#5aa6d6" strokeWidth="3" strokeLinecap="round">
          <path d="M-6,-58C-12,-74 -24,-80 -32,-76M-6,-58C-2,-76 8,-84 18,-82M-6,-58L-6,-40" fill="none" />
        </g>
        <path d="M-90,0C-90,-44 -50,-60 -4,-60C54,-60 86,-30 92,6C96,30 70,40 30,40C-30,40 -90,36 -90,0Z" fill="#5fb2e6" />
        <path d="M-84,10C-60,30 10,34 80,22C70,36 40,40 10,40C-40,40 -78,32 -84,10Z" fill="#dff3fd" />
        <path d="M90,4C104,-14 120,-18 132,-12C124,0 124,10 132,22C118,26 102,20 90,10Z" fill="#5fb2e6" />
        <circle cx="-48" cy="-14" r="6" fill="#28435a" />
        <circle cx="-50" cy="-16" r="2" fill="#fff" />
        <ellipse cx="-62" cy="4" rx="10" ry="6" fill="#ff9fb2" opacity="0.7" />
        <path d="M-40,8Q-30,16 -20,8" stroke="#28435a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <path d={wave(1240, 16, 230, 2.2)} fill="#6ec1ea" />
      <Fish x={180} y={1312} s={1.05} />
      <Fish x={330} y={1360} s={0.75} flip fill="#ffd23f" stripe="#fff8dc" />
      <path d={wave(1300, 18, 250, 4.1)} fill="#3ea2dd" />
      <path
        d={crest(1300, 18, 250, 4.1)}
        stroke="#ffffff"
        strokeWidth="5"
        fill="none"
        opacity="0.75"
        strokeLinecap="round"
        strokeDasharray="60 26"
      />
      <Fish x={560} y={1374} s={0.9} fill="#ff8e7a" />
    </g>
  );
}

function Yozora({ uid }: ArtProps) {
  const rnd = seeded(21);
  const dots = Array.from({ length: 110 }, () => ({ x: rnd() * 1000, y: rnd() * 1250, r: 0.9 + rnd() * 2, o: 0.35 + rnd() * 0.65 }));
  const twinkles = Array.from({ length: 16 }, () => ({ x: 30 + rnd() * 940, y: 20 + rnd() * 1180, r: 6 + rnd() * 11 }));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10163d" />
          <stop offset="0.55" stopColor="#252a68" />
          <stop offset="1" stopColor="#3b3b88" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe6a3" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffe6a3" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-moon`}>
          <circle cx="842" cy="150" r="70" fill="#fff" />
          <circle cx="876" cy="128" r="62" fill="#000" />
        </mask>
        <linearGradient id={`${uid}-tail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6d0" stopOpacity="0" />
          <stop offset="1" stopColor="#fff6d0" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <Grain uid={uid} opacity={0.04} light />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(1)} fill="#fff8e1" opacity={d.o.toFixed(2)} />
      ))}
      {twinkles.map((t, i) => (
        <Twinkle key={i} x={t.x} y={t.y} r={t.r} opacity={0.85} />
      ))}
      <Star5 x={300} y={1180} r={16} fill="#ffd66b" rot={-10} />
      <Star5 x={940} y={760} r={13} fill="#ffd66b" rot={12} />
      {/* おつきさま */}
      <circle cx="830" cy="150" r="170" fill={`url(#${uid}-glow)`} />
      <circle cx="842" cy="150" r="70" fill="#ffe6a3" mask={`url(#${uid}-moon)`} />
      {/* ながれぼし */}
      <path d="M140,212L360,86L364,94Z" fill={`url(#${uid}-tail)`} />
      <Twinkle x={362} y={90} r={14} fill="#fffbe6" />
      {/* おか と おうち */}
      <path d="M-20,1414L-20,1290C120,1230 300,1236 460,1278C620,1320 760,1260 1020,1250L1020,1414Z" fill="#222a62" />
      <path d="M-20,1414L-20,1340C160,1300 360,1320 540,1350C720,1380 860,1330 1020,1320L1020,1414Z" fill="#181d4b" />
      <g transform="translate(760 1284)">
        <rect x="-40" y="-56" width="80" height="62" fill="#2d3270" />
        <path d="M-52,-54L0,-96L52,-54Z" fill="#3b4188" />
        <rect x="18" y="-102" width="14" height="30" fill="#2d3270" />
        <rect x="-26" y="-40" width="22" height="22" rx="3" fill="#ffd66b" />
        <circle cx="-15" cy="-29" r="26" fill="#ffd66b" opacity="0.18" />
        <rect x="8" y="-30" width="20" height="36" rx="3" fill="#1d2152" />
      </g>
      {[
        [160, 1300, 1],
        [230, 1316, 0.8],
        [900, 1282, 0.9],
      ].map(([x, y, k]) => (
        <path
          key={x}
          d={`M${x},${y - 70 * k}C${x + 24 * k},${y - 40 * k} ${x + 30 * k},${y - 6 * k} ${x},${y}C${x - 30 * k},${y - 6 * k} ${x - 24 * k},${y - 40 * k} ${x},${y - 70 * k}Z`}
          fill="#1b2155"
        />
      ))}
    </g>
  );
}

function Ichigo({ uid }: ArtProps) {
  const inset = 52;
  const scallops: [number, number][] = [];
  for (let x = inset; x <= 1000 - inset; x += 24) scallops.push([x, inset], [x, 1414 - inset]);
  for (let y = inset + 24; y < 1414 - inset; y += 24) scallops.push([inset, y], [1000 - inset, y]);
  return (
    <g>
      <defs>
        <pattern id={`${uid}-ging`} width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="#fffaf5" />
          <rect width="22" height="44" fill="#f26b6b" opacity="0.42" />
          <rect width="44" height="22" fill="#f26b6b" opacity="0.42" />
        </pattern>
        <radialGradient id={`${uid}-berry`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#ff8a8e" />
          <stop offset="0.5" stopColor="#f2464f" />
          <stop offset="1" stopColor="#d22f3b" />
        </radialGradient>
        <pattern id={`${uid}-dots`} width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="4" fill="#ffd9d4" />
          <circle cx="48" cy="48" r="4" fill="#ffd9d4" />
        </pattern>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-ging)`} />
      {/* レースの ふち */}
      {scallops.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="12" fill="#fffaf5" />
      ))}
      <rect x={inset} y={inset} width={1000 - inset * 2} height={1414 - inset * 2} rx="10" fill="#fffaf5" />
      <rect x={inset} y={inset} width={1000 - inset * 2} height={1414 - inset * 2} rx="10" fill={`url(#${uid}-dots)`} opacity="0.55" />
      <rect
        x={inset + 14}
        y={inset + 14}
        width={1000 - inset * 2 - 28}
        height={1414 - inset * 2 - 28}
        rx="8"
        fill="none"
        stroke="#f6b8b2"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <Grain uid={uid} opacity={0.04} />
      <Blossom x={210} y={112} s={1.1} />
      <Strawberry uid={uid} x={118} y={128} s={1.15} rot={-22} />
      <Strawberry uid={uid} x={186} y={150} s={0.7} rot={18} />
      <Blossom x={96} y={210} s={0.8} />
      <Blossom x={790} y={1310} s={1} />
      <Strawberry uid={uid} x={884} y={1278} s={1.2} rot={20} />
      <Strawberry uid={uid} x={820} y={1330} s={0.72} rot={-14} />
      <Blossom x={906} y={1194} s={0.75} />
    </g>
  );
}

function Oiwai({ uid }: ArtProps) {
  const rnd = seeded(17);
  const colors = ['#ff8a8a', '#ffd23f', '#6fcf97', '#6ab8ff', '#c39bff', '#ffa45c'];
  const zones: [number, number, number, number, number][] = [
    // x, y, w, h, かず
    [40, 200, 920, 80, 18],
    [16, 300, 80, 920, 16],
    [904, 300, 80, 920, 16],
  ];
  const confetti = zones.flatMap(([x, y, w, h, n]) =>
    Array.from({ length: n }, () => ({
      x: x + rnd() * w,
      y: y + rnd() * h,
      r: rnd() * 180,
      c: colors[Math.floor(rnd() * colors.length)],
      k: Math.floor(rnd() * 3),
    })),
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf3" />
          <stop offset="1" stopColor="#fff1cc" />
        </linearGradient>
      </defs>
      <rect width="1000" height="1414" fill={`url(#${uid}-bg)`} />
      <Grain uid={uid} opacity={0.05} />
      {confetti.map((c, i) =>
        c.k === 0 ? (
          <rect
            key={i}
            x={-6}
            y={-11}
            width="12"
            height="22"
            rx="3"
            fill={c.c}
            transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.r.toFixed(0)})`}
          />
        ) : c.k === 1 ? (
          <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r="6.5" fill={c.c} />
        ) : (
          <path
            key={i}
            d="M-14,0q7,-10 14,0t14,0"
            stroke={c.c}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${c.r.toFixed(0)})`}
          />
        ),
      )}
      <Bunting x1={-20} y1={60} x2={1020} y2={74} sag={90} colors={colors} />
      {/* プレゼント */}
      <g transform="translate(140 1330)">
        <rect x="-62" y="-40" width="124" height="88" rx="8" fill="#ff8a8a" />
        <rect x="-70" y="-62" width="140" height="28" rx="7" fill="#ff6b6b" />
        <rect x="-11" y="-62" width="22" height="110" fill="#ffd23f" />
        <path
          d="M0,-62C-16,-96 -54,-92 -44,-70C-38,-58 -18,-60 0,-62ZM0,-62C16,-96 54,-92 44,-70C38,-58 18,-60 0,-62Z"
          fill="#ffd23f"
          stroke="#e6b300"
          strokeWidth="3"
        />
        <circle cy="-62" r="9" fill="#ffc107" />
      </g>
      {/* クラッカー */}
      <g transform="translate(870 1340) rotate(-28)">
        <path d="M0,40L-34,-60L34,-60Z" fill="#6ab8ff" />
        <path d="M-24,-30L24,-30M-14,0L14,0M-30,-46L30,-46" stroke="#ffffff" strokeWidth="7" />
        <ellipse cx="0" cy="-60" rx="34" ry="10" fill="#4a9de6" />
        {[-50, -25, 0, 25, 50].map((a, i) => (
          <path
            key={a}
            d={`M0,-74L${Math.sin((a * Math.PI) / 180) * 60},${-74 - Math.cos((a * Math.PI) / 180) * 60}`}
            stroke={colors[i]}
            strokeWidth="6"
            strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
}

function Genko({ uid }: ArtProps) {
  return (
    <g>
      <rect width="1000" height="1414" fill="#fcf8ef" />
      <Grain uid={uid} opacity={0.06} />
    </g>
  );
}

const ART: Record<PaperId, (p: ArtProps) => ReactNode> = {
  sakura: Sakura,
  sora: Sora,
  mori: Mori,
  umi: Umi,
  yozora: Yozora,
  ichigo: Ichigo,
  oiwai: Oiwai,
  genko: Genko,
};

export function PaperBackground({ paper, uid }: { paper: PaperDef; uid: string }) {
  const Art = ART[paper.id];
  return <Art uid={uid} />;
}

/* ---------- マス・せん ---------- */

/** うみの びんせんは なみなみの せん */
function rule(paper: PaperDef, x1: number, y1: number, x2: number, y2: number): string {
  if (paper.id !== 'umi') return `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  let d = '';
  for (let t = 0; t <= len; t += 6) {
    const o = Math.sin((t / 64) * Math.PI * 2) * 3.4;
    d += `${d ? 'L' : 'M'}${(x1 + ux * t - uy * o).toFixed(1)},${(y1 + uy * t + ux * o).toFixed(1)}`;
  }
  return d;
}

const LINE_STYLE: Partial<Record<PaperId, { dash?: string; width: number; opacity?: number }>> = {
  sakura: { dash: '0.1 13', width: 5.5 },
  sora: { width: 3.2, opacity: 0.85 },
  umi: { width: 3.2, opacity: 0.9 },
  yozora: { dash: '0.1 12', width: 5 },
  oiwai: { dash: '16 10', width: 3.4 },
};

export function PaperGuides({ paper, layout }: { paper: PaperDef; layout: Layout }) {
  const { s, grid, lineRects, tate, per, pitch } = layout;
  const c = paper.guideColor;
  if (paper.guide === 'line') {
    const st = LINE_STYLE[paper.id] ?? { width: 3 };
    const common = {
      stroke: c,
      strokeWidth: st.width,
      strokeDasharray: st.dash,
      strokeLinecap: 'round' as const,
      opacity: st.opacity,
      fill: 'none',
    };
    const ext = s * 0.12;
    if (!tate) {
      return (
        <g>
          {lineRects.map((r, i) => (
            <path key={i} d={rule(paper, grid.x - ext, r.y + s + s * 0.1, grid.x + grid.w + ext, r.y + s + s * 0.1)} {...common} />
          ))}
        </g>
      );
    }
    // たてがき: れつの あいだに せん
    const gap = pitch - s;
    const xs = [lineRects[0].x + s + gap / 2, ...lineRects.map((r) => r.x - gap / 2)];
    return (
      <g>
        {xs.map((x, i) => (
          <path key={i} d={rule(paper, x, grid.y - ext, x, grid.y + grid.h + ext)} {...common} />
        ))}
      </g>
    );
  }
  if (paper.guide === 'grid') {
    const cells: { x: number; y: number }[] = [];
    for (const r of lineRects) for (let j = 0; j < per; j++) cells.push(tate ? { x: r.x, y: r.y + j * s } : { x: r.x + j * s, y: r.y });
    const pad = s * 0.04;
    return (
      <g>
        {cells.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x + pad}
              y={p.y + pad}
              width={s - pad * 2}
              height={s - pad * 2}
              rx={s * 0.14}
              fill="#ffffff"
              fillOpacity="0.6"
              stroke={c}
              strokeWidth="2.6"
            />
            <path
              d={`M${p.x + s / 2},${p.y + s * 0.16}L${p.x + s / 2},${p.y + s * 0.84}M${p.x + s * 0.16},${p.y + s / 2}L${p.x + s * 0.84},${p.y + s / 2}`}
              stroke={c}
              strokeWidth="1.6"
              strokeDasharray="5 6"
              opacity="0.7"
            />
          </g>
        ))}
      </g>
    );
  }
  // げんこうようし: マスを ならべた ぎょうと、そとの わく
  const frame = s * 0.22;
  return (
    <g fill="none" stroke={c}>
      <rect x={grid.x - frame} y={grid.y - frame} width={grid.w + frame * 2} height={grid.h + frame * 2} strokeWidth="4" />
      <rect
        x={grid.x - frame + 7}
        y={grid.y - frame + 7}
        width={grid.w + frame * 2 - 14}
        height={grid.h + frame * 2 - 14}
        strokeWidth="1.4"
      />
      {lineRects.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} strokeWidth="2.2" />
          {Array.from({ length: per - 1 }, (_, j) =>
            tate ? (
              <line key={j} x1={r.x} y1={r.y + (j + 1) * s} x2={r.x + s} y2={r.y + (j + 1) * s} strokeWidth="1.3" />
            ) : (
              <line key={j} x1={r.x + (j + 1) * s} y1={r.y} x2={r.x + (j + 1) * s} y2={r.y + s} strokeWidth="1.3" />
            ),
          )}
        </g>
      ))}
    </g>
  );
}
