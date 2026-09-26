import { useEffect, useRef, useState } from 'react';
import type { RewardResult } from '../state/actions';
import { Btn, Emoji, Stars } from './ui';
import { speak, wait } from '../lib/speech';
import { sfx } from '../lib/sound';
import { burstAt, celebrate } from '../lib/confetti';
import { useApp, useBuddyFace } from '../state/store';
import { useIdle } from '../lib/hooks';
import Mascot from './Mascot';
import { LevelUpBanner } from './LevelUp';
import { comboReset } from '../state/combo';
import { daysReading, levelInfo, streakWorthPraising } from '../state/progress';
import { MISSIONS } from '../data/missions';
import { L } from '../voice/lines';
import './reward.css';

type Extra = 'streak' | 'mission' | 'level';

/** もらった ほしで レベルの ぼうが のびる */
function XpGain({ gained }: { gained: number }) {
  const after = useApp((s) => s.xp);
  const [before] = useState(() => Math.max(0, after - gained));
  const [go, setGo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGo(true), 600);
    return () => clearTimeout(t);
  }, []);
  const a = levelInfo(before);
  const b = levelInfo(before + gained);
  const from = a.into / a.need;
  const to = b.level > a.level ? 1 : b.into / b.need;
  return (
    <div className="xp-gain" data-testid="xp-gain">
      <span className="xp-level">
        レベル<b>{a.level}</b>
      </span>
      <span className="xp-bar" aria-hidden>
        <i style={{ width: `${Math.round((go ? to : from) * 100)}%` }} />
      </span>
      <span className="xp-plus">
        +{gained}
        <Emoji>⭐</Emoji>
      </span>
    </div>
  );
}

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
  const face = useBuddyFace();
  const buddyName = useApp((s) => s.profile.buddyName);
  const alive = useRef(true);
  const opened = useRef(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const addExtra = (e: Extra) => setExtras((x) => (x.includes(e) ? x : [...x, e]));

  useEffect(() => {
    alive.current = true;
    comboReset();
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

  useIdle(8000, () => void speak('プレゼントを タッチしてね'), [step], step === 'gift');
  useIdle(9000, () => void speak('「つぎへ」を おしてね'), [step], step === 'done');

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
      if (alive.current && streakWorthPraising(result.streak)) {
        addExtra('streak');
        sfx.sparkle();
        await speak(L.streak(result.streak));
      }
    }
    if (result.outfit && alive.current) {
      sfx.sparkle();
      await speak(L.gotOutfit(result.outfit.say, buddyName));
    }
    if (result.missions.length && alive.current) {
      addExtra('mission');
      sfx.sparkle();
      await speak(result.allMissions ? 'ミッション ぜんぶ クリア! おうちで たからばこを あけてね!' : 'ミッション クリア!');
    }
    if (result.levelUp && alive.current) {
      addExtra('level');
      sfx.levelUp();
      celebrate();
      await speak(L.levelUp(result.levelUp));
    }
    if (alive.current) setStep('done');
  };

  return (
    <div className="overlay reward">
      <div className="reward-card card pop-in">
        {extras.includes('level') && result.levelUp ? (
          <LevelUpBanner level={result.levelUp} />
        ) : (
          <div className="reward-stars">
            <Stars n={result.stars} size={78} />
          </div>
        )}
        {result.xp > 0 && !extras.includes('level') && <XpGain gained={result.xp} />}
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
              <Mascot kind={kind} outfit={result.outfit.id} face={face} mood="happy" size={150} />
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
        {(extras.includes('streak') || extras.includes('mission')) && (
          <div className="reward-extras">
            {extras.includes('streak') && (
              <div className="reward-chip chip-streak" data-testid="reward-streak">
                <Emoji>🔥</Emoji>
                <span>{daysReading(result.streak)} れんぞく!</span>
              </div>
            )}
            {extras.includes('mission') && (
              <div className="reward-chip chip-mission" data-testid="reward-mission">
                <Emoji>🎯</Emoji>
                <span>ミッション クリア!</span>
                {result.missions.map((k) => (
                  <Emoji key={k} className="reward-mission-icon">
                    {MISSIONS[k].icon}
                  </Emoji>
                ))}
              </div>
            )}
          </div>
        )}
        <Btn color="green" className={`reward-ok ${step === 'done' ? 'pulse' : 'hidden'}`} onClick={onClose} data-testid="reward-ok">
          <Emoji>👍</Emoji> つぎへ
        </Btn>
      </div>
    </div>
  );
}
