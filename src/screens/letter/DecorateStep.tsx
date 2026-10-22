import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Btn, Emoji, TopBar } from '../../components/ui';
import FaceBadge from '../../components/FaceBadge';
import LetterPaper, { letterLayoutOf } from '../../components/letter/LetterPaper';
import { PaperBackground, PaperGuides } from '../../components/letter/PaperArt';
import { layoutLetter } from '../../lib/letterLayout';
import { LETTER_STICKERS, PAPERS, PAPER_H, PAPER_W, PENS, RAINBOW, findPaper, inksFor, type PaperDef } from '../../data/letters';
import { RARE } from '../../data/stickers';
import { updateLetter, type Letter, type LetterSticker } from '../../state/letters';
import { back, navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import './letters.css';

type Tab = 'paper' | 'pen' | 'sticker';

const TABS: { id: Tab; emoji: string; label: string; say: string }[] = [
  { id: 'paper', emoji: '🎨', label: 'びんせん', say: 'すきな びんせんを えらんでね。' },
  { id: 'pen', emoji: '🖍️', label: 'いろ', say: 'もじの いろを かえられるよ。' },
  { id: 'sticker', emoji: '⭐', label: 'シール', say: 'シールを はろう!' },
];

const MAX_STICKERS = 24;
const SIZES = [1, 1.35, 0.7];

interface Drag {
  s: string;
  fromId?: string;
  x: number;
  y: number;
  pointerId: number;
}

/** びんせんの みほん (いまの てがみの マス・せんも だす) */
function PaperThumb({ paper, letter }: { paper: PaperDef; letter: Letter }) {
  const uid = `pt${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const layout = useMemo(() => layoutLetter(letter, paper.area, letter.tate), [letter.to, letter.lines, letter.from, letter.tate, paper]);
  return (
    <svg viewBox={`0 0 ${PAPER_W} ${PAPER_H}`} className="ld-thumb-svg" aria-hidden>
      <PaperBackground paper={paper} uid={uid} />
      <PaperGuides paper={paper} layout={layout} />
    </svg>
  );
}

function StickerFace({ s, faces }: { s: string; faces: { id: string; img: string }[] }) {
  if (s.startsWith('face:')) {
    const f = faces.find((x) => x.id === s.slice(5));
    return f ? <FaceBadge img={f.img} size="1em" /> : null;
  }
  return <span className="emoji">{s}</span>;
}

/** かざる: びんせん・もじの いろ・シール */
export default function DecorateStep({ letter }: { letter: Letter }) {
  const owned = useApp((s) => s.stickers);
  const faces = useApp((s) => s.faces);
  const [tab, setTab] = useState<Tab>('paper');
  const [drag, setDrag] = useState<Drag | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const paper = findPaper(letter.paper);
  const reDeco = !!letter.posted;

  const tray = useMemo(
    () => [
      ...LETTER_STICKERS,
      ...faces.map((f) => `face:${f.id}`),
      ...Object.entries(owned)
        .filter(([s, n]) => n > 0 && !LETTER_STICKERS.includes(s))
        .map(([s]) => s)
        .sort((a, b) => Number(RARE.has(b)) - Number(RARE.has(a))),
    ],
    [owned, faces],
  );

  useEffect(() => {
    void speak('びんせんや シールで かざろう!');
  }, []);

  const set = (fn: (l: Letter) => void) => updateLetter(letter.id, fn);

  const choosePaper = (p: PaperDef) => {
    if (p.id === letter.paper) return;
    sfx.whoosh();
    void speak(p.name);
    set((l) => {
      l.paper = p.id;
      if (!inksFor(p).some((i) => i.id === l.color)) l.color = p.ink;
    });
  };

  /** もじに かさならない ところを さがして シールを おく (%) */
  const freeSpot = (): { x: number; y: number } => {
    const cells = letterLayoutOf(letter).cells.map((c) => ({ x: ((c.x + c.s / 2) / PAPER_W) * 100, y: ((c.y + c.s / 2) / PAPER_H) * 100 }));
    const taken = [...cells, ...letter.stickers.map((s) => ({ x: s.x, y: s.y }))];
    let best = { x: 50, y: 50 };
    let bestD = -1;
    for (let i = 0; i < 40; i++) {
      const p = { x: 8 + Math.random() * 84, y: 6 + Math.random() * 88 };
      const d = Math.min(...taken.map((t) => Math.hypot(t.x - p.x, (t.y - p.y) * 1.414)), 999);
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  };

  const place = (s: string, x: number, y: number, fromId?: string) => {
    sfx.sticker();
    set((l) => {
      if (fromId) {
        const p = l.stickers.find((q) => q.id === fromId);
        if (!p) return;
        p.x = x;
        p.y = y;
        l.stickers = [...l.stickers.filter((q) => q !== p), p];
        return;
      }
      if (l.stickers.length >= MAX_STICKERS) l.stickers.shift();
      const item: LetterSticker = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        s,
        x,
        y,
        r: Math.round((Math.random() - 0.5) * 36),
        k: s.startsWith('face:') ? 1.1 : 0.8 + Math.random() * 0.25,
      };
      l.stickers.push(item);
    });
  };

  const toPaper = (cx: number, cy: number) => {
    const r = paperRef.current?.getBoundingClientRect();
    if (!r || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const p = toPaper(e.clientX, e.clientY);
      if (p) place(drag.s, p.x, p.y, drag.fromId);
      else if (drag.fromId) {
        // そとに だしたら はがす
        sfx.whoosh();
        set((l) => {
          l.stickers = l.stickers.filter((q) => q.id !== drag.fromId);
        });
      }
      setDrag(null);
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId === drag.pointerId) setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  /** トレイ: よこに ひっぱると ドラッグ、そのまま はなすと あいている ところに はる */
  const pressTray = (e: React.PointerEvent, s: string) => {
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cleanup);
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 0.6) {
        cleanup();
        sfx.tap();
        setDrag({ s, x: ev.clientX, y: ev.clientY, pointerId: id });
      } else if (Math.abs(dy) > 14) {
        cleanup(); // たてスクロール
      }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      cleanup();
      const p = freeSpot();
      place(s, p.x, p.y);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cleanup);
  };

  /** はった シール: うごかすと ドラッグ、タッチだけなら おおきさを かえる */
  const pressPlaced = (e: React.PointerEvent, st: LetterSticker) => {
    e.preventDefault();
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cleanup);
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id || Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      cleanup();
      setDrag({ s: st.s, fromId: st.id, x: ev.clientX, y: ev.clientY, pointerId: id });
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      cleanup();
      sfx.pop();
      set((l) => {
        const p = l.stickers.find((q) => q.id === st.id);
        if (!p) return;
        const i = SIZES.findIndex((k) => Math.abs(k - p.k) < 0.12);
        p.k = SIZES[(i + 1) % SIZES.length];
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cleanup);
  };

  const finish = () => {
    if (reDeco) {
      sfx.correct();
      void speak('すてきに なったね!');
      back();
      return;
    }
    void speak('ふうとうに いれよう!');
    navigate({ name: 'letter', id: letter.id, step: 'post' });
  };

  const inks = inksFor(paper);

  return (
    <div className="screen letter-screen letter-deco">
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>🎨</Emoji> かざろう!
          </>
        }
        right={
          <Btn color="green" className="pulse" onClick={finish} data-testid="deco-done">
            {reDeco ? (
              <>
                <Emoji>✅</Emoji> できた
              </>
            ) : (
              <>
                <Emoji>✉️</Emoji> ふうとうへ
              </>
            )}
          </Btn>
        }
      />
      <div className="ld-body">
        <div className="ld-stage">
          <div className="ld-paper paper-frame" ref={paperRef} data-testid="deco-paper">
            <LetterPaper letter={letter} onStickerDown={pressPlaced} dragging={drag?.fromId ?? null} />
          </div>
        </div>
        <div className="ld-panel card">
          <div className="ld-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`ld-tab ${tab === t.id ? 'on' : ''}`}
                onClick={() => {
                  sfx.tap();
                  setTab(t.id);
                  void speak(t.say);
                }}
                data-testid={`deco-tab-${t.id}`}
              >
                <Emoji>{t.emoji}</Emoji>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="ld-content">
            {tab === 'paper' && (
              <>
                <div className="ld-papers">
                  {PAPERS.map((p) => (
                    <button
                      key={p.id}
                      className={`ld-thumb ${p.id === letter.paper ? 'on' : ''}`}
                      onClick={() => choosePaper(p)}
                      data-testid={`paper-${p.id}`}
                    >
                      <PaperThumb paper={p} letter={letter} />
                      <span className="ld-thumb-name">{p.name}</span>
                    </button>
                  ))}
                </div>
                <div className="ld-dir">
                  {[
                    { tate: false, label: 'よこがき', say: 'よこに かくよ。' },
                    { tate: true, label: 'たてがき', say: 'たてに かくよ。' },
                  ].map((d) => (
                    <button
                      key={d.label}
                      className={`ld-dir-btn ${letter.tate === d.tate ? 'on' : ''}`}
                      onClick={() => {
                        if (letter.tate === d.tate) return;
                        sfx.whoosh();
                        void speak(d.say);
                        set((l) => void (l.tate = d.tate));
                      }}
                      data-testid={d.tate ? 'dir-tate' : 'dir-yoko'}
                    >
                      <span className={`ld-dir-icon ${d.tate ? 'tate' : 'yoko'}`} aria-hidden>
                        <i />
                        <i />
                        <i />
                      </span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'pen' && (
              <>
                <div className="ld-inks">
                  {inks.map((i) => (
                    <button
                      key={i.id}
                      className={`ld-ink ${i.id === letter.color ? 'on' : ''}`}
                      style={{ ['--ink' as string]: i.id === 'niji' ? `linear-gradient(135deg, ${RAINBOW.join(', ')})` : i.color }}
                      onClick={() => {
                        sfx.tap();
                        void speak(i.name);
                        set((l) => void (l.color = i.id));
                      }}
                      data-testid={`ink-${i.id}`}
                      aria-label={i.name}
                    >
                      <span className="ld-crayon" />
                      <span className="ld-ink-name">{i.name}</span>
                    </button>
                  ))}
                </div>
                <div className="ld-pens">
                  {PENS.map((p) => (
                    <button
                      key={p.id}
                      className={`ld-pen ${p.id === letter.pen ? 'on' : ''}`}
                      onClick={() => {
                        sfx.tap();
                        void speak(p.name);
                        set((l) => void (l.pen = p.id));
                      }}
                      data-testid={`pen-${p.id}`}
                    >
                      <Emoji>{p.emoji}</Emoji>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === 'sticker' && (
              <div className="ld-stickers" data-testid="deco-tray">
                {tray.map((s) => (
                  <div
                    key={s}
                    className={`ld-sticker ${RARE.has(s) ? 'rare' : ''}`}
                    onPointerDown={(e) => pressTray(e, s)}
                    data-testid={`deco-sticker-${s}`}
                  >
                    <StickerFace s={s} faces={faces} />
                  </div>
                ))}
                <p className="ld-hint">タッチで はる・ひっぱって うごかす・そとへ だすと はがれる</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {drag && (
        <div className="ld-drag" style={{ left: drag.x, top: drag.y }}>
          <StickerFace s={drag.s} faces={faces} />
        </div>
      )}
    </div>
  );
}
