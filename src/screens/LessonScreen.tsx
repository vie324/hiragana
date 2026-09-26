import { useEffect, useMemo, useState } from 'react';
import Buddy from '../components/Buddy';
import { Btn, Emoji, ProgressDots, SpeakerButton, TopBar } from '../components/ui';
import StrokeOrder from '../components/StrokeOrder';
import WritingPad, { type PadResult } from '../components/WritingPad';
import KanaChoices from '../components/KanaChoices';
import RewardModal from '../components/RewardModal';
import { kanaExample, exampleSentence } from '../data/kanaInfo';
import { sayKana, similarTo, BASIC_KANA } from '../lib/kana';
import { speak, wait } from '../lib/speech';
import { sfx } from '../lib/sound';
import { celebrate } from '../lib/confetti';
import { useAlive, usePortrait } from '../lib/hooks';
import { shuffle, sample } from '../lib/random';
import { useApp, getData } from '../state/store';
import { back } from '../state/router';
import { completeActivity, knownKana, markIntroduced, recordAnswer, recordWriting, type RewardResult } from '../state/actions';
import { addSample, round } from '../state/gallery';
import { hasStrokes } from '../lib/strokes';
import './lesson.css';

type Step = 'intro' | 'word' | 'order' | 'write' | 'find';
const STEPS: Step[] = ['intro', 'word', 'order', 'write', 'find'];

function makeChoices(kana: string): string[] {
  const known = [...knownKana(getData())].filter((k) => k !== kana && BASIC_KANA.includes(k));
  const similar = similarTo(kana).filter((k) => k !== kana);
  const pool = [...new Set([...similar.slice(0, 2), ...sample(known, 3)])].filter((k) => k !== kana);
  const fill = pool.length >= 2 ? pool : [...pool, ...sample(BASIC_KANA.filter((k) => k !== kana && !pool.includes(k)), 2)];
  return shuffle([kana, ...fill.slice(0, 2)]);
}

export default function LessonScreen({ kana, nodeId }: { kana: string; nodeId?: string }) {
  const alive = useAlive();
  const settings = useApp((s) => s.settings);
  const ex = kanaExample(kana);
  const sentence = exampleSentence(kana);
  const canWrite = hasStrokes(kana);
  const steps = canWrite ? STEPS : STEPS.filter((s) => s !== 'order' && s !== 'write');
  const [step, setStep] = useState<Step>('intro');
  const [ready, setReady] = useState(false);
  const [bump, setBump] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [writeStars, setWriteStars] = useState(3);
  const [findRound, setFindRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [showSkip, setShowSkip] = useState(false);
  const choices = useMemo(() => makeChoices(kana), [kana, findRound]);
  const idx = steps.indexOf(step);

  const say = (text: string) => speak(text);

  // ステップごとの せつめい
  useEffect(() => {
    setReady(false);
    setMood('normal');
    let t: ReturnType<typeof setTimeout> | undefined;
    // つぎの ステップに すすんだら (または 画面を とじたら) この ながれは とめる
    let stale = false;
    const live = () => !stale && alive.current;
    (async () => {
      switch (step) {
        case 'intro':
          // カードを タッチして よみあげが とぎれても、おなじ ステップなら つづける
          await say(`これは、「${sayKana(kana)}」。いっしょに いってみよう。`);
          if (!live()) return;
          await wait(250);
          if (!live()) return;
          setBump((b) => b + 1);
          await say(sayKana(kana));
          break;
        case 'word':
          if (sentence) await speak(sentence.say, { caption: sentence.text });
          break;
        case 'order':
          setPlayKey((k) => k + 1);
          await say('かきじゅんを みてみよう。');
          break;
        case 'write':
          setShowSkip(false);
          t = setTimeout(() => live() && setShowSkip(true), 15000);
          await say(settings.finger === 'pen' ? 'ペンで なぞって みよう。' : 'ゆびか ペンで、なぞって みよう。');
          return;
        case 'find':
          await say(`「${sayKana(kana)}」は どれかな?`);
          return;
      }
      if (live()) setReady(true);
    })();
    return () => {
      stale = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    const i = steps.indexOf(step);
    if (i < steps.length - 1) {
      sfx.whoosh();
      setStep(steps[i + 1]);
    }
  };

  const finish = async (extraMistakes = 0) => {
    markIntroduced([kana]);
    const total = mistakes + extraMistakes;
    const stars = Math.max(1, 3 - (total > 0 ? 1 : 0) - (writeStars < 2 ? 1 : 0));
    const result = completeActivity({ nodeId, stars });
    setReward(result);
  };

  const onWritten = async (r: PadResult) => {
    setWriteStars(r.stars);
    recordWriting(kana, r.stars);
    addSample(kana, { at: Date.now(), stars: r.stars, strokes: round(r.strokes) });
    setMood('happy');
    celebrate();
    sfx.correct();
    await say(r.stars === 3 ? `じょうず! 「${sayKana(kana)}」が かけたね!` : `「${sayKana(kana)}」が かけたね!`);
    if (alive.current) next();
  };

  const onFindCorrect = async () => {
    recordAnswer(kana, mistakes === 0);
    setMood('happy');
    await say(`せいかい! 「${sayKana(kana)}」!`);
    if (!alive.current) return;
    if (findRound === 0) {
      setFindRound(1);
      await say(`もう いっかい。「${sayKana(kana)}」は どれかな?`);
    } else {
      await finish();
    }
  };

  const onFindWrong = (picked: string) => {
    setMistakes((m) => m + 1);
    setMood('think');
    void say(`これは「${sayKana(picked)}」。「${sayKana(kana)}」を さがしてね。`);
  };

  const replay = () => {
    switch (step) {
      case 'intro':
        setBump((b) => b + 1);
        void say(sayKana(kana));
        break;
      case 'word':
        if (sentence) void speak(sentence.say, { caption: sentence.text });
        break;
      case 'order':
        setPlayKey((k) => k + 1);
        break;
      case 'write':
        void say('いろの ついた ところを、みどりの まるから なぞってね。');
        break;
      case 'find':
        void say(`「${sayKana(kana)}」は どれかな?`);
        break;
    }
  };

  const portrait = usePortrait();
  const padSize = portrait ? 'min(54vh, 86vw)' : 'min(64vh, 52vw)';

  return (
    <div className="screen lesson-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={replay} />}>
        <div className="center">
          <ProgressDots total={steps.length} current={idx} />
        </div>
      </TopBar>
      <div className="lesson-body">
        <div className="lesson-buddy">
          <Buddy size="min(26vh, 20vw)" bubble="top" mood={mood} bubbleMax="min(24vw, 290px)" />
        </div>
        <div className="lesson-stage">
          {step === 'intro' && (
            <button
              className="kana-hero card pop-in"
              key={bump}
              onClick={() => {
                setBump((b) => b + 1);
                sfx.tap();
                void say(sayKana(kana));
              }}
              data-testid="kana-hero"
            >
              <span className="kana-big">{kana}</span>
            </button>
          )}
          {step === 'word' && ex && (
            <div className="word-step">
              <button className="word-pic pop-in" onClick={() => void speak(ex.say, { caption: ex.word })} aria-label={ex.word}>
                <Emoji>{ex.emoji}</Emoji>
              </button>
              <div className="word-letters">
                {[...ex.word].map((c, i) =>
                  c === ' ' ? (
                    <span key={i} className="gap" />
                  ) : (
                    <button
                      key={i}
                      className={`word-letter ${c === kana ? 'target' : ''}`}
                      onClick={() => {
                        sfx.tap();
                        void speak(sayKana(c));
                      }}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
          {step === 'order' && (
            <div className="order-step" style={{ width: padSize, height: padSize }}>
              <StrokeOrder kana={kana} playKey={playKey} onDone={() => alive.current && setReady(true)} />
            </div>
          )}
          {step === 'write' && (
            <div className="write-step" style={{ width: padSize, height: padSize }}>
              <WritingPad kana={kana} mode="trace" level={settings.writeLevel} finger={settings.finger} onComplete={onWritten} />
            </div>
          )}
          {step === 'find' && (
            <div className="find-step" key={findRound}>
              <div className="find-prompt">
                <span className="kana-big small">{kana}</span> は どれ?
              </div>
              <KanaChoices choices={choices} answer={kana} onCorrect={onFindCorrect} onWrong={onFindWrong} size={Math.min(200, window.innerHeight * 0.24)} />
            </div>
          )}
        </div>
        <div className="lesson-next">
          {ready && step !== 'find' && step !== 'write' && (
            <Btn color="green" round size={110} className="pop-in pulse" onClick={next} aria-label="つぎへ" data-testid="next">
              <Emoji>➡️</Emoji>
            </Btn>
          )}
          {step === 'write' && showSkip && (
            <Btn color="gray" className="pop-in skip" onClick={next} data-testid="skip">
              とばす
            </Btn>
          )}
        </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
