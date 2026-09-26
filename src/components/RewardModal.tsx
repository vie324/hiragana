import { useEffect, useRef, useState } from 'react';
import type { RewardResult } from '../state/actions';
import { Btn, Emoji, Stars } from './ui';
import { speak, wait } from '../lib/speech';
import { sfx } from '../lib/sound';
import { burstAt, celebrate } from '../lib/confetti';
import { useApp } from '../state/store';
import Mascot from './Mascot';
import './reward.css';

interface Props {
  result: RewardResult;
  onClose: () => void;
  /** ほし の かわりに だす みだし */
  headline?: string;
}

const PRAISE: Record<number, [string, string]> = {
  3: ['すごい! まんてん!', 'すごい! まんてん!'],
  2: ['よく できました!', 'よく できました!'],
  1: ['がんばったね!', 'がんばったね!'],
};

export default function RewardModal({ result, onClose, headline }: Props) {
  const [step, setStep] = useState<'stars' | 'gift' | 'open' | 'done'>('stars');
  const giftRef = useRef<HTMLButtonElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const kind = useApp((s) => s.profile.buddy);
  const buddyName = useApp((s) => s.profile.buddyName);
  const alive = useRef(true);
  const opened = useRef(false);

  useEffect(() => {
    alive.current = true;
    (async () => {
      sfx.fanfare();
      celebrate();
      const [text] = PRAISE[Math.max(1, Math.min(3, result.stars))];
      await speak(headline ?? text);
      if (!alive.current || opened.current) return;
      setStep('gift');
      await speak('プレゼントを タッチしてね', { caption: 'プレゼントを タッチしてね' });
    })();
    return () => {
      alive.current = false;
    };
  }, [result.stars, headline]);

  const openGift = async () => {
    // すぐに タッチしても あけられる
    if (opened.current) return;
    opened.current = true;
    setStep('open');
    sfx.open();
    burstAt(giftRef.current, 50);
    await wait(150);
    sfx.sticker();
    await speak(result.rare ? 'わあ! キラキラ シールだ!' : 'シールを もらったよ!');
    if (!alive.current) return;
    if (result.stamp) {
      sfx.stamp();
      await speak('きょうの スタンプも ぽん!');
    }
    if (result.outfit && alive.current) {
      sfx.sparkle();
      await speak(`${result.outfit.say}を もらったよ! ${buddyName}に つけて あげたよ。`);
    }
    if (alive.current) setStep('done');
  };

  return (
    <div className="overlay reward">
      <div className="reward-card card pop-in">
        <div className="reward-stars">
          <Stars n={result.stars} size={78} />
        </div>
        <div className="reward-main">
          {step === 'stars' || step === 'gift' ? (
            <button
              ref={giftRef}
              className={`gift ${step === 'gift' ? 'ready' : ''}`}
              onClick={openGift}
              aria-label="プレゼント"
              data-testid="gift"
            >
              <Emoji>🎁</Emoji>
            </button>
          ) : (
            <div className={`sticker-reveal ${result.rare ? 'rare' : ''}`} ref={stickerRef}>
              <Emoji>{result.sticker}</Emoji>
            </div>
          )}
          {result.outfit && (step === 'open' || step === 'done') && (
            <div className="reward-outfit pop-in">
              <Mascot kind={kind} outfit={result.outfit.id} mood="happy" size={150} />
            </div>
          )}
          {result.stamp && (step === 'open' || step === 'done') && (
            <div className="reward-stamp">
              <span>きょうの</span>
              <b>スタンプ</b>
              <Emoji>💮</Emoji>
            </div>
          )}
        </div>
        <Btn color="green" className={`reward-ok ${step === 'done' ? 'pulse' : 'hidden'}`} onClick={onClose} data-testid="reward-ok">
          <Emoji>👍</Emoji> つぎへ
        </Btn>
      </div>
    </div>
  );
}
