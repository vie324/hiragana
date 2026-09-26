import { useEffect, useState } from 'react';
import Buddy from '../components/Buddy';
import { Btn, Emoji, ProgressDots, SpeakerButton, TopBar } from '../components/ui';
import KanaChoices from '../components/KanaChoices';
import RewardModal from '../components/RewardModal';
import { findSpecialLesson, type LessonCard } from '../data/specialLessons';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { useAlive } from '../lib/hooks';
import { back } from '../state/router';
import { completeActivity, markIntroduced, type RewardResult } from '../state/actions';
import { sayKana } from '../lib/kana';
import './lesson.css';

function CardShow({ card }: { card: LessonCard }) {
  const parts = card.show.split(/([＋＝])/);
  const isFormula = parts.length > 1;
  return (
    <div className="sp-card pop-in">
      {isFormula ? (
        <div className={`sp-formula ${parts.some((p) => [...p].length > 1) ? 'long' : ''}`}>
          {parts.map((p, i) =>
            p === '＋' ? (
              <span key={i} className="sp-op">
                +
              </span>
            ) : p === '＝' ? (
              <span key={i} className="sp-op">
                =
              </span>
            ) : p === '゛' || p === '゜' ? (
              <span key={i} className="sp-part mark" aria-label={p === '゛' ? 'てんてん' : 'まる'}>
                <svg viewBox="0 0 100 100" width="1em" height="1em">
                  {p === '゛' ? (
                    <g stroke="currentColor" strokeWidth="10" strokeLinecap="round">
                      <line x1="36" y1="30" x2="50" y2="56" />
                      <line x1="60" y1="24" x2="74" y2="50" />
                    </g>
                  ) : (
                    <circle cx="52" cy="42" r="16" fill="none" stroke="currentColor" strokeWidth="9" />
                  )}
                </svg>
              </span>
            ) : (
              <button key={i} className={`sp-part ${i === parts.length - 1 ? 'result' : ''}`} onClick={() => void speak(sayKana(p))}>
                {p}
              </button>
            ),
          )}
        </div>
      ) : (
        <div className="sp-word">
          {[...card.show].map((c, i) => (
            <span key={i} className={`sp-ch ${'っゃゅょッャュョー'.includes(c) ? 'small' : ''} ${c === ' ' ? 'space' : ''}`}>
              {c}
            </span>
          ))}
        </div>
      )}
      {(card.emoji || (card.word && isFormula)) && (
        <div className="sp-example">
          {card.emoji && <Emoji className="sp-emoji">{card.emoji}</Emoji>}
          {card.word && isFormula && <span className="sp-example-word">{card.word}</span>}
        </div>
      )}
    </div>
  );
}

export default function SpecialLessonScreen({ lessonId, nodeId }: { lessonId: string; nodeId?: string }) {
  const lesson = findSpecialLesson(lessonId);
  const alive = useAlive();
  // -1 = はじめの せつめい, 0..cards-1 = カード, cards.. = クイズ
  const [pos, setPos] = useState(-1);
  // 「つぎへ」を だして よい カード (pos が かわった その ばで ボタンが きえるように、pos ごとに もつ)
  const [readyPos, setReadyPos] = useState<number | null>(null);
  const ready = readyPos === pos;
  const [mistakes, setMistakes] = useState(0);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);

  const nCards = lesson?.cards.length ?? 0;
  const nQuiz = lesson?.quiz.length ?? 0;
  const card = lesson && pos >= 0 && pos < nCards ? lesson.cards[pos] : null;
  const quiz = lesson && pos >= nCards ? lesson.quiz[pos - nCards] : null;

  const sayCurrent = () => {
    if (!lesson) return Promise.resolve(true);
    if (pos < 0) return speak(lesson.intro.say, { caption: lesson.intro.caption });
    if (card) return speak(card.say, { caption: card.caption });
    if (quiz) return speak(quiz.say, { caption: quiz.caption });
    return Promise.resolve(true);
  };

  useEffect(() => {
    let stale = false;
    setMood('normal');
    void sayCurrent().then(() => !stale && alive.current && setReadyPos(pos));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  if (!lesson) return null;

  const next = () => {
    sfx.whoosh();
    setPos((p) => p + 1);
  };

  const onCorrect = async () => {
    setMood('happy');
    await speak('せいかい!');
    if (!alive.current) return;
    if (pos + 1 >= nCards + nQuiz) {
      markIntroduced(lesson.kana);
      setReward(completeActivity({ nodeId, stars: mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1, kind: 'lesson' }));
    } else {
      setPos((p) => p + 1);
    }
  };

  const onWrong = () => {
    setMistakes((m) => m + 1);
    setMood('think');
    void speak('ちがうよ。もういちど よく みてね。');
  };

  const total = nCards + nQuiz + 1;
  const longest = quiz ? Math.max(...quiz.choices.map((c) => [...c].length)) : 1;

  return (
    <div className="screen lesson-screen special-screen">
      <TopBar nav="back" right={<SpeakerButton onClick={() => void sayCurrent()} />}>
        <div className="center">
          <ProgressDots total={total} current={pos + 1} />
        </div>
      </TopBar>
      <div className="lesson-body">
        <div className="lesson-buddy">
          <Buddy size="min(26vh, 20vw)" bubble="top" mood={mood} bubbleMax="min(24vw, 290px)" />
        </div>
        <div className="lesson-stage">
          {pos < 0 && (
            <div className="sp-card pop-in">
              <div className="sp-icon">{lesson.icon}</div>
              <div className="sp-title">{lesson.title}</div>
            </div>
          )}
          {card && <CardShow card={card} key={pos} />}
          {quiz && (
            <div className="find-step" key={pos}>
              <KanaChoices
                choices={quiz.choices}
                answer={quiz.answer}
                onCorrect={() => void onCorrect()}
                onWrong={onWrong}
                size={Math.min(longest > 2 ? 250 : 200, window.innerHeight * 0.27)}
              />
            </div>
          )}
        </div>
        <div className="lesson-next">
          {ready && !quiz && (
            <Btn color="green" round size={110} className="pop-in pulse" onClick={next} aria-label="つぎへ" data-testid="next">
              <Emoji>➡️</Emoji>
            </Btn>
          )}
        </div>
      </div>
      {reward && <RewardModal result={reward} onClose={back} />}
    </div>
  );
}
