import { useLayoutEffect, useRef } from 'react';
import { getStrokes } from '../lib/strokes';
import './writing.css';

interface Props {
  kana: string;
  /** かわるたびに さいしょから アニメーション */
  playKey?: number;
  /** 1画あたりの びょう */
  speed?: number;
  showNumbers?: boolean;
  className?: string;
  onDone?: () => void;
  color?: string;
}

/** かきじゅんの アニメーション */
export default function StrokeOrder({ kana, playKey = 0, speed = 0.9, showNumbers = true, className = '', onDone, color = '#ff8f3f' }: Props) {
  const data = getStrokes(kana);
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const numRefs = useRef<(SVGGElement | null)[]>([]);

  useLayoutEffect(() => {
    if (!data) return;
    const anims: Animation[] = [];
    let delay = 200;
    refs.current.forEach((p, i) => {
      if (!p) return;
      const len = p.getTotalLength?.() || 100;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      const dur = Math.max(300, speed * 1000 * Math.min(1.6, Math.max(0.5, len / 60)));
      if (typeof p.animate === 'function') {
        const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration: dur,
          delay,
          fill: 'forwards',
          easing: 'ease-in-out',
        });
        anims.push(a);
        const n = numRefs.current[i];
        if (n) {
          anims.push(n.animate([{ opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 250, delay, fill: 'both' }));
        }
        if (i === refs.current.length - 1) a.onfinish = () => onDone?.();
      } else {
        p.style.strokeDashoffset = '0';
      }
      delay += dur + 180;
    });
    return () => anims.forEach((a) => a.cancel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kana, playKey]);

  if (!data) return <div className={`stroke-order ${className}`} />;
  return (
    <svg className={`stroke-order ${className}`} viewBox="0 0 109 109" aria-label={`${kana} の かきじゅん`}>
      <GridLines />
      <g fill="none" stroke="#eadfd3" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        {data.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {data.paths.map((d, i) => (
          <path key={`${playKey}-${i}`} d={d} ref={(el) => void (refs.current[i] = el)} />
        ))}
      </g>
      {showNumbers &&
        data.points.map((pts, i) => {
          const p = pts[0];
          return (
            <g key={`${playKey}-n${i}`} ref={(el) => void (numRefs.current[i] = el)} style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'view-box' }}>
              <circle cx={p.x} cy={p.y} r="5.2" fill="#4db4ff" />
              <text x={p.x} y={p.y + 0.3} fontSize="7" textAnchor="middle" dominantBaseline="central" fill="#fff" fontWeight="700" fontFamily="sans-serif">
                {i + 1}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

export function GridLines() {
  return (
    <g className="grid-lines" aria-hidden>
      <rect x="1.5" y="1.5" width="106" height="106" rx="8" fill="none" stroke="#f0b27a" strokeWidth="1.6" />
      <line x1="54.5" y1="4" x2="54.5" y2="105" stroke="#f5c9a0" strokeWidth="0.9" strokeDasharray="3 3" />
      <line x1="4" y1="54.5" x2="105" y2="54.5" stroke="#f5c9a0" strokeWidth="0.9" strokeDasharray="3 3" />
    </g>
  );
}
