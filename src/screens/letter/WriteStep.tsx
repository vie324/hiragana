import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Buddy from '../../components/Buddy';
import type { Mood } from '../../components/Mascot';
import { Btn, Emoji, TopBar } from '../../components/ui';
import WritingPad, { type PadMode, type PadResult } from '../../components/WritingPad';
import StrokeOrder from '../../components/StrokeOrder';
import LetterPaper from '../../components/letter/LetterPaper';
import { InkGlyph } from '../../components/letter/InkWord';
import { fromLine, letterSlots, toLine, type Slot } from '../../lib/letterLayout';
import { isKana } from '../../lib/kana';
import { inkOf, roundStrokes, setLetterInk, type Letter, type Strokes } from '../../state/letters';
import { addSample, bestSample, round } from '../../state/gallery';
import { recordWriting } from '../../state/actions';
import { navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { speak } from '../../lib/speech';
import { speakAfterCurrent } from '../../lib/session';
import { sfx } from '../../lib/sound';
import { burst, celebrate } from '../../lib/confetti';
import { useAlive, usePortrait } from '../../lib/hooks';
import { L, WRITE_MODE_SAY } from '../../voice/lines';
import '../write.css';
import './letters.css';

const MODES: { mode: PadMode; emoji: string; label: string; say: string }[] = [
  { mode: 'trace', emoji: '🐾', label: 'なぞる', say: WRITE_MODE_SAY.trace },
  { mode: 'faint', emoji: '👻', label: 'うすい', say: WRITE_MODE_SAY.faint },
  { mode: 'blank', emoji: '✨', label: 'みないで', say: WRITE_MODE_SAY.blank },
];

interface FlightData {
  id: number;
  slot: Slot;
  strokes: Strokes;
  from: DOMRect;
}

/** かいた もじが てがみの マスへ とんでいく */
function Flight({
  f,
  letter,
  target,
  onLand,
}: {
  f: FlightData;
  letter: Letter;
  target: () => DOMRect | null;
  onLand: (f: FlightData, to: DOMRect | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const land = useRef(onLand);
  land.current = onLand;
  useLayoutEffect(() => {
    const el = ref.current;
    const to = target();
    if (!el || !to || typeof el.animate !== 'function') {
      land.current(f, to);
      return;
    }
    const k = to.width / f.from.width;
    const dx = to.left - f.from.left;
    const dy = to.top - f.from.top;
    const a = el.animate(
      [
        { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(${(1 + k) / 2}) rotate(-10deg)`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(0deg)` },
      ],
      { duration: 760, easing: 'cubic-bezier(0.45, 0.05, 0.35, 1)', fill: 'forwards' },
    );
    a.onfinish = () => land.current(f, to);
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="lw-flight" style={{ left: f.from.left, top: f.from.top, width: f.from.width, height: f.from.height }}>
      <InkGlyph strokes={f.strokes} letter={letter} ch={f.slot.ch} />
    </div>
  );
}

/** 要素の はば (ことばの ならびの おおきさを きめる) */
function useWidthOf(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** かく: おおきく かいた もじが そのまま てがみに なる */
export default function WriteStep({ letter }: { letter: Letter }) {
  const alive = useAlive();
  const settings = useApp((s) => s.settings);
  const portrait = usePortrait();
  const slots = useMemo(() => letterSlots(letter), [letter.to, letter.lines, letter.from]);
  const missing = slots.filter((s) => !inkOf(letter, s));
  const [current, setCurrent] = useState<string | null>(() => missing[0]?.key ?? null);
  const slot = slots.find((s) => s.key === current) ?? null;
  const [mode, setMode] = useState<PadMode>('trace');
  const [resetKey, setResetKey] = useState(0);
  const [hintKey, setHintKey] = useState(0);
  const [demo, setDemo] = useState(0);
  const [mood, setMood] = useState<Mood>('normal');
  const [flights, setFlights] = useState<FlightData[]>([]);
  const flying = useMemo(() => new Set(flights.map((f) => f.slot.key)), [flights]);
  const paperRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLButtonElement>(null);
  const flightId = useRef(0);
  // もう かきおわっている てがみ (もどってきた とき) は おいわい しない
  const celebrated = useRef(missing.length === 0);
  const centerRef = useRef<HTMLDivElement>(null);
  const centerW = useWidthOf(centerRef);

  const sample = slot && !inkOf(letter, slot) ? bestSample(slot.ch) : null;
  const practicable = missing.filter((s) => !flying.has(s.key) && bestSample(s.ch));
  const allDone = missing.length === 0 && flights.length === 0;

  useEffect(() => {
    if (slot) void speakAfterCurrent(L.letterWrite(slot.ch));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ぜんぶ かけたら おいわい
  useEffect(() => {
    if (!allDone || celebrated.current) return;
    celebrated.current = true;
    setCurrent(null);
    setMood('cheer');
    sfx.fanfare();
    celebrate();
    void speak('やったあ! てがみが かけたね! つぎは かざろう!');
  }, [allDone]);

  const cellRect = (key: string): DOMRect | null =>
    paperRef.current?.querySelector(`[data-slot="${key}"]`)?.getBoundingClientRect() ?? null;

  /** つぎに かく マス (いまの つぎから、なければ はじめから) */
  const nextMissing = (after: string | null, written: Set<string>): Slot | null => {
    const todo = (s: Slot) => !written.has(s.key) && !inkOf(letter, s) && !flying.has(s.key);
    const i = after ? slots.findIndex((s) => s.key === after) : -1;
    return slots.slice(i + 1).find(todo) ?? slots.slice(0, i + 1).find(todo) ?? null;
  };

  const launch = (s: Slot, strokes: Strokes, from: DOMRect | null | undefined, practice: boolean) => {
    setLetterInk(letter.id, s, strokes, practice);
    if (!from) return;
    sfx.whoosh();
    setFlights((fs) => [...fs, { id: ++flightId.current, slot: s, strokes, from }]);
  };

  const onLand = (f: FlightData, to: DOMRect | null) => {
    if (!alive.current) return;
    setFlights((fs) => fs.filter((x) => x.id !== f.id));
    sfx.sticker();
    if (to) burst({ x: to.left + to.width / 2, y: to.top + to.height / 2, count: 14, power: 320, spread: Math.PI * 2 });
  };

  const goNext = (from: Slot, written: Set<string>) => {
    const nx = nextMissing(from.key, written);
    setCurrent(nx?.key ?? null);
    setResetKey((k) => k + 1);
    setMood('happy');
    if (nx) void speak(L.letterNext(nx.ch));
  };

  const onComplete = (r: PadResult) => {
    if (!slot) return;
    const strokes = roundStrokes(r.strokes);
    if (isKana(slot.ch)) {
      recordWriting(slot.ch, r.stars);
      addSample(slot.ch, { at: Date.now(), stars: r.stars, strokes: round(r.strokes) });
    }
    sfx.correct();
    launch(slot, strokes, padRef.current?.querySelector('svg')?.getBoundingClientRect(), false);
    goNext(slot, new Set([slot.key]));
  };

  const takePractice = () => {
    if (!slot || !sample) return;
    launch(slot, sample.strokes, practiceRef.current?.querySelector('svg')?.getBoundingClientRect(), true);
    void speak('れんしゅうした もじを つかうね!');
    const nx = nextMissing(slot.key, new Set([slot.key]));
    setCurrent(nx?.key ?? null);
    setResetKey((k) => k + 1);
  };

  const fillPractice = () => {
    const list = practicable;
    if (!list.length) return;
    sfx.sparkle();
    void speak('れんしゅうした もじを いれるよ!');
    const from = fillRef.current?.getBoundingClientRect();
    const written = new Set(list.map((s) => s.key));
    list.forEach((s, i) => {
      setTimeout(() => {
        if (!alive.current) return;
        const smp = bestSample(s.ch);
        if (smp) launch(s, smp.strokes, from && new DOMRect(from.left + from.width / 2 - 40, from.top, 80, 80), true);
      }, i * 160);
    });
    if (slot && written.has(slot.key)) {
      const nx = nextMissing(slot.key, written);
      setCurrent(nx?.key ?? null);
      setResetKey((k) => k + 1);
    }
  };

  const select = (key: string) => {
    const s = slots.find((x) => x.key === key);
    if (!s || flying.has(key)) return;
    sfx.tap();
    setCurrent(key);
    setResetKey((k) => k + 1);
    setMood('normal');
    void speak(L.letterWrite(s.ch));
  };

  const changeMode = (m: PadMode) => {
    sfx.tap();
    setMode(m);
    void speak(MODES.find((x) => x.mode === m)!.say);
  };

  // いま かいている ぎょう (ことばの なかの どこか わかるように)
  const group = current ? current.replace(/\d+$/, '') : null;
  const lineText = !group
    ? ''
    : group === 't'
      ? toLine(letter.to)
      : group === 'f'
        ? fromLine(letter.from)
        : (letter.lines[Number(group.slice(1, -1))] ?? '');
  const padSize = portrait ? 'min(100%, 54vh)' : 'min(100%, 58vh)';
  const written = slots.length - missing.length;
  const lineLen = [...lineText].length;
  const tile = Math.max(26, Math.min(54, Math.floor(((centerW || 460) - 6 * (lineLen - 1)) / Math.max(1, lineLen))));

  return (
    <div className="screen letter-screen letter-write write-screen">
      <TopBar
        nav="back"
        right={
          <div className="lw-progress" data-testid="write-progress" data-done={written} data-total={slots.length}>
            <Emoji>✏️</Emoji> {written}/{slots.length}
          </div>
        }
      >
        <div className="write-modes">
          {MODES.map((m) => (
            <button
              key={m.mode}
              className={`mode-btn ${mode === m.mode ? 'on' : ''}`}
              onClick={() => changeMode(m.mode)}
              data-testid={`mode-${m.mode}`}
            >
              <Emoji>{m.emoji}</Emoji>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </TopBar>
      <div className="lw-body">
        <div className="lw-paper paper-frame" ref={paperRef}>
          <LetterPaper letter={letter} mode="write" current={current} hidden={flying} onCell={select} />
        </div>
        <div className="lw-center" ref={centerRef}>
          {slot ? (
            <>
              <div className="lw-strip" data-testid="write-strip" style={{ ['--tile' as string]: `${tile}px` }}>
                {[...lineText].map((ch, i) => {
                  const key = `${group}${i}`;
                  if (ch === ' ') return <span key={key} className="lw-gap" />;
                  const s = slots.find((x) => x.key === key);
                  const e = s ? inkOf(letter, s) : null;
                  return (
                    <span key={key} className={`lw-tile ${key === current ? 'now' : e && !flying.has(key) ? 'done' : ''}`}>
                      {e && !flying.has(key) && key !== current ? <InkGlyph strokes={e.ink} letter={letter} ch={ch} /> : ch}
                    </span>
                  );
                })}
              </div>
              <div className="write-pad-wrap lw-pad" ref={padRef} style={{ width: padSize }}>
                <WritingPad
                  kana={slot.ch}
                  mode={mode}
                  level={settings.writeLevel}
                  finger={settings.finger}
                  resetKey={resetKey}
                  hintKey={hintKey}
                  onComplete={onComplete}
                  onStroke={(_i, r) => {
                    if (!r.ok) {
                      setMood('think');
                      void speak(
                        r.reason === 'reverse'
                          ? 'かく むきが はんたいだよ。'
                          : r.reason === 'start'
                            ? 'みどりの まるから かいてね。'
                            : 'おしい! もういちど。',
                      );
                    } else setMood('normal');
                  }}
                />
                {demo > 0 && (
                  <div className="write-demo" onClick={() => setDemo(0)}>
                    <StrokeOrder kana={slot.ch} playKey={demo} onDone={() => setTimeout(() => alive.current && setDemo(0), 900)} />
                  </div>
                )}
              </div>
              <div className="lw-buddy">
                <Buddy size="min(11vh, 8vw)" bubble="right" mood={mood} bubbleMax="min(30vw, 360px)" />
              </div>
            </>
          ) : (
            <div className="lw-done pop-in" data-testid="write-done">
              <div className="lw-done-title">
                <Emoji>🎉</Emoji> できた!
              </div>
              <p>すてきな てがみに なったね</p>
              <Btn
                color="pink"
                className="pulse lw-deco-btn"
                onClick={() => navigate({ name: 'letter', id: letter.id, step: 'deco' })}
                data-testid="write-deco"
              >
                <Emoji>🎨</Emoji> かざろう!
              </Btn>
              <small>もじを タッチすると かきなおせるよ</small>
            </div>
          )}
        </div>
        <div className="lw-side">
          {slot && (
            <>
              <Btn color="yellow" round size={76} aria-label="かきじゅん" onClick={() => setDemo((d) => d + 1)} data-testid="demo">
                <Emoji>▶️</Emoji>
              </Btn>
              <Btn color="white" round size={76} aria-label="ヒント" onClick={() => setHintKey((h) => h + 1)}>
                <Emoji>💡</Emoji>
              </Btn>
              <Btn color="white" round size={76} aria-label="やりなおし" onClick={() => setResetKey((k) => k + 1)} data-testid="again">
                <Emoji>🔄</Emoji>
              </Btn>
            </>
          )}
          {sample && slot && (
            <div className="lw-practice pop-in" ref={practiceRef} key={slot.key}>
              <span className="lw-practice-label">まえに かいた</span>
              <InkGlyph strokes={sample.strokes} letter={letter} ch={slot.ch} className="lw-practice-ink" />
              <Btn color="blue" onClick={takePractice} data-testid="use-practice">
                つかう
              </Btn>
            </div>
          )}
          {practicable.length > 1 && slot && (
            <button className="lw-fill" ref={fillRef} onClick={fillPractice} data-testid="fill-practice">
              <Emoji>📦</Emoji>
              <span>
                <b>れんしゅうした もじ</b>
                <small>ぜんぶ いれる ({practicable.length})</small>
              </span>
            </button>
          )}
          {!slot && (
            <div className="lw-buddy">
              <Buddy size="min(16vh, 11vw)" bubble="none" mood={mood} />
            </div>
          )}
        </div>
      </div>
      {flights.map((f) => (
        <Flight key={f.id} f={f} letter={letter} target={() => cellRect(f.slot.key)} onLand={onLand} />
      ))}
    </div>
  );
}
