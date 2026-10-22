import { useId } from 'react';
import { findInk, findPaper } from '../../data/letters';
import { glyphTransform, letterSlots, type PartKind } from '../../lib/letterLayout';
import { inkOf, type Letter, type Strokes } from '../../state/letters';
import { InkFilters, InkStrokes } from './ink';

interface Props {
  letter: Letter;
  part: PartKind;
  /** ほかの SVG の なかに おく とき */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  className?: string;
}

const STEP = 94;

/** あて名 (ままへ) や なまえ (ゆいより) を よこ 1れつに (ふうとう・てがみばこ) */
export default function InkWord({ letter, part, x, y, width, height, className }: Props) {
  const uid = `iw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const slots = letterSlots(letter).filter((s) => s.part === part);
  const ink = findInk(letter.color);
  const dark = findPaper(letter.paper).dark;
  const w = Math.max(1, slots.length) * STEP + 15;
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox={`0 0 ${w} 109`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <InkFilters id={uid} w={w} h={109} />
      </defs>
      <g filter={dark ? `url(#${uid}-glow)` : undefined}>
        <g filter={letter.pen === 'crayon' ? `url(#${uid}-crayon)` : undefined}>
          {slots.map((s, i) => {
            const e = inkOf(letter, s);
            if (!e) return null;
            const g = glyphTransform(s.ch, false);
            return (
              <g key={s.key} transform={`translate(${i * STEP} 0)`}>
                <g transform={g.t || undefined}>
                  <InkStrokes strokes={e.ink} pen={letter.pen} color={ink.color} rainbow={ink.id === 'niji'} offset={i * 2} k={g.k} />
                </g>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/** 1もじ (れんしゅうした もじ・かいている ことばの ならび) */
export function InkGlyph({
  strokes,
  letter,
  ch,
  className,
}: {
  strokes: Strokes;
  letter: Pick<Letter, 'pen' | 'color' | 'paper'>;
  ch?: string;
  className?: string;
}) {
  const uid = `ig${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ink = findInk(letter.color);
  const dark = findPaper(letter.paper).dark;
  const g = ch ? glyphTransform(ch, false) : { t: '', k: 1 };
  return (
    <svg viewBox="0 0 109 109" className={className} aria-hidden>
      <defs>
        <InkFilters id={uid} w={109} h={109} />
      </defs>
      <g filter={dark ? `url(#${uid}-glow)` : undefined}>
        <g filter={letter.pen === 'crayon' ? `url(#${uid}-crayon)` : undefined}>
          <g transform={g.t || undefined}>
            <InkStrokes strokes={strokes} pen={letter.pen} color={ink.color} rainbow={ink.id === 'niji'} k={g.k} />
          </g>
        </g>
      </g>
    </svg>
  );
}
