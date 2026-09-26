import { useEffect, useMemo, useState } from 'react';
import Buddy from '../components/Buddy';
import { Emoji } from '../components/ui';
import SkyScene, { dayPhase } from '../components/SkyScene';
import LetterTree from '../components/LetterTree';
import ScriptSwitch from '../components/ScriptSwitch';
import { LevelBadge, StreakChip } from '../components/LevelBadge';
import MissionCard, { ChestOverlay } from '../components/MissionCard';
import { navigate, type Route } from '../state/router';
import { useApp, todayKey, callName, getData, useScript } from '../state/store';
import { knownKana, markMissionsSeen, type ChestResult } from '../state/actions';
import { chestReady, unseenMissions } from '../state/progress';
import { speak } from '../lib/speech';
import { speakAfterCurrent } from '../lib/session';
import { sfx } from '../lib/sound';
import { DAKUON, HANDAKUON, K_DAKUON, K_HANDAKUON, seionOf } from '../lib/kana';
import { nodesOf, nextNodeIndex, stageOfNode, type MapNode } from '../data/curriculum';
import { findSpecialLesson } from '../data/specialLessons';
import type { Mission } from '../data/missions';
import { L } from '../voice/lines';
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

function menu(kata: boolean): MenuItem[] {
  return [
    { id: 'map', emoji: '🗺️', label: 'ぼうけん', say: 'ぼうけん', color: 'orange', route: { name: 'map' }, wide: true },
    { id: 'write', emoji: '✏️', label: 'かく', say: 'もじを かこう', color: 'blue', route: { name: 'write' } },
    { id: 'play', emoji: '🎈', label: 'あそぶ', say: 'ゲームで あそぼう', color: 'pink', route: { name: 'play' } },
    { id: 'books', emoji: '📚', label: 'えほん', say: 'えほんを よもう', color: 'green', route: { name: 'books' } },
    kata
      ? { id: 'chart', emoji: '🔤', label: 'アイウエオ', say: 'アイウエオ ひょう', color: 'purple', route: { name: 'chart' } }
      : { id: 'chart', emoji: '🔤', label: 'あいうえお', say: 'あいうえお ひょう', color: 'purple', route: { name: 'chart' } },
    { id: 'stickers', emoji: '⭐', label: 'シール', say: 'シールちょう', color: 'yellow', route: { name: 'stickers' } },
    { id: 'dressup', emoji: '🎀', label: 'きせかえ', say: 'きせかえ', color: 'coral', route: { name: 'dressup' } },
  ];
}

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

/** ホームで さいしょに いう こと (ミッション > たからばこ > あいさつ) */
function homeLine(name: string): { text: string; sparkle: boolean } {
  const d = getData();
  const unseen = unseenMissions(d.days);
  if (unseen.length) {
    markMissionsSeen(unseen);
    return chestReady(getData().days)
      ? { text: 'ミッション ぜんぶ クリア! たからばこを あけてね!', sparkle: true }
      : { text: 'ミッション クリア! すごいね!', sparkle: true };
  }
  if (chestReady(d.days)) return { text: 'たからばこを あけてね!', sparkle: false };
  if (!d.days[todayKey()]?.acts) return { text: 'きょうの ミッションは 3つ! いっしょに がんばろう!', sparkle: false };
  return { text: L.homeNext(name), sparkle: false };
}

export default function HomeScreen() {
  const profile = useApp((s) => s.profile);
  const nodes = useApp((s) => s.nodes);
  const kana = useApp((s) => s.kana);
  const treeSeen = useApp((s) => s.treeSeen);
  const script = useScript();
  const phase = useMemo(() => dayPhase(), []);
  const [hint, setHint] = useState<Mission['menu'] | null>(null);
  const [chest, setChest] = useState<ChestResult | null>(null);

  const list = nodesOf(script);
  const next: MapNode | undefined = list[nextNodeIndex((id) => !!nodes[id], script)];
  const stage = next ? stageOfNode(next.id) : undefined;
  const stageDone = stage ? stage.nodes.filter((n) => nodes[n.id]).length : 0;
  const nextLabel = next ? nodeBadge(next) : null;

  const known = useMemo(() => knownKana(getData()), [kana]);
  const treeKana = useMemo(
    () => [...seionOf(script), ...(script === 'kata' ? [...K_DAKUON, ...K_HANDAKUON] : [...DAKUON, ...HANDAKUON])],
    [script],
  );
  const newFruit = treeKana.some((k) => known.has(k) && !treeSeen.includes(k));

  useEffect(() => {
    let here = true;
    const line = homeLine(callName(profile));
    if (line.sparkle) setTimeout(() => here && sfx.sparkle(), 300);
    void speakAfterCurrent(line.text, undefined, 6000, () => here);
    return () => {
      here = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 3600);
    return () => clearTimeout(t);
  }, [hint]);

  const open = (m: MenuItem) => {
    sfx.tap();
    void speak(m.say);
    navigate(m.route);
  };

  return (
    <div className={`screen home-screen phase-${phase}`}>
      <SkyScene phase={phase} balloons />
      <div className="home-top">
        <LevelBadge />
        <div className="home-top-mid">
          <ScriptSwitch />
        </div>
        <StreakChip />
        <button className="home-parent" onClick={() => navigate({ name: 'parent' })} aria-label="おうちの方へ">
          <span className="emoji">⚙️</span>
        </button>
      </div>
      <div className="home-body">
        <div className="home-left">
          <div className="home-stage">
            <button
              type="button"
              className="home-tree"
              onClick={() => {
                sfx.tap();
                void speak('もじの き');
                navigate({ name: 'tree' });
              }}
              aria-label="もじの き"
              data-testid="home-tree"
            >
              <LetterTree script={script} known={known} mini />
              <span className="tree-sign">もじの き</span>
              {newFruit && (
                <span className="tree-new" aria-hidden>
                  <Emoji>✨</Emoji>
                </span>
              )}
            </button>
            <div className="home-buddy">
              <Buddy size="min(30vh, 22vw, 280px)" bubble="top" wave bubbleMax="min(34vw, 400px)" />
            </div>
          </div>
          <MissionCard onHint={setHint} onChest={setChest} />
        </div>
        <div className="home-menu">
          {menu(script === 'kata').map((m, i) => (
            <button
              key={m.id}
              className={`menu-tile btn ${m.color} ${m.wide ? 'wide' : ''} ${hint === m.id ? 'hint' : ''}`}
              style={{ ['--i' as string]: i }}
              onClick={() => open(m)}
              data-testid={`menu-${m.id}`}
            >
              <Emoji className="menu-emoji">{m.emoji}</Emoji>
              {m.wide ? (
                <span className="menu-main">
                  <span className="menu-label">{m.label}</span>
                  {stage && (
                    <span className="menu-stage" aria-hidden>
                      <Emoji>{stage.land.deco[0]}</Emoji>
                      <span className="menu-stage-name">{stage.land.name}</span>
                      <span className="menu-stage-bar">
                        <i style={{ width: `${(stageDone / stage.nodes.length) * 100}%` }} />
                      </span>
                    </span>
                  )}
                </span>
              ) : (
                <span className="menu-label">{m.label}</span>
              )}
              {m.wide && (
                <span className="menu-next">
                  {nextLabel ? (
                    <>
                      つぎは {nextLabel.emoji ? <Emoji>{nextLabel.text}</Emoji> : <b>{nextLabel.text}</b>}
                    </>
                  ) : (
                    <>
                      ぜんぶ クリア! <Emoji>🎉</Emoji>
                    </>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {chest && <ChestOverlay result={chest} onClose={() => setChest(null)} />}
    </div>
  );
}
