import { useState } from 'react';
import type { Word } from '../data/words';
import { sfx } from '../lib/sound';
import { burstAt } from '../lib/confetti';

interface Props {
  choices: Word[];
  answer: Word;
  onCorrect: () => void;
  onWrong: (w: Word) => void;
  size?: number;
}

/** えの カードから えらぶ */
export default function PicChoices({ choices, answer, onCorrect, onWrong, size = 200 }: Props) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [right, setRight] = useState(false);
  return (
    <div className="pic-choices" style={{ ['--card' as string]: `${size}px` }}>
      {choices.map((w) => (
        <button
          key={w.w}
          className={`pic-card ${wrong === w.w ? 'wrong wiggle' : ''} ${right && w.w === answer.w ? 'right' : ''}`}
          disabled={right}
          aria-label={w.w}
          data-testid={`pic-${w.w}`}
          data-answer={w.w === answer.w ? 'yes' : undefined}
          onClick={(e) => {
            if (w.w === answer.w) {
              setRight(true);
              sfx.correct();
              burstAt(e.currentTarget, 36);
              onCorrect();
            } else {
              setWrong(w.w);
              sfx.wrong();
              setTimeout(() => setWrong(null), 600);
              onWrong(w);
            }
          }}
        >
          <span className="emoji">{w.e}</span>
        </button>
      ))}
    </div>
  );
}
