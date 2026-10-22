/**
 * ふうとう。てがみを たたんで いれる・ふたを しめる・シールで とめる・おもてに かえす までの うごき
 * (EnvelopeScene) と、てがみばこに ならべる おもて (EnvelopeFront)。
 */
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import Mascot from '../Mascot';
import { findPaper, PAPER_H, PAPER_W } from '../../data/letters';
import { useApp, useBuddyFace } from '../../state/store';
import type { Letter } from '../../state/letters';
import InkWord from './InkWord';
import { EMOJI_FONT } from './LetterPaper';
import './envelope.css';

/** ふうとうの たて / よこ */
export const ENV_RATIO = 0.64;

const uidOf = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

/** けしいん (ひづけ いり) */
function Postmark({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <g transform="translate(744 262) rotate(-14)" opacity="0.82">
      <g className="env-postmark">
        <g fill="none" stroke="#c63f39" strokeLinecap="round">
          <circle r="74" strokeWidth="5" />
          <circle r="60" strokeWidth="2.6" />
          <path d="M-96,-30q-26,-14 -52,0t-52,0t-52,0M-96,0q-26,-14 -52,0t-52,0t-52,0M-96,30q-26,-14 -52,0t-52,0t-52,0" strokeWidth="4.5" />
        </g>
        <g fill="#c63f39" textAnchor="middle" fontWeight="800" style={{ fontFamily: 'var(--kids)' }}>
          <text y="-28" fontSize="22">
            てがみ
          </text>
          <text y="14" fontSize="36">
            {d.getMonth() + 1}.{d.getDate()}
          </text>
          <text y="44" fontSize="19">
            {d.getFullYear()}
          </text>
        </g>
      </g>
    </g>
  );
}

interface FrontProps {
  letter: Letter;
  /** けしいんを おす */
  stamped?: boolean;
  /** あいぼうを うごかさない (てがみばこ) */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** ふうとうの おもて: あて名 (こどもの もじ)・きって (あいぼう)・けしいん */
export function EnvelopeFront({ letter, stamped, still, className = '', style }: FrontProps) {
  const id = `ef${uidOf(useId())}`;
  const e = findPaper(letter.paper).envelope;
  const kind = useApp((s) => s.profile.buddy);
  const wear = useApp((s) => s.wear);
  const face = useBuddyFace();
  const perf: [number, number][] = [];
  for (let x = 0; x <= 190; x += 19) perf.push([x, 0], [x, 226]);
  for (let y = 19; y < 226; y += 18.8) perf.push([0, y], [190, y]);
  return (
    <div className={`env-front ${still ? 'still' : ''} ${className}`} style={style}>
      <svg viewBox="0 0 1000 640" className="env-svg" aria-hidden>
        <defs>
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={e.body} />
            <stop offset="1" stopColor={e.flap} />
          </linearGradient>
          <pattern id={`${id}-dot`} width="46" height="46" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="4" fill={e.liner} opacity="0.2" />
            <circle cx="35" cy="35" r="4" fill={e.liner} opacity="0.2" />
          </pattern>
          <mask id={`${id}-perf`}>
            <rect width="190" height="226" fill="#fff" />
            {perf.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="6.5" fill="#000" />
            ))}
          </mask>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfe6ff" />
            <stop offset="1" stopColor="#fff4d9" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="988" height="628" rx="26" fill={`url(#${id}-b)`} stroke={e.edge} strokeWidth="5" />
        <rect x="6" y="6" width="988" height="628" rx="26" fill={`url(#${id}-dot)`} />
        <rect x="32" y="32" width="936" height="576" rx="16" fill="none" stroke={e.edge} strokeWidth="3" strokeDasharray="14 12" />
        {/* きって */}
        <g transform="translate(762 46)">
          <rect x="4" y="6" width="190" height="226" fill="rgba(60, 30, 10, 0.16)" mask={`url(#${id}-perf)`} />
          <rect width="190" height="226" fill="#fffdf8" mask={`url(#${id}-perf)`} />
          <rect x="16" y="16" width="158" height="194" rx="6" fill={`url(#${id}-sky)`} />
          <path d="M16,172Q60,150 95,166T174,160L174,204Q174,210 168,210L22,210Q16,210 16,204Z" fill="#a9df8c" />
          <text x="95" y="203" textAnchor="middle" fontSize="17" fontWeight="800" fill="#4f8a3a" style={{ fontFamily: 'var(--kids)' }}>
            ひらがな
          </text>
          <text x="164" y="40" textAnchor="end" fontSize="22" fill="#ff6f91" fontFamily={EMOJI_FONT}>
            ♡
          </text>
        </g>
        {/* あて名 */}
        <InkWord letter={letter} part="to" x={70} y={276} width={620} height={170} />
        <path d="M80,470L690,470" stroke={e.edge} strokeWidth="5" strokeDasharray="0.1 14" strokeLinecap="round" />
        {stamped && <Postmark at={letter.posted ?? Date.now()} />}
      </svg>
      <div className="env-stamp-buddy">
        <Mascot kind={kind} outfit={wear} face={face} mood="happy" size="100%" talking={false} />
      </div>
    </div>
  );
}

export type EnvStage = 'letter' | 'folded' | 'above' | 'inside' | 'closed' | 'front';

interface SceneProps {
  letter: Letter;
  stage: EnvStage;
  /** てがみの 画像 (object URL)。たたむ ときに つかう */
  image: string | null;
  /** ふうとうの はば (px) */
  width: number;
  /** シールで とめた */
  sealed?: boolean;
  stamped?: boolean;
  /** ふうとうの うえに かさねる もの */
  children?: ReactNode;
  className?: string;
}

/** ふうとうの はば W の ときの おおきさ (Eh: ふうとうの たかさ、Lw/Lh: てがみ、F: たたんだ たかさ、H: ぜんたい) */
export function sceneMetrics(W: number) {
  const Eh = W * ENV_RATIO;
  const Lw = W * 0.8;
  const Lh = (Lw * PAPER_H) / PAPER_W;
  const F = Lh / 3;
  const H = Math.max(Lh, Eh + F * 0.95) + 16;
  return { Eh, Lw, Lh, F, H, envTop: H - Eh };
}

/** ひろげた てがみ ⇄ たたむ ⇄ ふうとうに いれる ⇄ しめる ⇄ おもて */
export function EnvelopeScene({ letter, stage, image, width: W, sealed, stamped, children, className = '' }: SceneProps) {
  const id = `es${uidOf(useId())}`;
  const e = findPaper(letter.paper).envelope;
  const { Eh, Lw, Lh, F, H, envTop } = sceneMetrics(W);
  const letterTop: Record<EnvStage, number> = {
    letter: (H - Lh) / 2,
    folded: (H - Lh) / 2,
    above: envTop + Eh * 0.16 - 2 * F,
    inside: envTop + Eh * 0.06 - F,
    closed: envTop + Eh * 0.06 - F,
    front: envTop + Eh * 0.06 - F,
  };
  const folded = stage !== 'letter';
  const envShown = stage !== 'letter' && stage !== 'folded';
  const flapOpen = stage !== 'closed' && stage !== 'front';
  const front = stage === 'front';

  // おもて ⇄ うら は くるっと まわす
  const [face, setFace] = useState<'front' | 'back'>(front ? 'front' : 'back');
  const [flipping, setFlipping] = useState(false);
  useEffect(() => {
    const want = front ? 'front' : 'back';
    if (want === face) return;
    setFlipping(true);
    const t1 = setTimeout(() => setFace(want), 240);
    const t2 = setTimeout(() => setFlipping(false), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [front]);

  const panel = (pos: number): CSSProperties => ({
    height: F,
    backgroundImage: image ? `url(${image})` : undefined,
    backgroundSize: `${Lw}px ${Lh}px`,
    backgroundPosition: `0 ${-pos * F}px`,
  });
  const envStyle: CSSProperties = { top: envTop, width: W, height: Eh };
  const off = envShown ? 0 : Eh * 0.9;

  return (
    <div className={`env-scene ${className} ${flipping ? 'flipping' : ''}`} style={{ width: W, height: H }} data-stage={stage}>
      <div className="env-shadow" style={{ top: envTop + Eh - Eh * 0.04, width: W * 0.9, left: W * 0.05, opacity: envShown ? 1 : 0 }} />
      <div className="env-turn" style={{ transformOrigin: `50% ${envTop + Eh / 2}px` }}>
        {face === 'front' ? (
          <EnvelopeFront letter={letter} stamped={stamped} style={envStyle} className="env-abs" />
        ) : (
          <>
            {/* ふうとうの なか */}
            <div className="env-layer env-inner" style={{ ...envStyle, transform: `translateY(${off}px)`, opacity: envShown ? 1 : 0 }}>
              <svg viewBox="0 0 1000 640" preserveAspectRatio="none" className="env-svg" aria-hidden>
                <defs>
                  <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={e.liner} stopOpacity="0.55" />
                    <stop offset="0.6" stopColor={e.edge} />
                  </linearGradient>
                </defs>
                <rect x="6" y="6" width="988" height="628" rx="26" fill={e.body} />
                <rect x="6" y="6" width="988" height="628" rx="26" fill={`url(#${id}-in)`} />
              </svg>
            </div>
            {/* ふた */}
            <div
              className={`env-flap ${flapOpen ? 'open' : 'closed'}`}
              style={{
                top: envTop,
                width: W,
                height: Eh * 0.625,
                opacity: envShown ? 1 : 0,
                transform: `translateY(${off}px) perspective(${W * 2.4}px) rotateX(${flapOpen ? 180 : 0}deg)`,
              }}
            >
              <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="env-svg flap-out" aria-hidden>
                <path d="M6,6L994,6L540,372Q500,402 460,372Z" fill={e.flap} stroke={e.edge} strokeWidth="5" strokeLinejoin="round" />
                <path d="M40,14L500,360L960,14" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="4" />
              </svg>
              <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="env-svg flap-in" aria-hidden>
                <path d="M6,394L994,394L540,28Q500,-2 460,28Z" fill={e.liner} stroke={e.edge} strokeWidth="5" strokeLinejoin="round" />
                <path d="M120,394L500,90L880,394" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="10" />
              </svg>
              {sealed && (
                <span className="env-seal" style={{ fontSize: W * 0.13 }}>
                  {letter.seal}
                </span>
              )}
            </div>
            {/* てがみ (3つに たたむ) */}
            <div
              className={`env-letter ${folded ? 'folded' : ''}`}
              style={{ left: (W - Lw) / 2, width: Lw, height: Lh, transform: `translateY(${letterTop[stage]}px)` }}
            >
              <div className="fold-panel mid" style={{ ...panel(1), top: F }} />
              <div className="fold-panel bot" style={{ top: 2 * F, height: F }}>
                <div className="fold-face front" style={panel(2)} />
                <div className="fold-face back" />
              </div>
              <div className="fold-panel top" style={{ top: 0, height: F }}>
                <div className="fold-face front" style={panel(0)} />
                <div className="fold-face back" />
              </div>
            </div>
            {/* ポケット (てがみの まえ) */}
            <div className="env-layer env-pocket" style={{ ...envStyle, transform: `translateY(${off}px)`, opacity: envShown ? 1 : 0 }}>
              <svg viewBox="0 0 1000 640" preserveAspectRatio="none" className="env-svg" aria-hidden>
                <path
                  d="M6,14L500,352L994,14L994,608Q994,634 968,634L32,634Q6,634 6,608Z"
                  fill={e.body}
                  stroke={e.edge}
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path d="M16,624L438,318M984,624L562,318" stroke={e.edge} strokeWidth="3.5" opacity="0.7" />
                <InkWord letter={letter} part="from" x={600} y={500} width={340} height={104} />
              </svg>
            </div>
          </>
        )}
      </div>
      {children}
    </div>
  );
}
