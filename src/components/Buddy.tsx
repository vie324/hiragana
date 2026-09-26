import { useEffect, useState, type CSSProperties } from 'react';
import Mascot, { type Mood } from './Mascot';
import { useApp, useBuddyFace } from '../state/store';
import { getCaption, onCaptionChange, speak } from '../lib/speech';
import { pick } from '../lib/random';
import { callName } from '../state/store';
import { L } from '../voice/lines';

export function useCaption(): string | null {
  const [c, setC] = useState(getCaption());
  useEffect(() => onCaptionChange(setC), []);
  return c;
}

interface Props {
  mood?: Mood;
  size?: number | string;
  /** ふきだしの いち */
  bubble?: 'right' | 'top' | 'none';
  /** タップしたときの セリフ (なければ ランダム) */
  onTap?: () => void;
  wave?: boolean;
  className?: string;
  style?: CSSProperties;
  bubbleMax?: number | string;
}

const POKES = ['えへへ。', 'くすぐったいよ。', 'がんばろうね!', 'いっしょに あそぼう!', 'だいすき!', 'やったあ!', 'ふふふ。'];

export default function Buddy({ mood = 'normal', size = 180, bubble = 'right', onTap, wave, className = '', style, bubbleMax }: Props) {
  const kind = useApp((s) => s.profile.buddy);
  const outfit = useApp((s) => s.wear);
  const face = useBuddyFace();
  const showCaption = useApp((s) => s.settings.caption);
  const name = useApp((s) => callName(s.profile));
  const caption = useCaption();
  const [pokeMood, setPokeMood] = useState<Mood | null>(null);

  const tap =
    onTap ??
    (() => {
      setPokeMood('happy');
      const line = pick([...POKES, L.love(name)]);
      void speak(line).then(() => setPokeMood(null));
    });

  const text = showCaption && bubble !== 'none' ? caption : null;
  return (
    <div className={`buddy buddy-${bubble} ${className}`} style={style}>
      <Mascot kind={kind} outfit={outfit} face={face} mood={pokeMood ?? mood} size={size} onTap={tap} wave={wave} />
      {text && (
        <div className={`bubble ${bubble === 'top' ? 'tail-bottom' : 'tail-left'}`} style={{ maxWidth: bubbleMax }} key={text}>
          {text}
        </div>
      )}
    </div>
  );
}
