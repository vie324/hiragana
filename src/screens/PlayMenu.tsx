import { useEffect } from 'react';
import { Emoji, TopBar } from '../components/ui';
import Buddy from '../components/Buddy';
import { navigate, type Route } from '../state/router';
import { currentScript, useScript } from '../state/store';
import ScriptSwitch from '../components/ScriptSwitch';
import type { Script } from '../lib/kana';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './menus.css';

const GAMES: { id: string; emoji: string; label: string; say: string; color: string; route: (s: Script) => Route; hiraOnly?: boolean }[] = [
  { id: 'balloon', emoji: '🎈', label: 'ふうせん わり', say: 'ふうせん わり', color: 'pink', route: (script) => ({ name: 'balloon', script }) },
  { id: 'firstsound', emoji: '👂', label: 'はじめの おと', say: 'はじめの おと', color: 'orange', route: (script) => ({ name: 'firstsound', script }) },
  { id: 'wordbuild', emoji: '🧩', label: 'ことばづくり', say: 'ことばづくり', color: 'blue', route: (script) => ({ name: 'wordbuild', script }) },
  { id: 'readquiz', emoji: '👀', label: 'よめるかな', say: 'よめるかな', color: 'green', route: (script) => ({ name: 'readquiz', script }) },
  { id: 'memory', emoji: '🃏', label: 'カードめくり', say: 'カードめくり', color: 'purple', route: (script) => ({ name: 'memory', script }) },
  { id: 'shiritori', emoji: '🔗', label: 'しりとり', say: 'しりとり', color: 'yellow', route: () => ({ name: 'shiritori' }), hiraOnly: true },
];

export default function PlayMenu() {
  const script = useScript();
  useEffect(() => {
    void speak('どの ゲームで あそぶ?');
  }, []);
  return (
    <div className="screen menu-screen play-menu">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>🎈</Emoji> あそぶ
          </>
        }
      >
        <div className="tabs">
          <ScriptSwitch />
        </div>
      </TopBar>
      <div className="menu-body">
        <div className="menu-buddy">
          <Buddy size="min(26vh, 20vw)" bubble="top" bubbleMax="min(28vw, 320px)" />
        </div>
        <div className="menu-grid">
          {GAMES.filter((g) => !(g.hiraOnly && script === 'kata')).map((g) => (
            <button
              key={g.id}
              className={`btn ${g.color} menu-card`}
              onClick={() => {
                sfx.tap();
                void speak(g.say);
                navigate(g.route(currentScript()));
              }}
              data-testid={`game-${g.id}`}
            >
              <Emoji className="menu-card-emoji">{g.emoji}</Emoji>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
