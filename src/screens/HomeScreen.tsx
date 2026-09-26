import { useEffect } from 'react';
import Buddy from '../components/Buddy';
import { Emoji } from '../components/ui';
import { navigate, type Route } from '../state/router';
import { useApp, todayKey, callName } from '../state/store';
import { speak } from '../lib/speech';
import { speakAfterCurrent } from '../lib/session';
import { sfx } from '../lib/sound';
import { ALL_NODES, nextNodeIndex, type MapNode } from '../data/curriculum';
import { findSpecialLesson } from '../data/specialLessons';
import './home.css';

interface MenuItem {
  id: string;
  emoji: string;
  label: string;
  say: string;
  color: string;
  route: Route;
  wide?: boolean;
}

const MENU: MenuItem[] = [
  { id: 'map', emoji: '🗺️', label: 'ぼうけん', say: 'ぼうけん', color: 'orange', route: { name: 'map' }, wide: true },
  { id: 'write', emoji: '✏️', label: 'かく', say: 'もじを かこう', color: 'blue', route: { name: 'write' } },
  { id: 'play', emoji: '🎈', label: 'あそぶ', say: 'ゲームで あそぼう', color: 'pink', route: { name: 'play' } },
  { id: 'books', emoji: '📚', label: 'えほん', say: 'えほんを よもう', color: 'green', route: { name: 'books' } },
  { id: 'chart', emoji: '🔤', label: 'あいうえお', say: 'あいうえお ひょう', color: 'purple', route: { name: 'chart' } },
  { id: 'stickers', emoji: '⭐', label: 'シール', say: 'シールちょう', color: 'yellow', route: { name: 'stickers' } },
  { id: 'dressup', emoji: '🎀', label: 'きせかえ', say: 'きせかえ', color: 'pink', route: { name: 'dressup' } },
];

const WEEK = ['に', 'げ', 'か', 'す', 'も', 'き', 'ど'];

const NODE_EMOJI: Record<string, string> = {
  balloon: '🎈',
  firstsound: '👂',
  wordbuild: '🧩',
  readquiz: '👀',
  memory: '🃏',
  treasure: '🎁',
  book: '📖',
};

/** 「つぎは 〇」 に だす もの */
function nodeBadge(n: MapNode): { text: string; emoji: boolean } {
  if (n.kind === 'lesson' && n.kana) return { text: n.kana[0], emoji: false };
  if (n.kind === 'special') return { text: findSpecialLesson(n.lessonId!)?.icon ?? '?', emoji: false };
  return { text: NODE_EMOJI[n.kind] ?? '⭐', emoji: true };
}

function weekDays(): { key: string; label: string; today: boolean }[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { key: todayKey(d), label: WEEK[i], today: todayKey(d) === todayKey(now) };
  });
}

export default function HomeScreen() {
  const profile = useApp((s) => s.profile);
  const days = useApp((s) => s.days);
  const nodes = useApp((s) => s.nodes);
  const next = ALL_NODES[nextNodeIndex((id) => !!nodes[id])];

  useEffect(() => {
    const first = !days[todayKey()]?.acts;
    void speakAfterCurrent(first ? `きょうは なにして あそぶ?` : `${callName(profile)}、つぎは なにに する?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (m: MenuItem) => {
    sfx.tap();
    void speak(m.say);
    navigate(m.route);
  };

  const nextLabel = next ? nodeBadge(next) : null;

  return (
    <div className="screen home-screen">
      <button className="home-parent" onClick={() => navigate({ name: 'parent' })} aria-label="おうちの方へ">
        <span className="emoji">⚙️</span>
      </button>
      <div className="home-left">
        <Buddy size="min(38vh, 34vw, 330px)" bubble="top" wave bubbleMax="min(40vw, 460px)" />
        <button className="week card" onClick={() => navigate({ name: 'stamps' })} aria-label="スタンプ">
          {weekDays().map((d) => (
            <div key={d.key} className={`day ${d.today ? 'today' : ''}`}>
              <span className="label">{d.label}</span>
              <span className="stamp">{days[d.key]?.stamp ? <Emoji>💮</Emoji> : null}</span>
            </div>
          ))}
        </button>
      </div>
      <div className="home-menu">
        {MENU.map((m) => (
          <button
            key={m.id}
            className={`menu-tile btn ${m.color} ${m.wide ? 'wide' : ''}`}
            onClick={() => open(m)}
            data-testid={`menu-${m.id}`}
          >
            <Emoji className="menu-emoji">{m.emoji}</Emoji>
            <span className="menu-label">{m.label}</span>
            {m.wide && nextLabel && (
              <span className="menu-next">
                つぎは {nextLabel.emoji ? <Emoji>{nextLabel.text}</Emoji> : <b>{nextLabel.text}</b>}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
