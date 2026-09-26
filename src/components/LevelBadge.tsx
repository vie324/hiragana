import { Emoji } from './ui';
import FaceBadge from './FaceBadge';
import { todayKey, useApp, useChildFace } from '../state/store';
import { levelInfo, streakDays } from '../state/progress';
import { navigate } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './status.css';

/** こどもの かお + レベル + つぎの レベルまでの ほし */
export function LevelBadge() {
  const xp = useApp((s) => s.xp);
  const avatar = useApp((s) => s.profile.avatar);
  const face = useChildFace();
  const { level, into, need } = levelInfo(xp);
  return (
    <button
      type="button"
      className="level-badge"
      onClick={() => {
        sfx.tap();
        void speak('ほしを あつめると レベルが あがるよ!');
      }}
      data-testid="level-badge"
      data-level={level}
      aria-label={`レベル ${level}`}
    >
      <span className="level-avatar">{face ? <FaceBadge img={face} size="100%" /> : <Emoji>{avatar}</Emoji>}</span>
      <span className="level-info">
        <span className="level-num">
          レベル<b>{level}</b>
        </span>
        <span className="level-bar" aria-hidden>
          <i style={{ width: `${Math.round((into / need) * 100)}%` }} />
          <Emoji className="level-star">⭐</Emoji>
        </span>
      </span>
    </button>
  );
}

/** れんぞくで あそんだ ひ (🔥) */
export function StreakChip() {
  const days = useApp((s) => s.days);
  const n = streakDays(days);
  const today = !!days[todayKey()]?.acts;
  return (
    <button
      type="button"
      className={`streak-chip ${today ? 'lit' : ''}`}
      onClick={() => {
        sfx.tap();
        navigate({ name: 'stamps' });
      }}
      data-testid="streak-chip"
      data-streak={n}
      aria-label={`${n}にち れんぞく`}
    >
      <Emoji className="flame">🔥</Emoji>
      <b>{n}</b>
    </button>
  );
}
