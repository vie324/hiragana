import { useEffect, useMemo, useState } from 'react';
import Buddy from '../../components/Buddy';
import { ProgressDots, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import { sayKana } from '../../lib/kana';
import { speak, wait } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt } from '../../lib/confetti';
import { useAlive, useIdle } from '../../lib/hooks';
import { shuffle } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, type RewardResult } from '../../state/actions';
import { distractors, starsFromMistakes, targetKana } from './pools';
import './games.css';

const ROUNDS = 6;
const COLORS = ['#ff6b8b', '#4db4ff', '#ffc21a', '#4cc76f', '#a78bff', '#ff9f43'];

interface BalloonSpec {
  kana: string;
  color: string;
  left: number;
  dur: number;
  delay: number;
}

export default function BalloonGame({ kana, nodeId }: { kana?: string[]; nodeId?: string }) {
  const alive = useAlive();
  const targets = useMemo(() => targetKana(kana, ROUNDS), [kana]);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [roundMistakes, setRoundMistakes] = useState(0);
  const [popped, setPopped] = useState<string | null>(null);
  const [wobble, setWobble] = useState<string | null>(null);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const target = targets[round];
  const nChoices = kana && kana.length <= 2 ? 3 : 4;

  const balloons: BalloonSpec[] = useMemo(() => {
    if (!target) return [];
    const others = distractors(target, nChoices - 1, kana ?? []);
    const list = shuffle([target, ...others]);
    const colors = shuffle(COLORS);
    return list.map((k, i) => ({
      kana: k,
      color: colors[i % colors.length],
      left: (100 / list.length) * i + 100 / list.length / 2,
      dur: 11 + ((i * 7) % 5),
      delay: -((i * 3.1) % 8) - 2,
    }));
  }, [target, nChoices, kana]);

  const prompt = () => speak(`「${sayKana(target)}」の ふうせんを わってね。`);

  useEffect(() => {
    if (!target) return;
    setPopped(null);
    setRoundMistakes(0);
    setMood('normal');
    void (round === 0 ? speak('きこえた もじの ふうせんを わってね。').then(() => alive.current && prompt()) : prompt());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useIdle(9000, () => void prompt(), [round], !popped && !reward);

  const tap = async (b: BalloonSpec, el: HTMLElement) => {
    if (popped || reward) return;
    if (b.kana === target) {
      setPopped(b.kana);
      sfx.pop();
      burstAt(el, 40);
      recordAnswer(target, roundMistakes === 0);
      setMood('happy');
      await speak(`「${sayKana(target)}」! あたり!`);
      await wait(200);
      if (!alive.current) return;
      if (round + 1 >= ROUNDS) {
        setReward(completeActivity({ nodeId, stars: starsFromMistakes(mistakes, ROUNDS) }));
      } else {
        setRound((r) => r + 1);
      }
    } else {
      sfx.wrong();
      setWobble(b.kana);
      setTimeout(() => setWobble(null), 600);
      setMistakes((m) => m + 1);
      setRoundMistakes((m) => m + 1);
      if (roundMistakes === 0) recordAnswer(target, false);
      setMood('think');
      await speak(`これは「${sayKana(b.kana)}」。「${sayKana(target)}」は どれかな?`);
    }
  };

  return (
    <div className="screen game-screen balloon-screen">
      <div className="sky-deco" aria-hidden>
        <span className="emoji c1">☁️</span>
        <span className="emoji c2">☁️</span>
        <span className="emoji c3">☁️</span>
      </div>
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />}>
        <div className="center">
          <ProgressDots total={ROUNDS} current={round} />
        </div>
      </TopBar>
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(22vh, 18vw)" bubble="top" mood={mood} />
        </div>
        <div className="game-main">
      <div className="balloon-field" key={round}>
        {balloons.map((b) => (
          <button
            key={b.kana}
            className={`balloon ${popped === b.kana ? 'popped' : ''} ${wobble === b.kana ? 'wobble' : ''} ${roundMistakes >= 2 && b.kana === target ? 'hint' : ''}`}
            style={{ left: `${b.left}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, ['--c' as string]: b.color }}
            onClick={(e) => void tap(b, e.currentTarget)}
            data-testid={`balloon-${b.kana}`}
            data-answer={b.kana === target ? 'yes' : undefined}
          >
            <span className="balloon-body">
              <span className="balloon-kana">{b.kana}</span>
            </span>
            <span className="balloon-string" />
          </button>
        ))}
      </div>
        </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
