import { useEffect, useState } from 'react';
import Buddy from '../components/Buddy';
import { Btn, Emoji, Stars, TopBar } from '../components/ui';
import WritingPad, { type PadMode, type PadResult } from '../components/WritingPad';
import StrokeOrder from '../components/StrokeOrder';
import RewardModal from '../components/RewardModal';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { celebrate } from '../lib/confetti';
import { useAlive, usePortrait } from '../lib/hooks';
import { useApp } from '../state/store';
import { replace } from '../state/router';
import { completeActivity, recordWriting, type RewardResult } from '../state/actions';
import { addSample, round } from '../state/gallery';
import { L, WRITE_MODE_SAY } from '../voice/lines';
import './write.css';

const MODES: { mode: PadMode; emoji: string; label: string; say: string }[] = [
  { mode: 'trace', emoji: '🐾', label: 'なぞる', say: WRITE_MODE_SAY.trace },
  { mode: 'faint', emoji: '👻', label: 'うすい', say: WRITE_MODE_SAY.faint },
  { mode: 'blank', emoji: '✨', label: 'みないで', say: WRITE_MODE_SAY.blank },
];

export default function WriteKanaScreen({ kana, list, nodeId }: { kana: string; list?: string[]; nodeId?: string }) {
  const alive = useAlive();
  const settings = useApp((s) => s.settings);
  const best = useApp((s) => s.kana[kana]?.writeBest ?? 0);
  const [mode, setMode] = useState<PadMode>(best >= 3 ? 'faint' : 'trace');
  const [resetKey, setResetKey] = useState(0);
  const [hintKey, setHintKey] = useState(0);
  const [demo, setDemo] = useState(0);
  const [result, setResult] = useState<PadResult | null>(null);
  const [mood, setMood] = useState<'normal' | 'happy' | 'think'>('normal');
  const [reward, setReward] = useState<RewardResult | null>(null);
  const [writes, setWrites] = useState(0);

  const idx = list ? list.indexOf(kana) : -1;
  const nextKana = list && idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const prevKana = list && idx > 0 ? list[idx - 1] : null;

  useEffect(() => {
    void speak(L.writeKana(kana, MODES.find((m) => m.mode === mode)!.say));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = async (r: PadResult) => {
    setResult(r);
    setMood('happy');
    recordWriting(kana, r.stars);
    addSample(kana, { at: Date.now(), stars: r.stars, strokes: round(r.strokes) });
    celebrate();
    sfx.correct();
    const n = writes + 1;
    setWrites(n);
    await speak(r.stars === 3 ? `すごい! じょうずに かけたね!` : r.stars === 2 ? 'よく かけたね!' : 'かけたね! もういっかい やってみよう。');
    if (!alive.current) return;
    // 3かい かいたら ごほうび
    if (n === 3) setReward(completeActivity({ nodeId, stars: r.stars, kind: 'write' }));
  };

  const again = () => {
    sfx.whoosh();
    setResult(null);
    setMood('normal');
    setResetKey((k) => k + 1);
  };

  const changeMode = (m: PadMode) => {
    sfx.tap();
    setMode(m);
    setResult(null);
    void speak(MODES.find((x) => x.mode === m)!.say);
  };

  const go = (k: string) => {
    sfx.whoosh();
    replace({ name: 'writeKana', kana: k, list, nodeId });
  };

  const portrait = usePortrait();
  const padSize = portrait ? 'min(58vh, 90vw)' : 'min(72vh, 58vw)';

  return (
    <div className="screen write-screen">
      <TopBar nav="back">
        <div className="write-modes">
          {MODES.map((m) => (
            <button key={m.mode} className={`mode-btn ${mode === m.mode ? 'on' : ''}`} onClick={() => changeMode(m.mode)} data-testid={`mode-${m.mode}`}>
              <Emoji>{m.emoji}</Emoji>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </TopBar>
      <div className="write-body">
        <div className="write-side left">
          <div className="write-kana-label">{kana}</div>
          <Buddy size="min(22vh, 16vw)" bubble="top" mood={mood} bubbleMax="min(24vw, 280px)" />
        </div>
        <div className="write-pad-wrap" style={{ width: padSize, height: padSize }}>
          <WritingPad
            kana={kana}
            mode={mode}
            level={settings.writeLevel}
            finger={settings.finger}
            resetKey={resetKey}
            hintKey={hintKey}
            onComplete={(r) => void onComplete(r)}
            onStroke={(_i, r) => {
              if (!r.ok) {
                setMood('think');
                void speak(r.reason === 'reverse' ? 'かく むきが はんたいだよ。' : r.reason === 'start' ? 'みどりの まるから かいてね。' : 'おしい! もういちど。');
              } else setMood('normal');
            }}
          />
          {demo > 0 && (
            <div className="write-demo" onClick={() => setDemo(0)}>
              <StrokeOrder kana={kana} playKey={demo} onDone={() => setTimeout(() => alive.current && setDemo(0), 900)} />
            </div>
          )}
          {result && (
            <div className="write-result pop-in">
              <Stars n={result.stars} size={64} />
            </div>
          )}
        </div>
        <div className="write-side right">
          <Btn color="yellow" round size={84} aria-label="かきじゅん" onClick={() => setDemo((d) => d + 1)} data-testid="demo">
            <Emoji>▶️</Emoji>
          </Btn>
          <Btn color="white" round size={84} aria-label="ヒント" onClick={() => setHintKey((h) => h + 1)}>
            <Emoji>💡</Emoji>
          </Btn>
          <Btn color="white" round size={84} aria-label="やりなおし" onClick={again} data-testid="again">
            <Emoji>🔄</Emoji>
          </Btn>
          <div className="write-nav">
            {prevKana && (
              <Btn color="blue" round size={84} aria-label="まえの もじ" onClick={() => go(prevKana)}>
                {prevKana}
              </Btn>
            )}
            {nextKana && (
              <Btn color="green" round size={84} className={result ? 'pulse' : ''} aria-label="つぎの もじ" onClick={() => go(nextKana)} data-testid="next-kana">
                {nextKana}
              </Btn>
            )}
          </div>
        </div>
      </div>
      {reward && <RewardModal result={reward} onClose={() => setReward(null)} />}
    </div>
  );
}
