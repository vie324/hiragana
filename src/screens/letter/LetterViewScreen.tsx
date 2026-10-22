import { useEffect, useRef, useState } from 'react';
import { Btn, Emoji, TopBar } from '../../components/ui';
import Buddy from '../../components/Buddy';
import ParentGate from '../../components/ParentGate';
import LetterPaper from '../../components/letter/LetterPaper';
import { EnvelopeScene, sceneMetrics, type EnvStage } from '../../components/letter/Envelope';
import { renderLetterBlob } from '../../components/letter/letterImage';
import { PAPER_H, PAPER_W } from '../../data/letters';
import { fromLine, letterSlots, toLine } from '../../lib/letterLayout';
import { useLetter, type Letter } from '../../state/letters';
import { LETTER_PARENT_TEXT, confirmDeleteLetter, shareLetter } from '../parent/letterTools';
import { back, navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { setExtraSpeechNames, speak, stopSpeaking, wait } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { useAlive, usePortrait } from '../../lib/hooks';
import './letters.css';

/** よみあげ用 (♡ は よまない) */
const readable = (text: string) => text.replace(/♡/g, '').replace(/〜/g, 'ー').trim();

function useWidth(): number {
  const portrait = usePortrait();
  const calc = () => {
    const h = window.innerHeight - 110;
    const byH = (h - 24) / ((0.8 * PAPER_H) / PAPER_W);
    return Math.round(Math.max(240, Math.min(portrait ? window.innerWidth * 0.8 : window.innerWidth * 0.5, byH, 640)));
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

function View({ letter }: { letter: Letter }) {
  const alive = useAlive();
  const W = useWidth();
  const profileName = useApp((s) => s.profile.name);
  const [stage, setStage] = useState<EnvStage>('front');
  const [phase, setPhase] = useState<'closed' | 'opening' | 'open'>('closed');
  /** たたむ アニメーションの 画像 (undefined = つくっている、null = つくれなかった) */
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [gate, setGate] = useState<null | 'share' | 'delete'>(null);
  const [lit, setLit] = useState<ReadonlySet<string> | null>(null);
  const [reading, setReading] = useState(false);
  const [msg, setMsg] = useState('');
  const readToken = useRef(0);
  /** 画像が できる まえに タッチされた */
  const wantOpen = useRef(false);

  useEffect(() => {
    setExtraSpeechNames([letter.to, letter.from, profileName]);
    let url: string | null = null;
    void (async () => {
      const blob = await renderLetterBlob(letter, 1000, 'image/jpeg');
      if (!alive.current) return;
      url = blob ? URL.createObjectURL(blob) : null;
      setImage(url);
    })();
    void speak('ふうとうを タッチして ひらいてね。');
    return () => {
      setExtraSpeechNames([]);
      readToken.current++;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async () => {
    if (phase !== 'closed') return;
    if (image === undefined) {
      wantOpen.current = true;
      sfx.tap();
      return;
    }
    setPhase('opening');
    sfx.whoosh();
    const steps: [EnvStage, number][] = [
      ['closed', 0],
      ['inside', 650],
      ['above', 750],
      ['letter', 950],
    ];
    for (const [s, ms] of steps) {
      await wait(ms);
      if (!alive.current) return;
      if (s === 'inside') sfx.open();
      if (s === 'letter') sfx.sparkle();
      setStage(s);
    }
    await wait(1100);
    if (!alive.current) return;
    setPhase('open');
    void speak('よんで ほしい ときは、スピーカーを おしてね。');
  };

  useEffect(() => {
    if (image !== undefined && wantOpen.current) {
      wantOpen.current = false;
      void open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  const read = async () => {
    if (reading) {
      readToken.current++;
      stopSpeaking();
      setReading(false);
      setLit(null);
      return;
    }
    const my = ++readToken.current;
    setReading(true);
    const slots = letterSlots(letter);
    const parts: { text: string; prefix: string }[] = [
      ...(letter.to ? [{ text: toLine(letter.to), prefix: 't' }] : []),
      ...letter.lines.map((text, n) => ({ text, prefix: `b${n}.` })),
      ...(letter.from ? [{ text: fromLine(letter.from), prefix: 'f' }] : []),
    ];
    for (const p of parts) {
      if (readToken.current !== my || !alive.current) return;
      setLit(new Set(slots.filter((s) => s.key.startsWith(p.prefix) && s.key.slice(p.prefix.length).match(/^\d+$/)).map((s) => s.key)));
      const ok = await speak(readable(p.text));
      if (!ok || readToken.current !== my) break;
      await wait(250);
    }
    if (readToken.current !== my || !alive.current) return;
    setLit(null);
    setReading(false);
  };

  const share = async () => {
    setMsg('…');
    const m = await shareLetter(letter);
    if (alive.current) setMsg(m);
  };

  const remove = () => {
    if (confirmDeleteLetter(letter)) back();
  };

  return (
    <div className={`screen letter-screen letter-view phase-${phase}`}>
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>💌</Emoji> {letter.to ? `${letter.to}への てがみ` : 'てがみ'}
          </>
        }
      />
      <div className="lv-body">
        <div className="lv-stage">
          {phase === 'open' ? (
            <div className="lv-paper paper-frame" style={{ width: W * 0.8 }}>
              <LetterPaper letter={letter} lit={lit} />
            </div>
          ) : (
            <button
              className={`lv-scene ${phase === 'closed' ? 'tap-me' : ''}`}
              style={{
                transform:
                  stage === 'front' || stage === 'closed' ? `translateY(${-(sceneMetrics(W).envTop / 2).toFixed(0)}px)` : undefined,
              }}
              onClick={() => void open()}
              aria-label="ひらく"
              data-testid="open-letter"
            >
              <EnvelopeScene letter={letter} stage={stage} image={image ?? null} width={W} sealed stamped />
            </button>
          )}
        </div>
        {phase === 'open' && (
          <div className="lv-actions">
            <Btn color="yellow" className="lv-read" onClick={() => void read()} data-testid="read-letter">
              <Emoji>{reading ? '⏹️' : '🔊'}</Emoji> {reading ? 'とめる' : 'よむ'}
            </Btn>
            <Btn color="white" onClick={() => navigate({ name: 'letter', id: letter.id, step: 'deco' })} data-testid="redeco-letter">
              <Emoji>🎨</Emoji> かざる
            </Btn>
            <div className="lv-parent">
              <span className="lv-parent-label ui">{LETTER_PARENT_TEXT.label}</span>
              <Btn color="blue" className="ui" onClick={() => setGate('share')} data-testid="share-letter">
                <Emoji>📤</Emoji> {LETTER_PARENT_TEXT.share}
              </Btn>
              <button className="lv-delete ui" onClick={() => setGate('delete')} data-testid="delete-letter">
                <Emoji>🗑️</Emoji> {LETTER_PARENT_TEXT.remove}
              </button>
              {msg && <p className="lv-msg ui">{msg}</p>}
            </div>
            <div className="lv-buddy">
              <Buddy size="min(15vh, 11vw)" bubble="top" bubbleMax="min(24vw, 280px)" />
            </div>
          </div>
        )}
      </div>
      {gate && (
        <ParentGate
          onCancel={() => setGate(null)}
          onPass={() => {
            const g = gate;
            setGate(null);
            if (g === 'share') void share();
            else remove();
          }}
        />
      )}
    </div>
  );
}

/** おくった てがみを ひらいて よむ */
export default function LetterViewScreen({ id }: { id: string }) {
  const letter = useLetter(id);
  if (!letter) {
    return (
      <div className="screen letter-screen">
        <TopBar nav="back" />
      </div>
    );
  }
  return <View letter={letter} />;
}
