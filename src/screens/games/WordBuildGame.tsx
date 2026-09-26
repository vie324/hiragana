import { useEffect, useMemo, useRef, useState } from 'react';
import Buddy from '../../components/Buddy';
import { Emoji, ProgressDots, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import { isOfScript, sayKana, splitUnits } from '../../lib/kana';
import { speak, speakSequence, wait } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt, celebrate } from '../../lib/confetti';
import { badAnswer, goodAnswer } from '../../lib/feedback';
import { useAlive, useIdle } from '../../lib/hooks';
import { shuffle } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, recordWord, type RewardResult } from '../../state/actions';
import { sayWord, type Word } from '../../data/words';
import { distractors, gameScript, pickWords, starsFromMistakes, wordKanaSet } from './pools';
import type { Script } from '../../lib/kana';
import { L } from '../../voice/lines';
import './games.css';

const ROUNDS = 4;

interface Tile {
  id: number;
  unit: string;
  used: boolean;
}

function makeTiles(word: Word, pool: string[]): Tile[] {
  const units = splitUnits(word.w);
  const extra = distractors(units[0], Math.max(2, 5 - units.length), pool).filter((k) => !units.includes(k)).slice(0, Math.max(2, 5 - units.length));
  return shuffle([...units, ...extra]).map((unit, id) => ({ id, unit, used: false }));
}

export default function WordBuildGame({ nodeId, script: scriptProp }: { nodeId?: string; script?: Script }) {
  const alive = useAlive();
  const script = useMemo(() => gameScript(scriptProp, nodeId), [scriptProp, nodeId]);
  const words = useMemo(() => pickWords(nodeId, ROUNDS, { maxUnits: 4, minUnits: 2 }, script), [nodeId, script]);
  const pool = useMemo(() => [...wordKanaSet(nodeId, script)].filter((k) => isOfScript(k, script)), [nodeId, script]);
  const [round, setRound] = useState(0);
  const word = words[round];
  const units = useMemo(() => (word ? splitUnits(word.w) : []), [word]);
  const [tiles, setTiles] = useState<Tile[]>(() => (word ? makeTiles(word, pool) : []));
  const [filled, setFilled] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [lit, setLit] = useState(-1);
  const [mistakes, setMistakes] = useState(0);
  const [roundMiss, setRoundMiss] = useState(0);
  const [done, setDone] = useState(false);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const picRef = useRef<HTMLButtonElement>(null);

  // ふきだしに こたえが でないように する
  const prompt = () => (word ? speak(L.buildAsk(word), { caption: 'ことばを つくろう!' }) : Promise.resolve(true));

  useEffect(() => {
    if (!word) return;
    setTiles(makeTiles(word, pool));
    setFilled([]);
    setDone(false);
    setRoundMiss(0);
    setLit(-1);
    setMood('normal');
    void prompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useIdle(10000, () => {
    if (!word || done) return;
    const next = units[filled.length];
    void speak(L.buildNext(next));
  }, [round, filled.length], !done && !reward);

  if (!word) return null;

  const tapTile = async (t: Tile, el: HTMLElement) => {
    if (done || t.used) return;
    const need = units[filled.length];
    if (t.unit === need) {
      sfx.sticker();
      burstAt(el, 14);
      const nf = [...filled, t.unit];
      setFilled(nf);
      setTiles((ts) => ts.map((x) => (x.id === t.id ? { ...x, used: true } : x)));
      if (nf.length >= units.length) {
        setDone(true);
        goodAnswer(el);
        setMood('happy');
        recordWord(word.w, roundMiss === 0);
        units.forEach((u) => [...u].forEach((c) => recordAnswer(c, roundMiss === 0)));
        await wait(250);
        if (!alive.current) return;
        await speakSequence(units.map(sayKana), { gapMs: 60, onPart: (i) => alive.current && setLit(i) });
        if (!alive.current) return;
        setLit(99);
        celebrate();
        sfx.correct();
        await speak(L.buildDone(word), { caption: `${word.w}! できたね!` });
        await wait(300);
        if (!alive.current) return;
        if (round + 1 >= words.length) setReward(completeActivity({ nodeId, stars: starsFromMistakes(mistakes, words.length * 2), kind: 'game' }));
        else setRound((r) => r + 1);
      } else {
        void speak(sayKana(t.unit));
      }
    } else {
      sfx.wrong();
      badAnswer();
      setWrongId(t.id);
      setTimeout(() => setWrongId(null), 600);
      setMistakes((m) => m + 1);
      setRoundMiss((m) => m + 1);
      setMood('think');
      await speak(L.buildMiss(t.unit, filled.length === 0));
    }
  };

  const hintUnit = roundMiss >= 2 ? units[filled.length] : null;

  return (
    <div className="screen game-screen wordbuild-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />}>
        <div className="center">
          <ProgressDots total={words.length} current={round} />
        </div>
      </TopBar>
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(18vh, 15vw)" bubble="top" mood={mood} />
        </div>
      <div className="game-main wb-body" key={round} data-word={word.w} data-units={JSON.stringify(units)}>
        <button
          ref={picRef}
          className={`wb-pic pop-in ${done ? 'done' : ''}`}
          onClick={() => void speakSequence(units.map(sayKana), { gapMs: 250 }).then((ok) => ok && speak(sayWord(word), { caption: null }))}
          aria-label="え"
        >
          <Emoji>{word.e}</Emoji>
        </button>
        <div className="wb-right">
          <div className="wb-slots">
            {units.map((u, i) => (
              <div key={i} className={`wb-slot ${i < filled.length ? 'filled' : ''} ${i === filled.length && !done ? 'next' : ''} ${lit === i || lit === 99 ? 'lit' : ''}`}>
                {i < filled.length ? <span className="pop-in">{u}</span> : null}
              </div>
            ))}
          </div>
          <div className="wb-tiles">
            {tiles.map((t) => (
              <button
                key={t.id}
                className={`wb-tile ${t.used ? 'used' : ''} ${wrongId === t.id ? 'wiggle wrong' : ''} ${hintUnit === t.unit && !t.used ? 'hint' : ''}`}
                onClick={(e) => void tapTile(t, e.currentTarget)}
                disabled={t.used || done}
                data-testid={`tile-${t.unit}`}
              >
                {t.unit}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
