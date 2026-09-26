/** ホームの 「きょうの ミッション」 (3つ + たからばこ) */
import { useEffect, useRef, useState } from 'react';
import { Btn, Emoji } from './ui';
import { LevelUpBanner } from './LevelUp';
import { todayKey, useApp } from '../state/store';
import { chestReady, missionStates } from '../state/progress';
import { openMissionChest, type ChestResult } from '../state/actions';
import type { Mission } from '../data/missions';
import { speak, wait } from '../lib/speech';
import { sfx } from '../lib/sound';
import { burstAt, celebrate } from '../lib/confetti';
import { useAlive } from '../lib/hooks';
import { L } from '../voice/lines';
import './missions.css';

export function ChestIcon({ state }: { state: 'locked' | 'ready' | 'open' }) {
  return (
    <svg viewBox="0 0 80 72" className={`chest-icon ${state}`} aria-hidden>
      <rect x="8" y="34" width="64" height="32" rx="6" className="chest-base" />
      <rect x="8" y="34" width="64" height="7" className="chest-rim" />
      <rect x="18" y="34" width="7" height="32" className="chest-band" />
      <rect x="55" y="34" width="7" height="32" className="chest-band" />
      <g className="chest-lid">
        <path d="M8 36 V24 C8 12 18 6 28 6 H52 C62 6 72 12 72 24 V36 Z" className="chest-top" />
        <rect x="18" y="7" width="7" height="29" className="chest-band" />
        <rect x="55" y="7" width="7" height="29" className="chest-band" />
      </g>
      <rect x="33" y="29" width="14" height="15" rx="3" className="chest-lock" />
      <circle cx="40" cy="35" r="2.6" className="chest-keyhole" />
    </svg>
  );
}

function Ring({ value }: { value: number }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="mission-ring" aria-hidden>
      <circle cx="32" cy="32" r={r} className="ring-bg" />
      <circle cx="32" cy="32" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
    </svg>
  );
}

interface Props {
  /** ミッションを タッチしたとき (その メニューを ひからせる) */
  onHint?: (menu: Mission['menu']) => void;
  onChest: (r: ChestResult) => void;
}

export default function MissionCard({ onHint, onChest }: Props) {
  const days = useApp((s) => s.days);
  const ms = missionStates(days);
  const ready = chestReady(days);
  const opened = !!days[todayKey()]?.chest;
  const [shake, setShake] = useState(0);

  const tapChest = () => {
    if (ready) {
      const r = openMissionChest();
      if (r) onChest(r);
    } else if (opened) {
      sfx.sparkle();
      void speak('きょうの たからばこは もう あけたよ。また あしたね!');
    } else {
      sfx.locked();
      setShake((k) => k + 1);
      void speak('ミッションを ぜんぶ クリアすると、たからばこが あくよ!');
    }
  };

  return (
    <div className="mission-card" data-testid="mission-card">
      <div className="mission-head">
        <Emoji>🎯</Emoji>
        <span>きょうの ミッション</span>
      </div>
      <div className="mission-row">
        {ms.map((m) => (
          <button
            key={m.kind}
            type="button"
            className={`mission ${m.done ? 'done' : ''}`}
            onClick={() => {
              sfx.tap();
              void speak(m.say);
              onHint?.(m.menu);
            }}
            data-testid={`mission-${m.kind}`}
            data-count={m.count}
            data-done={m.done ? 'yes' : undefined}
            aria-label={m.say}
          >
            <span className="mission-dial">
              <Ring value={m.count / m.goal} />
              <Emoji className="mission-icon">{m.icon}</Emoji>
              {m.done && <span className="mission-check">✓</span>}
            </span>
            <span className="mission-pips" aria-hidden>
              {Array.from({ length: m.goal }, (_, i) => (
                <i key={i} className={i < m.count ? 'on' : ''} />
              ))}
            </span>
          </button>
        ))}
        <button
          key={shake}
          type="button"
          className={`mission-chest ${ready ? 'ready' : opened ? 'opened' : 'locked'} ${shake ? 'nope' : ''}`}
          onClick={tapChest}
          data-testid="mission-chest"
          data-state={ready ? 'ready' : opened ? 'open' : 'locked'}
          aria-label="たからばこ"
        >
          <ChestIcon state={opened ? 'open' : ready ? 'ready' : 'locked'} />
        </button>
      </div>
    </div>
  );
}

/** たからばこを あけた ときの えんしゅつ */
export function ChestOverlay({ result, onClose }: { result: ChestResult; onClose: () => void }) {
  const [step, setStep] = useState<'closed' | 'open' | 'done'>('closed');
  const box = useRef<HTMLDivElement>(null);
  const alive = useAlive();

  useEffect(() => {
    (async () => {
      sfx.fanfare();
      await speak('ミッション ぜんぶ クリア! おめでとう!');
      if (!alive.current) return;
      await wait(150);
      if (!alive.current) return;
      sfx.chest();
      setStep('open');
      burstAt(box.current, 70);
      celebrate();
      await speak('わあ! キラキラ シールだ!');
      if (!alive.current) return;
      if (result.levelUp) {
        sfx.levelUp();
        await speak(L.levelUp(result.levelUp));
      }
      if (alive.current) setStep('done');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay chest-overlay" data-testid="chest-overlay">
      <div className="chest-card card pop-in">
        <div className={`chest-stage ${step}`} ref={box}>
          <div className="chest-rays" aria-hidden />
          <div className="chest-big">
            <ChestIcon state={step === 'closed' ? 'ready' : 'open'} />
          </div>
          {step !== 'closed' && (
            <div className="chest-sticker" data-testid="chest-sticker">
              <Emoji>{result.sticker}</Emoji>
            </div>
          )}
        </div>
        {result.levelUp && step !== 'closed' && <LevelUpBanner level={result.levelUp} />}
        <Btn color="green" className={`chest-ok ${step === 'done' ? 'pulse' : 'hidden'}`} onClick={onClose} data-testid="chest-ok">
          <Emoji>👍</Emoji> やったね!
        </Btn>
      </div>
    </div>
  );
}
