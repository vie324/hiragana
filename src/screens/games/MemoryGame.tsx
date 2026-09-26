import { useEffect, useMemo, useState } from 'react';
import Buddy from '../../components/Buddy';
import { Emoji, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import { sayKana } from '../../lib/kana';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt, celebrate } from '../../lib/confetti';
import { badAnswer, goodAnswer } from '../../lib/feedback';
import { useAlive } from '../../lib/hooks';
import { shuffle, pick } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, type RewardResult } from '../../state/actions';
import { wordsStartingWith, sayWord, type Word } from '../../data/words';
import { findNode, stageOfNode, kanaUpToStage } from '../../data/curriculum';
import { gameScript, knownPool, starsFromMistakes } from './pools';
import type { Script } from '../../lib/kana';
import { L } from '../../voice/lines';
import './games.css';

interface Card {
  id: number;
  pair: string;
  kind: 'kana' | 'pic';
  word?: Word;
}

function makeCards(nodeId: string | undefined, script: Script): Card[] {
  const node = findNode(nodeId);
  const stage = nodeId ? stageOfNode(nodeId) : undefined;
  let pool = (node?.kana ?? (stage ? kanaUpToStage(stage.id).slice(-10) : knownPool(script))).filter((k) => wordsStartingWith(k).length > 0);
  if (pool.length < 4) pool = [...new Set([...pool, ...knownPool(script).filter((k) => wordsStartingWith(k).length > 0)])];
  const pairs = shuffle(pool).slice(0, Math.min(6, pool.length >= 6 ? 6 : 4));
  let id = 0;
  const cards: Card[] = [];
  for (const k of pairs) {
    const w = pick(wordsStartingWith(k));
    cards.push({ id: id++, pair: k, kind: 'kana' });
    cards.push({ id: id++, pair: k, kind: 'pic', word: w });
  }
  return shuffle(cards);
}

export default function MemoryGame({ nodeId, script: scriptProp }: { nodeId?: string; script?: Script }) {
  const alive = useAlive();
  const cards = useMemo(() => makeCards(nodeId, gameScript(scriptProp, nodeId)), [nodeId, scriptProp]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const pairs = cards.length / 2;

  const prompt = () => speak('もじと、その おとから はじまる えを あわせてね。', { caption: 'もじ と え を あわせよう' });

  useEffect(() => {
    void prompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = async (c: Card, el: HTMLElement) => {
    if (busy || open.includes(c.id) || matched.has(c.pair)) return;
    sfx.tap();
    const now = [...open, c.id];
    setOpen(now);
    void speak(c.kind === 'kana' ? sayKana(c.pair) : sayWord(c.word!), { caption: c.kind === 'kana' ? c.pair : c.word!.w });
    if (now.length < 2) return;
    const [a, b] = now.map((id) => cards.find((x) => x.id === id)!);
    if (a.pair === b.pair && a.kind !== b.kind) {
      setBusy(true);
      await new Promise((r) => setTimeout(r, 500));
      if (!alive.current) return;
      sfx.correct();
      burstAt(el, 30);
      goodAnswer(el);
      recordAnswer(a.pair, true);
      const m = new Set(matched).add(a.pair);
      setMatched(m);
      setOpen([]);
      setMood('happy');
      const w = (a.word ?? b.word)!;
      await speak(L.memoryHit(w, a.pair), { caption: `${w.w} の「${a.pair}」` });
      if (!alive.current) return;
      setBusy(false);
      if (m.size >= pairs) {
        celebrate();
        setReward(completeActivity({ nodeId, stars: starsFromMistakes(mistakes, pairs * 2), kind: 'game' }));
      }
    } else {
      setBusy(true);
      badAnswer();
      setMistakes((x) => x + 1);
      setMood('think');
      await new Promise((r) => setTimeout(r, 1300));
      if (!alive.current) return;
      sfx.whoosh();
      setOpen([]);
      setBusy(false);
    }
  };

  const cols = pairs >= 6 ? 4 : 4;

  return (
    <div className="screen game-screen memory-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />} title={<Emoji>🃏</Emoji>} />
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(18vh, 14vw)" bubble="top" mood={mood} />
        </div>
      <div className="game-main">
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((c) => {
          const up = open.includes(c.id) || matched.has(c.pair);
          return (
            <button
              key={c.id}
              className={`mem-card ${up ? 'up' : ''} ${matched.has(c.pair) ? 'matched' : ''}`}
              onClick={(e) => void flip(c, e.currentTarget)}
              data-testid={`mem-${c.kind}-${c.pair}`}
            >
              <span className="mem-inner">
                <span className="mem-back">
                  <Emoji>⭐</Emoji>
                </span>
                <span className="mem-front">{c.kind === 'kana' ? <span className="mem-kana">{c.pair}</span> : <Emoji className="mem-pic">{c.word!.e}</Emoji>}</span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
