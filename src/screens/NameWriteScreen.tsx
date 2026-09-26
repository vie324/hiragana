import { useEffect, useState } from 'react';
import Buddy from '../components/Buddy';
import { Btn, Emoji, TopBar } from '../components/ui';
import WritingPad, { type PadResult } from '../components/WritingPad';
import RewardModal from '../components/RewardModal';
import { hasStrokes } from '../lib/strokes';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { celebrate } from '../lib/confetti';
import { useAlive, usePortrait } from '../lib/hooks';
import { useApp, callName } from '../state/store';
import { navigate } from '../state/router';
import { completeActivity, recordWriting, type RewardResult } from '../state/actions';
import { addNameSample, addSample, round } from '../state/gallery';
import type { Pt } from '../lib/stroke';
import { L } from '../voice/lines';
import './write.css';

function InkChar({ strokes, size }: { strokes: Pt[][]; size: string }) {
  const d = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 109 109" style={{ width: size, height: size }} className="ink-char">
      {strokes.map((s, i) => (
        <path key={i} d={d(s)} fill="none" stroke="#ff8f3f" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export default function NameWriteScreen() {
  const alive = useAlive();
  const profile = useApp((s) => s.profile);
  const settings = useApp((s) => s.settings);
  const chars = [...profile.name].filter(hasStrokes);
  const [i, setI] = useState(0);
  const [written, setWritten] = useState<Pt[][][]>([]);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [mood, setMood] = useState<'normal' | 'happy'>('normal');
  const done = written.length >= chars.length && chars.length > 0;
  const portrait = usePortrait();

  useEffect(() => {
    if (!chars.length) {
      void speak('おうちの ひとに、なまえを いれて もらってね。');
      return;
    }
    void speak(L.nameStart(callName(profile), chars[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = async (r: PadResult) => {
    const k = chars[i];
    recordWriting(k, r.stars);
    addSample(k, { at: Date.now(), stars: r.stars, strokes: round(r.strokes) });
    const next = [...written, r.strokes];
    setWritten(next);
    sfx.correct();
    if (next.length >= chars.length) {
      setMood('happy');
      celebrate();
      sfx.fanfare();
      addNameSample({ at: Date.now(), name: profile.name, chars: chars.map((c, j) => ({ kana: c, strokes: round(next[j]) })) });
      await speak(L.nameDone(callName(profile)));
      if (alive.current) setTimeout(() => alive.current && setReward(completeActivity({ stars: 3 })), 1500);
    } else {
      await speak(L.nameNext(chars[i + 1]));
      if (alive.current) setI(i + 1);
    }
  };

  if (!chars.length) {
    return (
      <div className="screen write-screen">
        <TopBar nav="back" />
        <div className="center" style={{ flex: 1, flexDirection: 'column', gap: 30 }}>
          <Buddy size="min(30vh, 26vw)" bubble="top" />
          <Btn color="white" className="ui" onClick={() => navigate({ name: 'parent' })}>
            おうちの方: 名前を設定する
          </Btn>
        </div>
      </div>
    );
  }

  const padSize = portrait ? 'min(56vh, 88vw)' : 'min(64vh, 50vw)';

  return (
    <div className="screen write-screen name-screen">
      <TopBar nav="back">
        <div className="name-progress">
          {chars.map((c, j) => (
            <span key={j} className={`np ${j < written.length ? 'done' : j === i ? 'now' : ''}`}>
              {j < written.length ? <InkChar strokes={written[j]} size="56px" /> : c}
            </span>
          ))}
        </div>
      </TopBar>
      {done ? (
        <div className="name-done">
          <div className="name-ink card pop-in">
            {written.map((s, j) => (
              <InkChar key={j} strokes={s} size="min(34vh, 26vw)" />
            ))}
          </div>
          <Buddy size="min(24vh, 18vw)" bubble="right" mood="cheer" />
        </div>
      ) : (
        <div className="write-body">
          <div className="write-side left">
            <div className="write-kana-label">{chars[i]}</div>
            <Buddy size="min(22vh, 16vw)" bubble="top" mood={mood} bubbleMax="min(24vw, 280px)" />
          </div>
          <div className="write-pad-wrap" style={{ width: padSize, height: padSize }}>
            <WritingPad key={i} kana={chars[i]} mode="trace" level={settings.writeLevel} finger={settings.finger} onComplete={(r) => void onComplete(r)} />
          </div>
          <div className="write-side right">
            <Emoji className="name-badge">📛</Emoji>
          </div>
        </div>
      )}
      {reward && <RewardModal result={reward} headline="なまえ、かけたね!" onClose={() => setReward(null)} />}
    </div>
  );
}
