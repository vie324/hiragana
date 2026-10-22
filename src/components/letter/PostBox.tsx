import { useId } from 'react';

interface Props {
  /** てがみを たべている (くちが ひらく) */
  eating?: boolean;
  /** にっこり */
  happy?: boolean;
  className?: string;
}

/** まるい ポスト (かおつき)。くちが てがみの いれぐち */
export default function PostBox({ eating, happy, className = '' }: Props) {
  const id = `pb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 260 470" className={`post-box ${eating ? 'eating' : ''} ${happy ? 'happy' : ''} ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b8191b" />
          <stop offset="0.28" stopColor="#f0463f" />
          <stop offset="0.5" stopColor="#e6332d" />
          <stop offset="0.82" stopColor="#c91f1f" />
          <stop offset="1" stopColor="#9c1213" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a51516" />
          <stop offset="0.35" stopColor="#e2403a" />
          <stop offset="1" stopColor="#8f1011" />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="458" rx="104" ry="11" fill="rgba(80, 40, 20, 0.18)" />
      <g className="pb-body">
        <rect x="74" y="398" width="112" height="54" rx="8" fill="#55525c" />
        <rect x="62" y="390" width="136" height="16" rx="7" fill="#6a6772" />
        <rect x="30" y="112" width="200" height="290" rx="26" fill={`url(#${id}-body)`} />
        <path d="M30,134C30,52 230,52 230,134Z" fill={`url(#${id}-top)`} />
        <rect x="20" y="118" width="220" height="26" rx="13" fill="#c42020" />
        <rect x="20" y="118" width="220" height="9" rx="4.5" fill="#e24a44" opacity="0.6" />
        <circle cx="130" cy="58" r="13" fill="#b51818" />
        <circle cx="126" cy="54" r="4" fill="#ff8a80" opacity="0.7" />
        {/* かお */}
        {happy ? (
          <g fill="none" stroke="#2b1717" strokeWidth="6" strokeLinecap="round">
            <path d="M80,196q12,-14 24,0" />
            <path d="M156,196q12,-14 24,0" />
          </g>
        ) : (
          <g className="pb-eyes">
            <ellipse cx="92" cy="190" rx="11" ry="14" fill="#2b1717" />
            <ellipse cx="168" cy="190" rx="11" ry="14" fill="#2b1717" />
            <circle cx="96" cy="184" r="4" fill="#fff" />
            <circle cx="172" cy="184" r="4" fill="#fff" />
          </g>
        )}
        <ellipse cx="66" cy="218" rx="15" ry="9" fill="#ffb3b0" opacity="0.75" />
        <ellipse cx="194" cy="218" rx="15" ry="9" fill="#ffb3b0" opacity="0.75" />
        {/* いれぐち (くち) */}
        <rect x="64" y="226" width="132" height="12" rx="6" fill="#d9403a" />
        <g className="pb-mouth">
          <rect x="74" y="238" width="112" height="24" rx="12" fill="#3a0c0c" />
          <rect x="84" y="242" width="92" height="6" rx="3" fill="#5a1616" />
        </g>
        {/* 〒 */}
        <circle cx="130" cy="318" r="34" fill="#fff6f0" />
        <path d="M110,304L150,304M110,316L150,316M130,316L130,342" stroke="#e2332d" strokeWidth="7" strokeLinecap="round" />
        <rect x="70" y="366" width="120" height="14" rx="7" fill="#b51b1b" opacity="0.5" />
      </g>
    </svg>
  );
}
