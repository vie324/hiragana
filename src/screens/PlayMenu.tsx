import { useEffect } from 'react';
import { Emoji, TopBar } from '../components/ui';
import Buddy from '../components/Buddy';
import { navigate, type Route } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './menus.css';

const GAMES: { id: string; emoji: string; label: string; say: string; color: string; route: Route }[] = [
  { id: 'balloon', emoji: '🎈', label: 'ふうせん わり', say: 'ふうせん わり', color: 'pink', route: { name: 'balloon' } },
  { id: 'firstsound', emoji: '👂', label: 'はじめの おと', say: 'はじめの おと', color: 'orange', route: { name: 'firstsound' } },
  { id: 'wordbuild', emoji: '🧩', label: 'ことばづくり', say: 'ことばづくり', color: 'blue', route: { name: 'wordbuild' } },
  { id: 'readquiz', emoji: '👀', label: 'よめるかな', say: 'よめるかな', color: 'green', route: { name: 'readquiz' } },
  { id: 'memory', emoji: '🃏', label: 'カードめくり', say: 'カードめくり', color: 'purple', route: { name: 'memory' } },
  { id: 'shiritori', emoji: '🔗', label: 'しりとり', say: 'しりとり', color: 'yellow', route: { name: 'shiritori' } },
];

export default function PlayMenu() {
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
      />
      <div className="menu-body">
        <div className="menu-buddy">
          <Buddy size="min(26vh, 20vw)" bubble="top" bubbleMax="min(28vw, 320px)" />
        </div>
        <div className="menu-grid">
          {GAMES.map((g) => (
            <button
              key={g.id}
              className={`btn ${g.color} menu-card`}
              onClick={() => {
                sfx.tap();
                void speak(g.say);
                navigate(g.route);
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
