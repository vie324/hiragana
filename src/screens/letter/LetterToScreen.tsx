import { useEffect, useState } from 'react';
import { Emoji, TopBar } from '../../components/ui';
import Buddy from '../../components/Buddy';
import Mascot from '../../components/Mascot';
import KanaKeyboard from '../../components/letter/KanaKeyboard';
import { MAX_NAME_CHARS, RECIPIENTS, recipientLabel } from '../../data/letters';
import { createLetter, recentNames, rememberName } from '../../state/letters';
import { navigate } from '../../state/router';
import { useApp, useBuddyFace, useScript } from '../../state/store';
import { setExtraSpeechNames, speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { L } from '../../voice/lines';
import './letters.css';

/** だれに かく? (あて名を えらぶ) */
export default function LetterToScreen() {
  const profile = useApp((s) => s.profile);
  const wear = useApp((s) => s.wear);
  const face = useBuddyFace();
  const script = useScript();
  const [keyboard, setKeyboard] = useState(false);
  const recent = recentNames();

  useEffect(() => {
    void speak('だれに てがみを かく?');
    return () => setExtraSpeechNames([]);
  }, []);

  const pick = (to: string, toId: string) => {
    sfx.pop();
    setExtraSpeechNames([to]);
    void speak(L.letterTo(to));
    const letter = createLetter({ to, toId, from: profile.name });
    navigate({ name: 'letter', id: letter.id, step: 'msg' });
  };

  return (
    <div className="screen letter-screen letter-to">
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>💌</Emoji> だれに かく?
          </>
        }
      />
      <div className="lt-body">
        <div className="lt-buddy">
          <Buddy size="min(24vh, 17vw)" bubble="top" bubbleMax="min(26vw, 300px)" />
        </div>
        <div className="lt-grid">
          {RECIPIENTS.map((r, i) => {
            const label = recipientLabel(r, script);
            return (
              <button
                key={r.id}
                className="lt-card"
                style={{ ['--c' as string]: r.color, ['--i' as string]: i }}
                onClick={() => pick(label, r.id)}
                data-testid={`to-${r.id}`}
              >
                <span className="lt-face">
                  <Emoji>{r.emoji}</Emoji>
                </span>
                <span className="lt-name">{label}</span>
              </button>
            );
          })}
          <button
            className="lt-card"
            style={{ ['--c' as string]: '#ffcf5a', ['--i' as string]: RECIPIENTS.length }}
            onClick={() => pick(profile.buddyName, 'buddy')}
            data-testid="to-buddy"
          >
            <span className="lt-face buddy">
              <Mascot kind={profile.buddy} outfit={wear} face={face} mood="happy" size="78%" talking={false} />
            </span>
            <span className="lt-name">{profile.buddyName}</span>
          </button>
          {recent.map((n, i) => (
            <button
              key={n}
              className="lt-card"
              style={{ ['--c' as string]: '#9ad0ff', ['--i' as string]: RECIPIENTS.length + 1 + i }}
              onClick={() => pick(n, 'custom')}
              data-testid="to-recent"
            >
              <span className="lt-face initial">{[...n][0]}</span>
              <span className="lt-name">{n}</span>
            </button>
          ))}
          <button
            className="lt-card custom"
            style={{ ['--c' as string]: '#d8cfc6', ['--i' as string]: RECIPIENTS.length + 1 + recent.length }}
            onClick={() => {
              sfx.tap();
              setKeyboard(true);
            }}
            data-testid="to-custom"
          >
            <span className="lt-face">
              <Emoji>✏️</Emoji>
            </span>
            <span className="lt-name">じぶんで</span>
          </button>
        </div>
      </div>
      {keyboard && (
        <KanaKeyboard
          title="だれに かくか、なまえを いれてね。"
          max={MAX_NAME_CHARS}
          space={false}
          onCancel={() => setKeyboard(false)}
          onDone={(name) => {
            setKeyboard(false);
            rememberName(name);
            pick(name, 'custom');
          }}
        />
      )}
    </div>
  );
}
