import { useEffect, useMemo, useState } from 'react';
import Buddy from '../../components/Buddy';
import { ProgressDots, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import PicChoices from '../../components/PicChoices';
import { sayKana, splitUnits } from '../../lib/kana';
import { speak, wait } from '../../lib/speech';
import { useAlive, useIdle } from '../../lib/hooks';
import { shuffle, pick, sample } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, type RewardResult } from '../../state/actions';
import { WORDS, sayWord, wordsStartingWith, type Word } from '../../data/words';
import { starsFromMistakes, targetKana } from './pools';
import './games.css';

const ROUNDS = 5;

interface Q {
  kana: string;
  answer: Word;
  choices: Word[];
}

function makeQuestions(kana?: string[]): Q[] {
  const usable = (kana ?? []).filter((k) => wordsStartingWith(k).length > 0);
  const targets = targetKana(usable.length ? usable : undefined, ROUNDS * 2).filter((k) => wordsStartingWith(k).length > 0);
  const out: Q[] = [];
  const usedWords = new Set<string>();
  for (const k of targets) {
    if (out.length >= ROUNDS) break;
    const cands = wordsStartingWith(k).filter((w) => !usedWords.has(w.w));
    if (!cands.length) continue;
    const answer = pick(cands);
    usedWords.add(answer.w);
    const others = sample(
      WORDS.filter((w) => splitUnits(w.w)[0] !== k && [...w.w].length <= 5),
      2,
    );
    out.push({ kana: k, answer, choices: shuffle([answer, ...others]) });
  }
  return out;
}

export default function FirstSoundGame({ kana, nodeId }: { kana?: string[]; nodeId?: string }) {
  const alive = useAlive();
  const questions = useMemo(() => makeQuestions(kana), [kana]);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [roundMiss, setRoundMiss] = useState(0);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const q = questions[round];

  const prompt = () => (q ? speak(`「${sayKana(q.kana)}」から はじまる もの、どれかな?`) : Promise.resolve(true));

  useEffect(() => {
    setRoundMiss(0);
    setMood('normal');
    void (round === 0 ? speak('はじめの おとを きいてね。').then(() => alive.current && prompt()) : prompt());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useIdle(10000, () => void prompt(), [round], !reward);

  if (!q) return null;
  const total = questions.length;

  const correct = async () => {
    recordAnswer(q.kana, roundMiss === 0);
    setMood('happy');
    await speak(`${sayWord(q.answer)}! 「${sayKana(q.kana)}」から はじまるね!`, { caption: `${q.answer.w}!` });
    await wait(200);
    if (!alive.current) return;
    if (round + 1 >= total) setReward(completeActivity({ nodeId, stars: starsFromMistakes(mistakes, total) }));
    else setRound((r) => r + 1);
  };

  const wrong = (w: Word) => {
    setMistakes((m) => m + 1);
    setRoundMiss((m) => m + 1);
    if (roundMiss === 0) recordAnswer(q.kana, false);
    setMood('think');
    const first = splitUnits(w.w)[0];
    void speak(`${sayWord(w)}は、「${sayKana(first)}」から はじまるよ。`, { caption: `${w.w} は「${first}」から` });
  };

  return (
    <div className="screen game-screen firstsound-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />}>
        <div className="center">
          <ProgressDots total={total} current={round} />
        </div>
      </TopBar>
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(20vh, 16vw)" bubble="top" mood={mood} />
        </div>
      <div className="game-main game-center" key={round}>
        <button className="target-kana pop-in" onClick={() => void speak(sayKana(q.kana))} data-testid="target-kana">
          {q.kana}
        </button>
        <PicChoices choices={q.choices} answer={q.answer} onCorrect={() => void correct()} onWrong={wrong} size={Math.min(210, window.innerHeight * 0.26)} />
      </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
