import { useEffect, useId, useState, type CSSProperties } from 'react';
import { isSpeaking, onSpeakingChange } from '../lib/speech';
import type { BuddyKind } from '../state/store';
import { findOutfit } from '../data/outfits';
import './mascot.css';

export type Mood = 'normal' | 'happy' | 'sad' | 'sleep' | 'wow' | 'think' | 'cheer';

interface Props {
  kind: BuddyKind;
  mood?: Mood;
  /** 口を うごかす (しゃべっている)。undefined なら よみあげに あわせる */
  talking?: boolean;
  outfit?: string | null;
  /** かおに する しゃしん (data URL)。あれば どうぶつの かおの かわりに だす */
  face?: string | null;
  wave?: boolean;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  onTap?: () => void;
  /** 毎回 ちがう アニメーションに したいとき かえる */
  bump?: number;
}

const COLORS: Record<BuddyKind, { body: string; shade: string; inner: string; line: string; cheek: string }> = {
  usagi: { body: '#fffdfb', shade: '#f3e4dc', inner: '#ffc2d4', line: '#e9d3c8', cheek: '#ffb3c9' },
  kuma: { body: '#e0a468', shade: '#c8864b', inner: '#f6d8b4', line: '#b9783f', cheek: '#ff9fa3' },
  neko: { body: '#ffd08e', shade: '#f1b061', inner: '#ffc1cf', line: '#e39c4c', cheek: '#ffa0b4' },
  hiyoko: { body: '#ffe45e', shade: '#f5c93a', inner: '#ffb347', line: '#e9bf2a', cheek: '#ffab8f' },
};

export function useTalking(): boolean {
  const [t, setT] = useState(isSpeaking());
  useEffect(() => onSpeakingChange(setT), []);
  return t;
}

export default function Mascot({ kind, mood = 'normal', talking, outfit, face, wave, size = 200, className = '', style, onTap, bump }: Props) {
  const speakingNow = useTalking();
  const isTalking = talking ?? speakingNow;
  const c = COLORS[kind];
  const gid = useId().replace(/:/g, '');
  const o = findOutfit(outfit);
  const [poke, setPoke] = useState(0);

  const cls = ['mascot', `mood-${mood}`, `kind-${kind}`, face ? 'has-face' : '', isTalking && mood !== 'sleep' ? 'talking' : '', wave ? 'waving' : '', className]
    .filter(Boolean)
    .join(' ');

  const outfitPos = (() => {
    if (!o) return null;
    switch (o.pos) {
      case 'head':
        return kind === 'usagi' ? { x: 100, y: 58, s: 46 } : { x: 100, y: 52, s: 50 };
      case 'ear':
        return kind === 'usagi'
          ? { x: 134, y: 44, s: 34 }
          : kind === 'kuma'
            ? { x: 150, y: 58, s: 34 }
            : kind === 'neko'
              ? { x: 142, y: 52, s: 34 }
              : { x: 136, y: 66, s: 32 };
      case 'eyes':
        return face ? { x: 100, y: 110, s: 80 } : { x: 100, y: 124, s: 74 };
      case 'neck':
        return { x: 100, y: 180, s: 40 };
      case 'hand':
        return { x: 176, y: 148, s: 44 };
    }
  })();

  return (
    <div
      className={cls}
      style={{ width: size, ...style }}
      onPointerDown={
        onTap
          ? () => {
              setPoke((p) => p + 1);
              onTap();
            }
          : undefined
      }
      role={onTap ? 'button' : undefined}
      aria-label="あいぼう"
    >
      <div className="mascot-hop" key={`${poke}-${bump ?? 0}`}>
        <svg viewBox="0 0 200 210" className="mascot-svg" aria-hidden>
          <defs>
            <radialGradient id={`g${gid}`} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="200" rx="58" ry="7" fill="rgba(90,60,30,0.14)" className="m-shadow" />

          {/* みみ */}
          <g className="m-ears">
            {kind === 'usagi' && (
              <>
                <g className="m-ear m-ear-l">
                  <ellipse cx="72" cy="46" rx="17" ry="42" fill={c.body} stroke={c.line} strokeWidth="3" transform="rotate(-12 72 46)" />
                  <ellipse cx="72" cy="50" rx="8" ry="30" fill={c.inner} transform="rotate(-12 72 50)" />
                </g>
                <g className="m-ear m-ear-r">
                  <ellipse cx="128" cy="46" rx="17" ry="42" fill={c.body} stroke={c.line} strokeWidth="3" transform="rotate(12 128 46)" />
                  <ellipse cx="128" cy="50" rx="8" ry="30" fill={c.inner} transform="rotate(12 128 50)" />
                </g>
              </>
            )}
            {kind === 'kuma' && (
              <>
                <g className="m-ear m-ear-l">
                  <circle cx="50" cy="66" r="22" fill={c.body} stroke={c.line} strokeWidth="3" />
                  <circle cx="50" cy="66" r="12" fill={c.inner} />
                </g>
                <g className="m-ear m-ear-r">
                  <circle cx="150" cy="66" r="22" fill={c.body} stroke={c.line} strokeWidth="3" />
                  <circle cx="150" cy="66" r="12" fill={c.inner} />
                </g>
              </>
            )}
            {kind === 'neko' && (
              <>
                <g className="m-ear m-ear-l">
                  <path d="M40 92 L52 26 L96 62 Z" fill={c.body} stroke={c.line} strokeWidth="3" strokeLinejoin="round" />
                  <path d="M52 78 L58 42 L82 62 Z" fill={c.inner} strokeLinejoin="round" />
                </g>
                <g className="m-ear m-ear-r">
                  <path d="M160 92 L148 26 L104 62 Z" fill={c.body} stroke={c.line} strokeWidth="3" strokeLinejoin="round" />
                  <path d="M148 78 L142 42 L118 62 Z" fill={c.inner} strokeLinejoin="round" />
                </g>
              </>
            )}
            {kind === 'hiyoko' && (
              <g className="m-ear m-tuft">
                <path d="M100 52 C92 34 96 22 104 18 C104 30 108 40 100 52 Z" fill={c.shade} />
                <path d="M100 54 C112 38 124 36 130 40 C120 44 112 52 100 54 Z" fill={c.shade} />
              </g>
            )}
          </g>

          {/* うで */}
          <g className="m-arm m-arm-l">
            <ellipse cx="34" cy="138" rx="14" ry="20" fill={c.body} stroke={c.line} strokeWidth="3" transform="rotate(25 34 138)" />
          </g>
          <g className="m-arm m-arm-r">
            <ellipse cx="166" cy="138" rx="14" ry="20" fill={c.body} stroke={c.line} strokeWidth="3" transform="rotate(-25 166 138)" />
          </g>

          {/* あし */}
          <ellipse cx="72" cy="188" rx="20" ry="11" fill={kind === 'hiyoko' ? '#ff9f43' : c.body} stroke={kind === 'hiyoko' ? '#e67e22' : c.line} strokeWidth="3" />
          <ellipse cx="128" cy="188" rx="20" ry="11" fill={kind === 'hiyoko' ? '#ff9f43' : c.body} stroke={kind === 'hiyoko' ? '#e67e22' : c.line} strokeWidth="3" />

          {/* からだ */}
          <ellipse cx="100" cy="124" rx="76" ry="68" fill={c.body} stroke={c.line} strokeWidth="3" />
          <ellipse cx="100" cy="124" rx="76" ry="68" fill={`url(#g${gid})`} />
          {face ? (
            <g className="m-face">
              <defs>
                <clipPath id={`f${gid}`}>
                  <circle cx="100" cy="118" r="58" />
                </clipPath>
              </defs>
              <circle cx="100" cy="118" r="63" fill="#fff" stroke={c.line} strokeWidth="3" />
              <image href={face} x="42" y="60" width="116" height="116" clipPath={`url(#f${gid})`} preserveAspectRatio="xMidYMid slice" className="m-photo" />
              <ellipse cx="62" cy="150" rx="11" ry="6.5" fill={c.cheek} opacity="0.5" />
              <ellipse cx="138" cy="150" rx="11" ry="6.5" fill={c.cheek} opacity="0.5" />
              {mood === 'sleep' && <circle cx="100" cy="118" r="58" fill="#1d2b5a" opacity="0.35" />}
            </g>
          ) : (
            <>
            {kind === 'neko' && (
              <g stroke={c.shade} strokeWidth="5" strokeLinecap="round">
                <line x1="100" y1="62" x2="100" y2="76" />
                <line x1="86" y1="64" x2="88" y2="76" />
                <line x1="114" y1="64" x2="112" y2="76" />
              </g>
            )}
            {kind === 'kuma' && <ellipse cx="100" cy="140" rx="30" ry="22" fill={c.inner} />}
            {kind === 'hiyoko' && (
              <ellipse cx="100" cy="150" rx="40" ry="26" fill="#fff3a8" opacity="0.8" />
            )}

            {/* ほっぺ */}
            <ellipse cx="54" cy="136" rx="13" ry="8" fill={c.cheek} opacity="0.55" className="m-cheek" />
            <ellipse cx="146" cy="136" rx="13" ry="8" fill={c.cheek} opacity="0.55" className="m-cheek" />

            {/* め */}
            <g className="m-eyes">
              {mood === 'happy' || mood === 'cheer' ? (
                <g fill="none" stroke="#3b2a22" strokeWidth="6" strokeLinecap="round">
                  <path d="M62 118 Q72 104 82 118" />
                  <path d="M118 118 Q128 104 138 118" />
                </g>
              ) : mood === 'sleep' ? (
                <g fill="none" stroke="#3b2a22" strokeWidth="5" strokeLinecap="round">
                  <path d="M62 114 Q72 122 82 114" />
                  <path d="M118 114 Q128 122 138 114" />
                </g>
              ) : (
                <g className={mood === 'wow' ? 'm-eyes-wow' : 'm-eyes-open'}>
                  <ellipse cx="72" cy="114" rx="8.5" ry="11" fill="#3b2a22" />
                  <ellipse cx="128" cy="114" rx="8.5" ry="11" fill="#3b2a22" />
                  <circle cx="69" cy="109" r="3.4" fill="#fff" />
                  <circle cx="125" cy="109" r="3.4" fill="#fff" />
                  <circle cx="75" cy="119" r="1.6" fill="#fff" opacity="0.8" />
                  <circle cx="131" cy="119" r="1.6" fill="#fff" opacity="0.8" />
                </g>
              )}
              {mood === 'sad' && (
                <g stroke="#3b2a22" strokeWidth="4" strokeLinecap="round">
                  <line x1="60" y1="96" x2="80" y2="100" />
                  <line x1="140" y1="96" x2="120" y2="100" />
                </g>
              )}
            </g>

            {/* はな・くち */}
            {kind === 'hiyoko' ? (
              <g className="m-mouth">
                <g className="m-closed">
                  <path d="M88 130 L100 124 L112 130 L100 138 Z" fill="#ff9f43" stroke="#e67e22" strokeWidth="2" strokeLinejoin="round" />
                </g>
                <g className="m-open">
                  <path d="M88 128 L100 120 L112 128 Z" fill="#ff9f43" stroke="#e67e22" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M90 134 L100 146 L110 134 Z" fill="#ff9f43" stroke="#e67e22" strokeWidth="2" strokeLinejoin="round" />
                </g>
              </g>
            ) : (
              <>
                {kind === 'kuma' ? (
                  <ellipse cx="100" cy="128" rx="8" ry="6" fill="#5a3a2a" />
                ) : (
                  <ellipse cx="100" cy="128" rx="5" ry="3.6" fill={kind === 'usagi' ? '#ff8fb1' : '#ff8fa8'} />
                )}
                {kind === 'neko' && (
                  <g stroke="#b8804a" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
                    <line x1="30" y1="126" x2="52" y2="130" />
                    <line x1="30" y1="138" x2="52" y2="137" />
                    <line x1="170" y1="126" x2="148" y2="130" />
                    <line x1="170" y1="138" x2="148" y2="137" />
                  </g>
                )}
                <g className="m-mouth">
                  <g className="m-closed">
                    {mood === 'sad' ? (
                      <path d="M90 146 Q100 138 110 146" fill="none" stroke="#3b2a22" strokeWidth="4" strokeLinecap="round" />
                    ) : mood === 'wow' ? (
                      <ellipse cx="100" cy="144" rx="7" ry="9" fill="#7a3434" />
                    ) : (
                      <path d="M88 136 Q94 144 100 136 Q106 144 112 136" fill="none" stroke="#3b2a22" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </g>
                  <g className="m-open">
                    <path d="M86 136 Q100 164 114 136 Z" fill="#7a3434" stroke="#3b2a22" strokeWidth="3" strokeLinejoin="round" />
                    <ellipse cx="100" cy="151" rx="7" ry="4.5" fill="#ff8f9f" />
                  </g>
                </g>
              </>
            )}
            </>
          )}

          {mood === 'sleep' && (
            <g className="m-zzz" fill="#8aa6d6" fontFamily="sans-serif" fontWeight="bold">
              <text x="150" y="60" fontSize="26">z</text>
              <text x="166" y="40" fontSize="20">z</text>
            </g>
          )}

          {o && outfitPos && (
            <text
              x={outfitPos.x}
              y={outfitPos.y}
              fontSize={outfitPos.s}
              textAnchor="middle"
              dominantBaseline="central"
              className={`emoji m-outfit m-outfit-${o.pos}`}
            >
              {o.emoji}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
