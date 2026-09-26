/** もじの き: おぼえた もじが み (はな) に なる。まいにち みずを あげられる */
import { useEffect, useMemo, useRef, useState } from 'react';
import Buddy from '../components/Buddy';
import LetterTree, { TREE_TOTAL } from '../components/LetterTree';
import ScriptSwitch from '../components/ScriptSwitch';
import SkyScene from '../components/SkyScene';
import { Emoji, TopBar } from '../components/ui';
import { getData, todayKey, useApp, useScript } from '../state/store';
import { knownKana, markTreeSeen, waterTree } from '../state/actions';
import { DAKUON, HANDAKUON, K_DAKUON, K_HANDAKUON, sayKana, seionOf, type Script } from '../lib/kana';
import { exampleSentence } from '../data/kanaInfo';
import { masteryStars } from '../lib/srs';
import { speak, wait } from '../lib/speech';
import { speakAfterCurrent } from '../lib/session';
import { sfx } from '../lib/sound';
import { burstAt } from '../lib/confetti';
import { useAlive } from '../lib/hooks';
import './tree-screen.css';

/** ぜんぶ みが なった ときの きらきらの ばしょ (%) */
const SPARKLES: [number, number][] = [
  [28, 12],
  [70, 8],
  [20, 40],
  [78, 44],
  [50, 2],
];

const flowersOf = (script: Script) => (script === 'kata' ? [...K_DAKUON, ...K_HANDAKUON] : [...DAKUON, ...HANDAKUON]);

export function WateringCan() {
  return (
    <svg viewBox="0 0 110 84" className="watering-can" aria-hidden>
      <path d="M30 26 C30 6 66 6 66 26" className="can-handle" />
      <path d="M72 46 L98 24 L104 30 L80 56 Z" className="can-spout" />
      <ellipse cx="102" cy="26" rx="6" ry="9" transform="rotate(45 102 26)" className="can-rose" />
      <path d="M22 28 H70 A8 8 0 0 1 78 36 V68 A10 10 0 0 1 68 78 H24 A10 10 0 0 1 14 68 V36 A8 8 0 0 1 22 28 Z" className="can-body" />
      <rect x="14" y="44" width="64" height="8" className="can-stripe" />
    </svg>
  );
}

export default function TreeScreen() {
  const script = useScript();
  const kana = useApp((s) => s.kana);
  const watered = useApp((s) => !!s.days[todayKey()]?.water);
  const known = useMemo(() => knownKana(getData()), [kana]);
  const gold = useMemo(() => new Set(Object.keys(kana).filter((k) => masteryStars(kana[k]) === 3)), [kana]);
  const seion = seionOf(script);
  const flowers = flowersOf(script);
  const fruitCount = seion.filter((k) => known.has(k)).length;
  const flowerCount = flowers.filter((k) => known.has(k)).length;
  // この 画面を ひらいた ときに はじめて みる み・はな
  const fresh = useMemo(() => {
    const seen = new Set(getData().treeSeen);
    return new Set([...seion, ...flowers].filter((k) => known.has(k) && !seen.has(k)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);
  const [pouring, setPouring] = useState(false);
  const [bounce, setBounce] = useState(0);
  const [mood, setMood] = useState<'normal' | 'happy'>('normal');
  const treeRef = useRef<HTMLDivElement>(null);
  const alive = useAlive();

  useEffect(() => {
    let here = true;
    if (fresh.size) {
      markTreeSeen([...fresh]);
      setMood('happy');
      setTimeout(() => here && sfx.sparkle(), 400);
      void speakAfterCurrent('あたらしい みが なったよ!', undefined, 5000, () => here);
    } else if (!getData().days[todayKey()]?.water) {
      void speakAfterCurrent('もじを おぼえると、みが なるよ。おみずも あげてね!', undefined, 5000, () => here);
    } else {
      void speakAfterCurrent('もじを おぼえると、みが なるよ。', undefined, 5000, () => here);
    }
    return () => {
      here = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const onTapKana = (k: string, ok: boolean) => {
    if (!ok) {
      sfx.locked();
      void speak('まだ ならって いないよ。ぼうけんで ならおう!');
      return;
    }
    sfx.tap();
    const ex = exampleSentence(k);
    void speak(ex ? ex.say : sayKana(k), { caption: ex ? ex.text : k });
  };

  const water = async () => {
    if (pouring) return;
    if (watered) {
      sfx.tap();
      void speak('きょうは もう おみずを あげたよ。また あした あげてね!');
      return;
    }
    if (!waterTree()) return;
    setPouring(true);
    sfx.water();
    await wait(1500);
    if (!alive.current) return;
    setBounce((b) => b + 1);
    setMood('happy');
    sfx.sparkle();
    burstAt(treeRef.current, 40);
    await speak('おみず ありがとう! ぐんぐん そだってね!');
    if (alive.current) setPouring(false);
  };

  return (
    <div className="screen tree-screen">
      <SkyScene />
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>🌳</Emoji> もじの き
          </>
        }
      >
        <div className="center">
          <ScriptSwitch />
        </div>
      </TopBar>
      <div className="tree-body">
        <div className={`tree-area ${pouring ? 'pouring' : ''}`} ref={treeRef}>
          <LetterTree script={script} known={known} gold={gold} fresh={fresh} onTapKana={onTapKana} bounce={bounce} key={script} />
          {fruitCount >= TREE_TOTAL.fruits &&
            SPARKLES.map(([x, y], i) => (
              <span key={i} className="tree-sparkle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }} aria-hidden>
                ✦
              </span>
            ))}
          {pouring && (
            <div className="pour" aria-hidden>
              <WateringCan />
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} className="drop" style={{ left: `${2 + (i % 4) * 6}%`, animationDelay: `${0.5 + i * 0.08}s` }} />
              ))}
            </div>
          )}
        </div>
        <div className="tree-panel">
          <div className="tree-count card" data-testid="tree-count">
            <div className="tree-count-row">
              <span className={`tree-dot fruit-${script}`} aria-hidden />
              <b>{fruitCount}</b>
              <small>/ {TREE_TOTAL.fruits}</small>
            </div>
            <div className="tree-bar" aria-hidden>
              <i className={`fill-${script}`} style={{ width: `${(fruitCount / TREE_TOTAL.fruits) * 100}%` }} />
            </div>
            <div className="tree-count-row small">
              <Emoji>🌸</Emoji>
              <b>{flowerCount}</b>
              <small>/ {TREE_TOTAL.flowers}</small>
            </div>
          </div>
          <button
            type="button"
            className={`water-btn ${watered ? 'done' : 'ready'}`}
            onClick={() => void water()}
            data-testid="water"
            data-watered={watered ? 'yes' : undefined}
            aria-label="おみずを あげる"
          >
            <WateringCan />
            <span className="water-label">{watered ? 'あげたよ' : 'おみず'}</span>
            {watered && <span className="water-check">✓</span>}
          </button>
          <div className="tree-buddy">
            <Buddy size="min(20vh, 16vw)" bubble="top" mood={mood} bubbleMax="min(28vw, 320px)" />
          </div>
        </div>
      </div>
    </div>
  );
}
