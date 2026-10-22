import { useEffect, useRef, useState } from 'react';
import { Emoji, TopBar } from '../../components/ui';
import Buddy from '../../components/Buddy';
import RewardModal from '../../components/RewardModal';
import LetterPaper from '../../components/letter/LetterPaper';
import PostBox from '../../components/letter/PostBox';
import { EnvelopeScene, sceneMetrics, type EnvStage } from '../../components/letter/Envelope';
import { renderLetterBlob } from '../../components/letter/letterImage';
import { SEALS, PAPER_H, PAPER_W } from '../../data/letters';
import { postLetter, updateLetter, type Letter } from '../../state/letters';
import { completeActivity, type RewardResult } from '../../state/actions';
import { backTo } from '../../state/router';
import { speak, wait } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt, celebrate } from '../../lib/confetti';
import { useAlive, usePortrait } from '../../lib/hooks';
import './letters.css';

type Phase = 'prep' | 'fold' | 'seal' | 'turn' | 'post' | 'posting' | 'done';

function useSceneWidth(): number {
  const portrait = usePortrait();
  const calc = () => {
    const w = window.innerWidth;
    const h = window.innerHeight - 110;
    // てがみ (ひろげた) が はいる おおきさ
    const byH = (h - 24) / ((0.8 * PAPER_H) / PAPER_W);
    return Math.round(Math.max(240, Math.min(portrait ? w * 0.84 : w * 0.5, byH, 640)));
  };
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait]);
  return w;
}

/** ふうとうに いれて、シールで とめて、ポストへ */
export default function PostStep({ letter }: { letter: Letter }) {
  const alive = useAlive();
  const W = useSceneWidth();
  const [phase, setPhase] = useState<Phase>('prep');
  const [stage, setStage] = useState<EnvStage>('letter');
  const [image, setImage] = useState<string | null>(null);
  const [sealed, setSealed] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [eating, setEating] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const m = sceneMetrics(W);
  // ふうとうを しめたら すこし うえへ (まんなかに)
  const lift = stage === 'closed' || stage === 'front' ? m.envTop / 2 : 0;
  const base = { x: drag?.dx ?? 0, y: (drag?.dy ?? 0) - lift };

  // てがみを 画像に して、たたむ アニメーションに つかう
  useEffect(() => {
    let url: string | null = null;
    void (async () => {
      const blob = await renderLetterBlob(letter, 1000, 'image/jpeg');
      if (!alive.current) return;
      url = blob ? URL.createObjectURL(blob) : null;
      setImage(url);
      setPhase('fold');
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'fold') return;
    let live = true;
    void (async () => {
      void speak('てがみを たたんで、ふうとうに いれるよ。');
      const steps: [EnvStage, number][] = [
        ['folded', 700],
        ['above', 1150],
        ['inside', 900],
        ['closed', 900],
      ];
      for (const [s, ms] of steps) {
        await wait(ms);
        if (!live || !alive.current) return;
        if (s === 'folded') sfx.whoosh();
        if (s === 'inside') sfx.hop();
        if (s === 'closed') sfx.pop();
        setStage(s);
      }
      await wait(700);
      if (!live || !alive.current) return;
      setPhase('seal');
      void speak('シールで ふうとうを とめよう!');
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const seal = async (s: string) => {
    if (phase !== 'seal') return;
    updateLetter(letter.id, (l) => void (l.seal = s));
    setSealed(true);
    sfx.stamp();
    setPhase('turn');
    await wait(900);
    if (!alive.current) return;
    sfx.whoosh();
    setStage('front');
    await wait(900);
    if (!alive.current) return;
    setStamped(true);
    sfx.stamp();
    await wait(700);
    if (!alive.current) return;
    setPhase('post');
    void speak('ポストに いれてね!');
  };

  const post = async () => {
    if (phase !== 'post') return;
    setPhase('posting');
    const el = sceneRef.current;
    const box = boxRef.current?.querySelector('.pb-mouth')?.getBoundingClientRect();
    setEating(true);
    sfx.whoosh();
    if (el && box && typeof el.animate === 'function') {
      const r = el.getBoundingClientRect();
      // ふうとうの まんなかを ポストの くちへ (いまの ずれ base から)
      const dx = box.left + box.width / 2 - (r.left + r.width / 2);
      const dy = box.top + box.height / 2 - (r.top + m.envTop + m.Eh / 2);
      await el
        .animate(
          [
            { transform: `translate(${base.x}px, ${base.y}px) scale(1)`, opacity: 1 },
            {
              transform: `translate(${base.x + dx * 0.7}px, ${base.y + dy * 0.7 - 40}px) scale(0.42) rotate(-6deg)`,
              opacity: 1,
              offset: 0.6,
            },
            { transform: `translate(${base.x + dx}px, ${base.y + dy}px) scale(0.12) rotate(0deg)`, opacity: 0 },
          ],
          { duration: 900, easing: 'cubic-bezier(0.5, 0, 0.4, 1)', fill: 'forwards' },
        )
        .finished.catch(() => undefined);
    }
    if (!alive.current) return;
    postLetter(letter.id);
    sfx.levelUp();
    burstAt(boxRef.current, 60);
    setEating(false);
    setPhase('done');
    await speak('とどけー!');
    if (!alive.current) return;
    celebrate();
    setReward(completeActivity({ stars: 3, kind: 'write' }));
  };

  /** ふうとうを ポストまで ひっぱる */
  const pressEnvelope = (e: React.PointerEvent) => {
    if (phase !== 'post') return;
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      moved = moved || Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8;
      if (moved) setDrag({ dx: ev.clientX - x0, dy: ev.clientY - y0 });
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const r = boxRef.current?.getBoundingClientRect();
      const over = r && ev.clientX > r.left - 40 && ev.clientX < r.right + 40 && ev.clientY > r.top - 40 && ev.clientY < r.bottom;
      if (!moved || over) void post();
      else {
        setDrag(null);
        void speak('ポストまで もっていってね。');
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  return (
    <div className={`screen letter-screen letter-post phase-${phase}`}>
      <TopBar
        nav={phase === 'done' || phase === 'posting' ? 'none' : 'back'}
        title={
          <>
            <Emoji>✉️</Emoji> ポストへ
          </>
        }
      />
      <div className="lp-body">
        <div className="lp-stage">
          {phase === 'prep' ? (
            <div className="lp-prep" style={{ width: W * 0.8 }}>
              <div className="paper-frame">
                <LetterPaper letter={letter} />
              </div>
            </div>
          ) : (
            <div
              ref={sceneRef}
              className={`lp-scene ${phase === 'post' ? 'grab' : ''}`}
              style={{
                transform: `translate(${base.x}px, ${base.y}px)`,
                transformOrigin: `50% ${m.envTop + m.Eh / 2}px`,
                transition: drag ? 'none' : undefined,
              }}
              onPointerDown={pressEnvelope}
              data-testid="post-envelope"
            >
              <EnvelopeScene letter={letter} stage={stage} image={image} width={W} sealed={sealed} stamped={stamped} />
            </div>
          )}
        </div>
        <div
          className={`lp-box ${phase === 'post' || phase === 'posting' || phase === 'done' ? 'in' : ''}`}
          ref={boxRef}
          onClick={() => void post()}
          data-testid="post-box"
        >
          <PostBox eating={eating} happy={phase === 'done'} />
          {phase === 'post' && <div className="lp-arrow">👈</div>}
        </div>
        {phase === 'seal' && (
          <div className="lp-seals pop-in" data-testid="seal-picker">
            <div className="lp-seals-title">シールで とめよう</div>
            <div className="lp-seals-row">
              {SEALS.map((s) => (
                <button key={s} className="lp-seal" onClick={() => void seal(s)} data-testid={`seal-${s}`}>
                  <Emoji>{s}</Emoji>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="lp-buddy">
          <Buddy size="min(18vh, 13vw)" bubble="top" mood={phase === 'done' ? 'cheer' : 'happy'} bubbleMax="min(26vw, 300px)" />
        </div>
      </div>
      {reward && <RewardModal result={reward} headline="てがみ、できたね!" onClose={() => backTo({ name: 'letters', focus: letter.id })} />}
    </div>
  );
}
