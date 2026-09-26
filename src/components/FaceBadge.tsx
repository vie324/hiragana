import type { CSSProperties } from 'react';
import './face.css';

/** まるい かおしゃしん (えほんの こども・シール など) */
export default function FaceBadge({ img, size, className = '', style }: { img: string; size: number | string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`face-badge ${className}`} style={{ width: size, height: size, ...style }}>
      <img src={img} alt="" draggable={false} />
    </span>
  );
}
