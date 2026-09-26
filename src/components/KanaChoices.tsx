import { useState } from 'react';
import { sfx } from '../lib/sound';
import { burstAt } from '../lib/confetti';
import { badAnswer, goodAnswer } from '../lib/feedback';

interface Props {
  choices: string[];
  answer: string;
  onCorrect: () => void;
  onWrong: (picked: string) => void;
  /** カードの おおきさ (px) */
  size?: number;
  disabled?: boolean;
  testid?: string;
}

/** 「〇 は どれ?」の カード */
export default function KanaChoices({ choices, answer, onCorrect, onWrong, size = 170, disabled, testid = 'choice' }: Props) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [right, setRight] = useState(false);
  return (
    <div className="kana-choices" style={{ ['--card' as string]: `${size}px` }}>
      {choices.map((c) => (
        <button
          key={c}
          className={`kana-choice ${wrong === c ? 'wrong wiggle' : ''} ${right && c === answer ? 'right' : ''}`}
          disabled={disabled || right}
          data-testid={`${testid}-${c}`}
          data-answer={c === answer ? 'yes' : undefined}
          onClick={(e) => {
            if (c === answer) {
              setRight(true);
              sfx.correct();
              burstAt(e.currentTarget, 36);
              goodAnswer(e.currentTarget);
              onCorrect();
            } else {
              setWrong(c);
              sfx.wrong();
              badAnswer();
              setTimeout(() => setWrong(null), 600);
              onWrong(c);
            }
          }}
        >
          <span className="kana-big" style={{ fontSize: size * (c.length > 1 ? 0.42 : 0.62) }}>
            {c}
          </span>
        </button>
      ))}
    </div>
  );
}
