import { useEffect, useMemo, useState } from 'react';
import Buddy from '../../components/Buddy';
import { Emoji, SpeakerButton, TopBar } from '../../components/ui';
import RewardModal from '../../components/RewardModal';
import { speak, wait } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt, celebrate } from '../../lib/confetti';
import { useAlive, useIdle } from '../../lib/hooks';
import { shuffle } from '../../lib/random';
import { back } from '../../state/router';
import { completeActivity, recordAnswer, type RewardResult } from '../../state/actions';
import { lastSound, type Word } from '../../data/words';
import { makeChain, shiritoriDistractors } from '../../data/shiritori';
import { starsFromMistakes } from './pools';
import { L } from '../../voice/lines';
import './games.css';

const LINKS = 5;

function WordCard({ w, highlightLast, highlightFirst }: { w: Word; highlightLast?: boolean; highlightFirst?: boolean }) {
  const chars = [...w.w];
  return (
    <div className="sh-word">
      <Emoji className="sh-emoji">{w.e}</Emoji>
      <span className="sh-text">
        {chars.map((c, i) => (
          <span key={i} className={(highlightLast && i === chars.length - 1) || (highlightFirst && i === 0) ? 'hl' : ''}>
            {c}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function ShiritoriGame() {
  const alive = useAlive();
  const chain = useMemo(() => makeChain(LINKS), []);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const current = chain[step];
  const answer = chain[step + 1];
  const sound = current ? lastSound(current.w) : '';
  const choices = useMemo(() => {
    if (!answer) return [];
    const used = new Set(chain.map((w) => w.w));
    return shuffle([answer, ...shiritoriDistractors(sound, used, 2)]);
  }, [answer, chain, sound]);

  const prompt = () =>
    speak(L.shiriAsk(current, sound), {
      caption: `「${sound}」から はじまる ものは?`,
    });

  useEffect(() => {
    setLocked(false);
    setMood('normal');
    if (step === 0) {
      void speak(L.shiriStart(current), { caption: `しりとり! はじめは「${current.w}」` }).then(
        (ok) => ok && alive.current && prompt(),
      );
    } else if (step < LINKS) {
      void prompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useIdle(12000, () => void prompt(), [step], !reward && step < LINKS);

  const pickWord = async (w: Word, el: HTMLElement) => {
    if (locked || reward) return;
    if (w.w === answer.w) {
      setLocked(true);
      sfx.correct();
      burstAt(el, 30);
      recordAnswer(sound, true);
      setMood('happy');
      await speak(L.shiriHit(w), { caption: `${w.w}! つながったね!` });
      await wait(250);
      if (!alive.current) return;
      if (step + 1 >= LINKS) {
        celebrate();
        setStep(step + 1);
        await speak('しりとり、ぜんぶ つながったね!');
        if (alive.current) setReward(completeActivity({ stars: starsFromMistakes(mistakes, LINKS) }));
      } else {
        setStep(step + 1);
      }
    } else {
      sfx.wrong();
      setWrong(w.w);
      setTimeout(() => setWrong(null), 600);
      setMistakes((m) => m + 1);
      setMood('think');
      await speak(L.shiriMiss(w, sound), {
        caption: `${w.w} は「${w.w[0]}」から`,
      });
    }
  };

  return (
    <div className="screen game-screen shiritori-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void prompt()} />}>
        <div className="sh-chain">
          {chain.slice(0, step + 1).map((w, i) => (
            <span key={w.w} className="sh-link">
              {i > 0 && <span className="sh-arrow">→</span>}
              <Emoji>{w.e}</Emoji>
            </span>
          ))}
        </div>
      </TopBar>
      <div className="game-layout">
        <div className="game-side">
          <Buddy size="min(20vh, 16vw)" bubble="top" mood={mood} />
        </div>
        <div className="game-main sh-main" key={step}>
          {step < LINKS ? (
            <>
              <div className="sh-current pop-in">
                <WordCard w={current} highlightLast />
                <div className="sh-sound">
                  <span className="sh-arrow big">→</span>
                  <span className="sh-sound-kana">{sound}</span>
                </div>
              </div>
              <div className="pic-choices">
                {choices.map((w) => (
                  <button
                    key={w.w}
                    className={`pic-card sh-choice ${wrong === w.w ? 'wrong wiggle' : ''}`}
                    onClick={(e) => void pickWord(w, e.currentTarget)}
                    data-testid={`sh-${w.w}`}
                    data-answer={w.w === answer.w ? 'yes' : undefined}
                    style={{ ['--card' as string]: `${Math.min(190, window.innerHeight * 0.23)}px` }}
                  >
                    <span className="emoji">{w.e}</span>
                    <span className="sh-choice-word">{w.w}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="sh-done pop-in">
              {chain.map((w, i) => (
                <span key={w.w} className="sh-link">
                  {i > 0 && <span className="sh-arrow">→</span>}
                  <WordCard w={w} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
