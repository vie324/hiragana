import { useApp, callName, useBuddyFace } from '../state/store';
import { navigate, replace } from '../state/router';
import { speak, unlockSpeech } from '../lib/speech';
import { startBgm, unlockAudio, sfx } from '../lib/sound';
import { greeting } from '../lib/session';
import Mascot from '../components/Mascot';
import { Emoji } from '../components/ui';
import { L } from '../voice/lines';
import { VOICES } from '../voice/bank';
import './start.css';

const TITLE = ['ひ', 'ら', 'が', 'な'];
const TITLE2 = ['ぼ', 'う', 'け', 'ん'];
const COLORS = ['#ff6b8b', '#ff9f43', '#ffc21a', '#4cc76f', '#4db4ff', '#a78bff', '#ff7eaa', '#ff8f3f'];

export default function StartScreen() {
  const profile = useApp((s) => s.profile);
  const face = useBuddyFace();
  const voice = useApp((s) => VOICES.find((v) => v.slug === s.settings.voice));

  const start = () => {
    unlockAudio();
    unlockSpeech();
    sfx.open();
    // iPad では タップの なかで よみあげを はじめる ひつようが ある
    if (profile.setup) {
      void speak(L.hello(callName(profile), greeting()));
      replace({ name: 'home' });
    } else {
      void speak('ひらがな ぼうけんへ ようこそ!');
      replace({ name: 'setup' });
    }
    startBgm();
  };

  return (
    <div className="screen start-screen" onClick={start} data-testid="start">
      <div className="start-sky" aria-hidden>
        <span className="emoji s1">☁️</span>
        <span className="emoji s2">☁️</span>
        <span className="emoji s3">⭐</span>
        <span className="emoji s4">🌈</span>
      </div>
      <h1 className="start-title" aria-label="ひらがな ぼうけん">
        <span className="line">
          {TITLE.map((c, i) => (
            <span key={i} style={{ color: COLORS[i], animationDelay: `${i * 0.12}s` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="line">
          {TITLE2.map((c, i) => (
            <span key={i} style={{ color: COLORS[i + 4], animationDelay: `${0.5 + i * 0.12}s` }}>
              {c}
            </span>
          ))}
        </span>
      </h1>
      <div className="start-buddy">
        <Mascot kind={profile.setup ? profile.buddy : 'usagi'} face={profile.setup ? face : null} mood="normal" wave size="min(34vh, 300px)" talking={false} />
      </div>
      <button className="btn green start-btn pulse" data-testid="start-button" aria-label="はじめる">
        <Emoji>▶️</Emoji> はじめる
      </button>
      <button
        className="start-parent ui"
        onClick={(e) => {
          e.stopPropagation();
          unlockAudio();
          unlockSpeech();
          navigate({ name: 'parent' });
        }}
      >
        おうちの方へ
      </button>
      {voice && <div className="start-credit ui">こえ: {voice.credit}</div>}
    </div>
  );
}
