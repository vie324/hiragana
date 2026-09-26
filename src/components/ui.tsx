import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { sfx } from '../lib/sound';
import { back, goHome } from '../state/router';

type Color = 'orange' | 'pink' | 'blue' | 'green' | 'yellow' | 'purple' | 'white' | 'gray';

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  color?: Color;
  round?: boolean;
  size?: number;
  quiet?: boolean;
}

export function Btn({ color = 'orange', round, size, quiet, className = '', style, onClick, children, ...rest }: BtnProps) {
  const st: CSSProperties = { ...(size ? ({ '--size': `${size}px` } as CSSProperties) : {}), ...style };
  return (
    <button
      type="button"
      className={`btn ${color} ${round ? 'round' : ''} ${className}`}
      style={st}
      onClick={(e) => {
        if (!quiet) sfx.tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Emoji({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={`emoji ${className}`} style={style} aria-hidden>
      {children}
    </span>
  );
}

interface TopBarProps {
  /** 'home' = おうちボタン, 'back' = もどる */
  nav?: 'home' | 'back' | 'none';
  onNav?: () => void;
  title?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}

export function TopBar({ nav = 'back', onNav, title, right, children }: TopBarProps) {
  return (
    <div className="topbar">
      {nav !== 'none' && (
        <Btn
          round
          size={72}
          color="white"
          aria-label={nav === 'home' ? 'おうち' : 'もどる'}
          onClick={() => {
            if (onNav) onNav();
            else if (nav === 'home') goHome();
            else back();
          }}
        >
          <Emoji>{nav === 'home' ? '🏠' : '⬅️'}</Emoji>
        </Btn>
      )}
      {title && <div className="title">{title}</div>}
      <div className="spacer">{children}</div>
      {right}
    </div>
  );
}

export function Stars({ n, max = 3, size = 28 }: { n: number; max?: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`ほし ${n}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`s ${i < n ? 'on' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="progress-dots" aria-label={`${current + 1} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < current ? 'done' : i === current ? 'now' : ''} />
      ))}
    </div>
  );
}

export function SpeakerButton({ onClick, size = 72 }: { onClick: () => void; size?: number }) {
  return (
    <Btn round size={size} color="yellow" aria-label="もういちど きく" onClick={onClick}>
      <Emoji>🔊</Emoji>
    </Btn>
  );
}
