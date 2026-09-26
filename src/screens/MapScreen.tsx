import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ALL_NODES, STAGES, nextNodeIndex, type MapNode } from '../data/curriculum';
import { useApp, getData } from '../state/store';
import { navigate, type Route } from '../state/router';
import { isNodeUnlocked, completeActivity, type RewardResult } from '../state/actions';
import { TopBar, Emoji, Stars, Btn } from '../components/ui';
import Mascot from '../components/Mascot';
import RewardModal from '../components/RewardModal';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { findSpecialLesson } from '../data/specialLessons';
import { findBook, fillTitle } from '../data/books';
import { callName } from '../state/store';
import './map.css';

const HEADER_H = 150;
const STEP_H = 124;
const PAD_BOTTOM = 50;

/** まえに マップを ひらいたときの いまの ばしょ (うごく アニメーション用) */
let lastCurrent = -1;

const KIND_ICON: Record<string, string> = {
  balloon: '🎈',
  firstsound: '👂',
  wordbuild: '🧩',
  readquiz: '👀',
  memory: '🃏',
  treasure: '🎁',
  book: '📖',
};

export function nodeRoute(n: MapNode): Route | null {
  switch (n.kind) {
    case 'lesson':
      return { name: 'lesson', kana: n.kana![0], nodeId: n.id };
    case 'special':
      return { name: 'special', lessonId: n.lessonId!, nodeId: n.id };
    case 'balloon':
      return { name: 'balloon', kana: n.kana, nodeId: n.id };
    case 'firstsound':
      return { name: 'firstsound', kana: n.kana, nodeId: n.id };
    case 'wordbuild':
      return { name: 'wordbuild', nodeId: n.id };
    case 'readquiz':
      return { name: 'readquiz', nodeId: n.id };
    case 'memory':
      return { name: 'memory', nodeId: n.id };
    case 'book':
      return { name: 'book', id: n.bookId!, nodeId: n.id };
    case 'treasure':
      return null;
  }
}

function nodeSay(n: MapNode, vars: { name: string; buddy: string }): string {
  switch (n.kind) {
    case 'lesson':
      return `「${n.kana![0]}」を おぼえよう!`;
    case 'special':
      return `${findSpecialLesson(n.lessonId!)?.title ?? ''}の おべんきょう!`;
    case 'balloon':
      return 'ふうせん わり!';
    case 'firstsound':
      return 'はじめの おと さがし!';
    case 'wordbuild':
      return 'ことばを つくろう!';
    case 'readquiz':
      return 'よめるかな?';
    case 'memory':
      return 'カード めくり!';
    case 'treasure':
      return 'たからばこ!';
    case 'book':
      return `えほん、${fillTitle(findBook(n.bookId!)?.title ?? '', vars)}!`;
  }
}

interface Layout {
  x: number;
  y: number;
}

export default function MapScreen({ focus }: { focus?: string }) {
  const nodes = useApp((s) => s.nodes);
  const unlockAll = useApp((s) => s.settings.unlockAll);
  const buddy = useApp((s) => s.profile.buddy);
  const wear = useApp((s) => s.wear);
  const profile = useApp((s) => s.profile);
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const [treasure, setTreasure] = useState<RewardResult | null>(null);
  const current = nextNodeIndex((id) => !!nodes[id]);
  const [buddyAt, setBuddyAt] = useState(lastCurrent >= 0 && lastCurrent < current ? lastCurrent : current);
  const vars = { name: callName(profile), buddy: profile.buddyName };

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // ノードの いち
  const { layout, sections, height } = useMemo(() => {
    const layout: Layout[] = [];
    const sections: { top: number; height: number }[] = [];
    let y = 0;
    let gi = 0;
    const amp = Math.min(width * 0.28, 300);
    for (const s of STAGES) {
      const top = y;
      y += HEADER_H;
      s.nodes.forEach(() => {
        layout.push({ x: width / 2 + Math.sin(gi * 0.85) * amp, y: y + STEP_H / 2 });
        y += STEP_H;
        gi++;
      });
      y += PAD_BOTTOM;
      sections.push({ top, height: y - top });
    }
    return { layout, sections, height: y };
  }, [width]);

  const pathD = useMemo(() => {
    if (!layout.length) return '';
    let d = `M${layout[0].x},${layout[0].y}`;
    for (let i = 1; i < layout.length; i++) {
      const a = layout[i - 1];
      const b = layout[i];
      const my = (a.y + b.y) / 2;
      d += ` C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
    }
    return d;
  }, [layout]);

  // いまの ばしょへ スクロール
  useEffect(() => {
    const el = scroller.current;
    if (!el || !layout.length) return;
    const target = focus ? ALL_NODES.findIndex((n) => n.id === focus) : buddyAt;
    const i = Math.max(0, Math.min(layout.length - 1, target >= 0 ? target : current));
    el.scrollTop = Math.max(0, layout[i].y - el.clientHeight * 0.45);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.length > 0, width]);

  // あいぼうが つぎの ばしょへ ぴょんと うごく
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (buddyAt !== current && current < ALL_NODES.length) {
      t = setTimeout(() => {
        sfx.hop();
        setBuddyAt(current);
        const el = scroller.current;
        if (el && layout[current]) el.scrollTo({ top: Math.max(0, layout[current].y - el.clientHeight * 0.45), behavior: 'smooth' });
        void speak('つぎは ここだよ!');
      }, 700);
    } else {
      const n = ALL_NODES[current];
      if (n) void speak(current === 0 ? 'ぼうけんの はじまり! ひかっている ところを タッチしてね。' : 'つぎは どこに いこうかな?');
      else void speak('ぜんぶ クリア! すごい!');
    }
    lastCurrent = current;
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapNode = (n: MapNode, i: number) => {
    const d = getData();
    if (!isNodeUnlocked(d, i)) {
      sfx.locked();
      setWiggle(n.id);
      setTimeout(() => setWiggle(null), 600);
      void speak('まだ いけないよ。じゅんばんに すすもうね。');
      return;
    }
    sfx.tap();
    if (n.kind === 'treasure') {
      sfx.open();
      setTreasure(completeActivity({ nodeId: n.id, stars: 3 }));
      return;
    }
    void speak(nodeSay(n, vars));
    const r = nodeRoute(n);
    if (r) navigate(r);
  };

  const buddyPos = layout[Math.min(buddyAt, layout.length - 1)];

  return (
    <div className="screen map-screen">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>🗺️</Emoji> ぼうけん
          </>
        }
        right={
          <Btn
            round
            size={72}
            color="white"
            aria-label="いまの ばしょ"
            onClick={() => {
              const el = scroller.current;
              if (el && layout[current]) el.scrollTo({ top: layout[current].y - el.clientHeight * 0.45, behavior: 'smooth' });
            }}
          >
            <Emoji>📍</Emoji>
          </Btn>
        }
      />
      <div className="map-scroll" ref={scroller} data-testid="map-scroll">
        <div className="map-content" style={{ height }}>
          {STAGES.map((s, si) => (
            <section
              key={s.id}
              className="map-land"
              style={{ top: sections[si].top, height: sections[si].height, background: `linear-gradient(180deg, ${s.land.sky[0]}, ${s.land.sky[1]})` }}
            >
              <div className="land-ground" style={{ background: s.land.ground }} />
              <div className="land-sign">
                <span className="emoji">{s.land.deco[0]}</span>
                <span className="land-name">{s.land.name}</span>
                {s.kana.length > 0 && s.kana.length <= 5 && <span className="land-kana">{s.kana.join(' ')}</span>}
              </div>
              {s.land.deco.map((e, di) => (
                <span
                  key={di}
                  className="emoji land-deco"
                  style={{
                    top: HEADER_H + ((di * 173) % Math.max(1, sections[si].height - HEADER_H - 60)),
                    left: di % 2 === 0 ? `${4 + (di * 7) % 10}%` : undefined,
                    right: di % 2 === 1 ? `${4 + (di * 5) % 10}%` : undefined,
                    animationDelay: `${di * 0.7}s`,
                  }}
                >
                  {e}
                </span>
              ))}
            </section>
          ))}
          <svg className="map-path" width={width} height={height} aria-hidden>
            <path d={pathD} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="22" strokeLinecap="round" />
            <path d={pathD} fill="none" stroke="#f3d9b5" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 22" />
          </svg>
          {ALL_NODES.map((n, i) => {
            const pos = layout[i];
            if (!pos) return null;
            const rec = nodes[n.id];
            const unlocked = unlockAll || i <= current || !!rec;
            const isCurrent = i === current;
            return (
              <button
                key={n.id}
                className={`map-node kind-${n.kind} ${rec ? 'done' : ''} ${isCurrent ? 'current' : ''} ${unlocked ? '' : 'locked'} ${wiggle === n.id ? 'wiggle' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onClick={() => tapNode(n, i)}
                data-testid={`node-${n.id}`}
                aria-label={n.id}
              >
                <span className="node-face">
                  {n.kind === 'lesson' ? (
                    <span className="node-kana">{n.kana![0]}</span>
                  ) : n.kind === 'special' ? (
                    <span className="node-kana special">{findSpecialLesson(n.lessonId!)?.icon}</span>
                  ) : (
                    <Emoji className="node-emoji">{n.kind === 'treasure' && rec ? '👑' : KIND_ICON[n.kind]}</Emoji>
                  )}
                  {!unlocked && <Emoji className="node-lock">🔒</Emoji>}
                </span>
                {rec && (
                  <span className="node-stars">
                    <Stars n={rec.stars} size={20} />
                  </span>
                )}
              </button>
            );
          })}
          {buddyPos && (
            <div className="map-buddy" style={{ transform: `translate(${buddyPos.x - 118}px, ${buddyPos.y - 92}px)` }}>
              <Mascot kind={buddy} outfit={wear} size={84} talking={false} mood={buddyAt === current ? 'normal' : 'happy'} />
            </div>
          )}
        </div>
      </div>
      {treasure && <RewardModal result={treasure} headline="たからばこ ゲット!" onClose={() => setTreasure(null)} />}
    </div>
  );
}
