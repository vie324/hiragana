/**
 * てがみ 1まい (びんせん + こどもが かいた もじ + シール) の SVG。
 * かく 画面・かざる 画面・てがみばこ・画像に する ときで おなじ ものを つかう。
 * 画像に する とき (mode='export') は シールを えがかない (canvas で あとから えがく)。
 */
import { memo, useId, useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import { findInk, findPaper, PAPER_H, PAPER_W } from '../../data/letters';
import { glyphTransform, layoutLetter, type Layout } from '../../lib/letterLayout';
import { getStrokes } from '../../lib/strokes';
import { inkOf, type Letter, type LetterSticker } from '../../state/letters';
import { useApp } from '../../state/store';
import { PaperBackground, PaperGuides } from './PaperArt';
import { InkFilters, InkStrokes } from './ink';
import './letter.css';

export type PaperMode = 'view' | 'write' | 'export';

interface Props {
  letter: Letter;
  mode?: PaperMode;
  /** いま かいている マス */
  current?: string | null;
  /** まだ みせない もじ (とんでくる とちゅう) */
  hidden?: ReadonlySet<string>;
  onCell?: (key: string) => void;
  /** シールを うごかす (かざる 画面) */
  onStickerDown?: (e: ReactPointerEvent, sticker: LetterSticker) => void;
  /** うごかしている シール (ここには ださない) */
  dragging?: string | null;
  /** よみあげている もじ (ひかる) */
  lit?: ReadonlySet<string> | null;
  className?: string;
  /** 画像に する ときの おおきさ (px) */
  width?: number;
}

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();

export function letterLayoutOf(letter: Letter): Layout {
  return layoutLetter(letter, findPaper(letter.paper).area, letter.tate);
}

export function dateLabel(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}ねん ${d.getMonth() + 1}がつ ${d.getDate()}にち`;
}

/** シールの ばしょ (びんせんの ざひょう) */
export const stickerPos = (s: LetterSticker) => ({ x: (s.x / 100) * PAPER_W, y: (s.y / 100) * PAPER_H });
/** シールの おおきさ (びんせんの はばに たいして) */
export const STICKER_SIZE = 118;
export const EMOJI_FONT = "'Apple Color Emoji', 'Noto Color Emoji', 'Segoe UI Emoji', sans-serif";

function StickerArt({ s, faces }: { s: LetterSticker; faces: { id: string; img: string }[] }) {
  const p = stickerPos(s);
  const t = `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(s.r)}) scale(${s.k})`;
  if (s.s.startsWith('face:')) {
    const img = faces.find((f) => f.id === s.s.slice(5))?.img;
    if (!img) return null;
    const r = STICKER_SIZE * 0.5;
    return (
      <g transform={t}>
        <circle r={r + 7} fill="#ffffff" />
        <clipPath id={`face-${s.id}`}>
          <circle r={r} />
        </clipPath>
        <image href={img} x={-r} y={-r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#face-${s.id})`} />
      </g>
    );
  }
  return (
    <text transform={t} fontSize={STICKER_SIZE} textAnchor="middle" dominantBaseline="central" fontFamily={EMOJI_FONT}>
      {s.s}
    </text>
  );
}

function LetterPaper({ letter, mode = 'view', current, hidden, onCell, onStickerDown, dragging, lit, className = '', width }: Props) {
  const uid = `lp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const paper = findPaper(letter.paper);
  const ink = findInk(letter.color);
  const rainbow = ink.id === 'niji';
  const faces = useApp((s) => s.faces);
  const layout = useMemo(() => layoutLetter(letter, paper.area, letter.tate), [letter.to, letter.lines, letter.from, paper, letter.tate]);
  const writing = mode === 'write';
  const crayon = letter.pen === 'crayon';

  return (
    <svg
      className={`letter-paper ${className}`}
      viewBox={`0 0 ${PAPER_W} ${PAPER_H}`}
      width={width}
      height={width ? Math.round((width * PAPER_H) / PAPER_W) : undefined}
      xmlns="http://www.w3.org/2000/svg"
      data-paper={paper.id}
      data-testid={mode === 'export' ? undefined : 'letter-paper'}
    >
      <defs>
        <InkFilters id={uid} w={PAPER_W} h={PAPER_H} />
      </defs>
      <PaperBackground paper={paper} uid={uid} />
      <PaperGuides paper={paper} layout={layout} />

      {/* まだ かいていない マス: お手本を うすく */}
      {mode !== 'export' && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={paper.hintColor}>
          {layout.cells.map((c) => {
            if (inkOf(letter, c) && !hidden?.has(c.key)) return null;
            const g = glyphTransform(c.ch, layout.tate);
            const data = getStrokes(c.ch);
            if (!data) return null;
            return (
              <g key={c.key} transform={`translate(${f1(c.x)} ${f1(c.y)}) scale(${(c.s / 109).toFixed(4)})`}>
                <g transform={g.t || undefined} strokeWidth={f1(9 / g.k)}>
                  {data.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* いま かいている マス */}
      {writing &&
        current &&
        layout.cells
          .filter((c) => c.key === current)
          .map((c) => (
            <rect
              key={c.key}
              className="lp-current"
              x={f1(c.x - c.s * 0.06)}
              y={f1(c.y - c.s * 0.06)}
              width={f1(c.s * 1.12)}
              height={f1(c.s * 1.12)}
              rx={f1(c.s * 0.2)}
              fill="rgba(255, 214, 107, 0.26)"
              stroke="#ffb02e"
              strokeWidth={f1(Math.max(5, c.s * 0.06))}
            />
          ))}

      {/* よみあげている ところ */}
      {lit && (
        <g className="lp-lit">
          {layout.cells
            .filter((c) => lit.has(c.key))
            .map((c) => (
              <rect
                key={c.key}
                x={f1(c.x - c.s * 0.04)}
                y={f1(c.y - c.s * 0.04)}
                width={f1(c.s * 1.08)}
                height={f1(c.s * 1.08)}
                rx={f1(c.s * 0.22)}
                fill="rgba(255, 220, 90, 0.5)"
              />
            ))}
        </g>
      )}

      {/* かいた もじ */}
      <g filter={paper.dark ? `url(#${uid}-glow)` : undefined}>
        <g filter={crayon ? `url(#${uid}-crayon)` : undefined}>
          {layout.cells.map((c, ci) => {
            const e = inkOf(letter, c);
            if (!e || hidden?.has(c.key)) return null;
            const g = glyphTransform(c.ch, layout.tate);
            return (
              <g
                key={c.key}
                transform={`translate(${f1(c.x)} ${f1(c.y)}) scale(${(c.s / 109).toFixed(4)})`}
                opacity={writing && c.key === current ? 0.3 : undefined}
              >
                <g transform={g.t || undefined}>
                  <InkStrokes strokes={e.ink} pen={letter.pen} color={ink.color} rainbow={rainbow} offset={ci * 2} k={g.k} />
                </g>
              </g>
            );
          })}
        </g>
      </g>

      {/* ひづけ */}
      <text
        x={paper.date.x}
        y={paper.date.y}
        textAnchor={paper.date.anchor}
        fill={paper.date.color}
        fontSize="30"
        fontWeight="700"
        letterSpacing="2"
        fontFamily="'Hiragino Maru Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
      >
        {dateLabel(letter.posted ?? letter.created)}
      </text>

      {mode !== 'export' && (
        <g className={onStickerDown ? 'lp-stickers movable' : 'lp-stickers'}>
          {letter.stickers.map((s) =>
            s.id === dragging ? null : (
              <g key={s.id} onPointerDown={onStickerDown ? (e) => onStickerDown(e, s) : undefined} data-sticker={s.id}>
                <StickerArt s={s} faces={faces} />
              </g>
            ),
          )}
        </g>
      )}

      {/* マスを えらぶ (かく 画面) / とんでいく さきを しらべる */}
      {mode !== 'export' && (
        <g className={onCell ? 'lp-cells tappable' : 'lp-cells'}>
          {layout.cells.map((c) => (
            <rect
              key={c.key}
              x={f1(c.x)}
              y={f1(c.y)}
              width={f1(c.s)}
              height={f1(c.s)}
              fill="transparent"
              data-slot={c.key}
              onClick={onCell ? () => onCell(c.key) : undefined}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(LetterPaper);
