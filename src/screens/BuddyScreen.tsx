import { useEffect, useState } from 'react';
import Mascot from '../components/Mascot';
import { Btn, Emoji } from '../components/ui';
import { BUDDY_DEFAULT_NAMES, BUDDY_KIND_SAY, update, useApp, type BuddyKind, callName } from '../state/store';
import { resetTo } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { burst } from '../lib/confetti';
import { useCaption } from '../components/Buddy';
import { L } from '../voice/lines';
import './buddy.css';

const KINDS = Object.keys(BUDDY_KIND_SAY) as BuddyKind[];

export default function BuddyScreen() {
  const profile = useApp((s) => s.profile);
  const [chosen, setChosen] = useState<BuddyKind | null>(profile.setup ? profile.buddy : null);
  const caption = useCaption();

  useEffect(() => {
    void speak(L.chooseBuddy(callName(profile)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (k: BuddyKind, el: HTMLElement) => {
    setChosen(k);
    sfx.hop();
    const r = el.getBoundingClientRect();
    burst({ x: r.left + r.width / 2, y: r.top + r.height / 3, count: 24, power: 450 });
    void speak(L.buddyIntro(BUDDY_KIND_SAY[k], BUDDY_DEFAULT_NAMES[k]));
  };

  const decide = () => {
    if (!chosen) return;
    update((d) => {
      const keepName = d.profile.setup && d.profile.buddy === chosen;
      d.profile.buddy = chosen;
      if (!keepName) d.profile.buddyName = BUDDY_DEFAULT_NAMES[chosen];
      d.profile.setup = true;
    });
    sfx.fanfare();
    void speak(L.buddyStart(BUDDY_DEFAULT_NAMES[chosen]));
    resetTo({ name: 'home' });
  };

  return (
    <div className="screen buddy-screen">
      <div className="buddy-caption">{caption && <div className="bubble tail-bottom">{caption}</div>}</div>
      <div className="buddy-choices">
        {KINDS.map((kind) => (
          <button
            key={kind}
            className={`buddy-choice ${chosen === kind ? 'on' : ''}`}
            onClick={(e) => choose(kind, e.currentTarget)}
            aria-label={BUDDY_DEFAULT_NAMES[kind]}
            data-testid={`buddy-${kind}`}
          >
            <Mascot kind={kind} mood={chosen === kind ? 'happy' : 'normal'} size="100%" talking={chosen === kind ? undefined : false} />
            <span className="buddy-name">{BUDDY_DEFAULT_NAMES[kind]}</span>
          </button>
        ))}
      </div>
      <div className="buddy-actions">
        {chosen && (
          <Btn color="green" className="pop-in buddy-ok" onClick={decide} data-testid="buddy-ok">
            <Emoji>✅</Emoji> この こに する!
          </Btn>
        )}
      </div>
    </div>
  );
}
