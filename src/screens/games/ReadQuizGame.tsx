import { useEffect, useMemo, useState } from 'react';
import Buddy from '../../components/Buddy';
import { ProgressDots, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import PicChoices from '../../components/PicChoices';
import { sayKana, splitUnits } from '../../lib/kana';
import { speak, speakSequence, wait } from '../../lib/speech';
import { celebrate } from '../../lib/confetti';
import { useAlive, useIdle } from '../../lib/hooks';
import { shuffle, sample } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, recordWord, type RewardResult } from '../../state/actions';
import { WORDS, type Word } from '../../data/words';
import { pickWords, starsFromMistakes } from './pools';
import { L } from '../../voice/lines';
import './games.css';

const ROUNDS = 5;

export default function ReadQuizGame({ nodeId }: { nodeId?: string }) {
  const alive = useAlive();
  const words = useMemo(() => pickWords(nodeId, ROUNDS, { maxUnits: 5 }), [nodeId]);
  const [round, setRound] = useState(0);
  const word = words[round];
  const choices = useMemo(() => {
    if (!word) return [];
    const others = sample(
      WORDS.filter((w) => w.w !== word.w && w.cat !== 'color' && w.cat !== 'shape'),
      2,
    );
    return shuffle([word, ...others]);
  }, [word]);
  const units = useMemo(() => (word ? splitUnits(word.w) : []), [word]);
  const [lit, setLit] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [roundMiss, setRoundMiss] = useState(0);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);

  const prompt = () => speak('なんて かいて あるかな? よめたら、えを えらんでね。', { caption: 'よめたら えを えらんでね' });

  useEffect(() => {
    setRoundMiss(0);
    setMood('normal');
    setLit(null);
    if (round === 0) void prompt();
    else void speak('つぎは これ。なんて かいて あるかな?', { caption: 'なんて かいて あるかな?' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // こまっていたら 1もじずつ よんで ヒント
  useIdle(12000, () => {
    void speakSequence(units.map(sayKana), { gapMs: 400, onPart: (i) => setLit(i) }).then(() => setLit(null));
  }, [round], !reward);

  if (!word) return null;

  const correct = async () => {
    recordWord(word.w, roundMiss === 0);
    [...word.w].forEach((c) => recordAnswer(c, roundMiss === 0));
    setMood('happy');
    await speakSequence(units.map(sayKana), { gapMs: 30, onPart: (i) => alive.current && setLit(i), rate: 1.1 });
    if (!alive.current) return;
    setLit(-1);
    celebrate();
    await speak(L.readHit(word), { caption: `${word.w}! よめたね!` });
    await wait(300);
    if (!alive.current) return;
    if (round + 1 >= words.length) setReward(completeActivity({ nodeId, stars: starsFromMistakes(mistakes, words.length) }));
    else setRound((r) => r + 1);
  };

  const wrong = (w: Word) => {
    setMistakes((m) => m + 1);
    setRoundMiss((m) => m + 1);
    setMood('think');
    void speak(L.readMiss(w), { caption: `これは「${w.w}」` });
  };

  return (
    <div className="screen game-screen readquiz-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />}>
        <div className="center">
          <ProgressDots total={words.length} current={round} />
        </div>
      </TopBar>
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(20vh, 16vw)" bubble="top" mood={mood} />
        </div>
      <div className="game-main game-center" key={round}>
        <div className="word-display pop-in" data-testid="read-word" data-word={word.w}>
          {units.map((u, i) => (
            <button key={i} className={`ch ${lit === i || lit === -1 ? 'lit' : ''}`} onClick={() => void speak(sayKana(u))}>
              {u}
            </button>
          ))}
        </div>
        <PicChoices choices={choices} answer={word} onCorrect={() => void correct()} onWrong={wrong} size={Math.min(200, window.innerHeight * 0.25)} />
      </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
