import { useEffect, useRef, useState } from 'react';
import { Emoji, TopBar } from '../components/ui';
import FaceBadge from '../components/FaceBadge';
import { STICKER_PAGES, RARE, type StickerPage } from '../data/stickers';
import { update, useApp, type Face, type PlacedSticker } from '../state/store';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './stickers.css';

interface Drag {
  s: string;
  /** はってある シールを うごかすとき */
  fromId?: string;
  x: number;
  y: number;
  pointerId: number;
}

function PageBackground({ page }: { page: StickerPage }) {
  return (
    <div className="sb-bg" style={{ background: `linear-gradient(180deg, ${page.sky[0]}, ${page.sky[1]})` }}>
      {page.id === 'night' && (
        <div className="sb-stars">
          {Array.from({ length: 30 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 60}%`, animationDelay: `${(i % 7) * 0.4}s` }} />
          ))}
        </div>
      )}
      {page.id === 'room' && <div className="sb-window" />}
      <div className="sb-ground" style={{ background: page.ground, height: `${page.groundHeight}%` }} />
    </div>
  );
}

/** シール 1まい (えもじ か かおしゃしん 'face:<id>') */
function StickerView({ s, faces }: { s: string; faces: Face[] }) {
  if (s.startsWith('face:')) {
    const f = faces.find((x) => x.id === s.slice(5));
    return f ? <FaceBadge img={f.img} size="1.1em" className="sb-face" /> : null;
  }
  return <span className="emoji">{s}</span>;
}

export default function StickerBook() {
  const stickers = useApp((s) => s.stickers);
  const placed = useApp((s) => s.placed);
  const faces = useApp((s) => s.faces);
  const [pageId, setPageId] = useState(STICKER_PAGES[0].id);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [bounce, setBounce] = useState<string | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const page = STICKER_PAGES.find((p) => p.id === pageId)!;
  const onPage = placed[pageId] ?? [];

  const usedCount = (s: string) => Object.values(placed).reduce((a, list) => a + list.filter((p) => p.s === s).length, 0);
  const owned = [
    // かおしゃしんの シールは なんまいでも はれる
    ...faces.map((f) => ({ s: `face:${f.id}`, left: Infinity })),
    ...Object.entries(stickers)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => ({ s, left: n - usedCount(s) }))
      .sort((a, b) => Number(RARE.has(b.s)) - Number(RARE.has(a.s))),
  ];
  const total = Object.values(stickers).reduce((a, b) => a + b, 0);

  useEffect(() => {
    void speak(total ? 'シールを うえに ひっぱって、すきな ところに はってね。タッチしても はれるよ。' : 'ゲームを すると シールが もらえるよ。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** シールを ばめんに はる (x, y は %) */
  const place = (sticker: string, x: number, y: number, fromId?: string) => {
    update((d) => {
      const list = (d.placed[pageId] ??= []);
      if (fromId) {
        const p = list.find((q) => q.id === fromId);
        if (p) {
          p.x = x;
          p.y = y;
          // いちばん うえに
          list.splice(list.indexOf(p), 1);
          list.push(p);
        }
      } else {
        const item: PlacedSticker = {
          id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          s: sticker,
          x,
          y,
          r: Math.round((Math.random() - 0.5) * 30),
          scale: 1,
        };
        list.push(item);
      }
    });
    sfx.sticker();
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId === drag.pointerId) setDrag(null);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const r = sceneRef.current?.getBoundingClientRect();
      const inside = r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (r && inside) {
        place(drag.s, ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100, drag.fromId);
      } else if (drag.fromId) {
        // そとに だしたら はがす
        update((d) => {
          d.placed[pageId] = (d.placed[pageId] ?? []).filter((q) => q.id !== drag.fromId);
        });
        sfx.whoosh();
      }
      setDrag(null);
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
  }, [drag, pageId]);

  /**
   * トレイの シール: よこに うごかすと スクロール、うえに うごかすと ドラッグ、
   * そのまま はなすと ばめんの どこかに ぽんと はる。
   */
  const pressTray = (e: React.PointerEvent, sticker: string) => {
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
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 0.5) {
        cleanup();
        sfx.tap();
        setDrag({ s: sticker, x: ev.clientX, y: ev.clientY, pointerId: id });
      } else if (Math.abs(dx) > 14) {
        cleanup(); // よこスクロール
      }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      cleanup();
      place(sticker, 15 + Math.random() * 70, 30 + Math.random() * 50);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cleanup);
  };

  const startDrag = (e: React.PointerEvent, s: string, fromId?: string) => {
    e.preventDefault();
    sfx.tap();
    setDrag({ s, fromId, x: e.clientX, y: e.clientY, pointerId: e.pointerId });
  };

  return (
    <div className="screen sticker-screen">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>⭐</Emoji> シール
          </>
        }
      >
        <div className="tabs">
          {STICKER_PAGES.map((p) => (
            <button key={p.id} className={`tab ${pageId === p.id ? 'on' : ''}`} onClick={() => setPageId(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
      </TopBar>
      <div className="sb-scene" ref={sceneRef} data-testid="sticker-scene">
        <PageBackground page={page} />
        {onPage.map((p) => (
          <div
            key={p.id}
            className={`sb-placed ${drag?.fromId === p.id ? 'lifting' : ''} ${bounce === p.id ? 'bounce' : ''} ${RARE.has(p.s) ? 'rare' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.r}deg) scale(${p.scale})` }}
            onPointerDown={(e) => startDrag(e, p.s, p.id)}
            onClick={() => {
              setBounce(p.id);
              setTimeout(() => setBounce(null), 500);
            }}
          >
            <StickerView s={p.s} faces={faces} />
          </div>
        ))}
        {!onPage.length && <div className="sb-hint">{owned.length ? 'したの シールを ここへ はってね' : 'ゲームで シールを あつめよう!'}</div>}
      </div>
      <div className="sb-tray" data-testid="sticker-tray">
        {owned.length === 0 && <div className="sb-empty">まだ シールが ないよ</div>}
        {owned.map(({ s, left }) => (
          <div
            key={s}
            className={`sb-item ${left <= 0 ? 'none' : ''} ${RARE.has(s) ? 'rare' : ''}`}
            onPointerDown={(e) => left > 0 && pressTray(e, s)}
            data-testid={`tray-${s}`}
          >
            <StickerView s={s} faces={faces} />
            {left > 1 && left !== Infinity && <b>{left}</b>}
          </div>
        ))}
      </div>
      {drag && (
        <div className="sb-drag" style={{ left: drag.x, top: drag.y }}>
          <StickerView s={drag.s} faces={faces} />
        </div>
      )}
    </div>
  );
}
