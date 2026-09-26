/**
 * 効果音と BGM (Web Audio API で その場で つくるので 音声ファイルは いらない)。
 * まえもって つくった 声 (src/voice/bank.ts) も ここの AudioContext で ならす。
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let voiceBus: GainNode | null = null;
let sfxEnabled = true;
let bgmEnabled = true;
let volume = 0.8;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.55;
  musicBus.connect(master);
  // 声は 効果音の 音量に かかわらず はっきり きこえるように する
  voiceBus = ctx.createGain();
  voiceBus.gain.value = 1;
  voiceBus.connect(ctx.destination);
  ctx.addEventListener('statechange', () => {
    if (ctx?.state === 'running' && bgmWanted && bgmEnabled && !bgmTimer) startBgm();
  });
  return ctx;
}

let keepAlive: HTMLAudioElement | null = null;

/** むおんの wav (Blob URL) */
function silentWavUrl(): string {
  const rate = 8000;
  const n = rate; // 1びょう
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/**
 * ふるい iPad (audioSession が ない) では、Web Audio の 音が 消音モードで きこえなくなる。
 * むおんの audio を ながしておくと 「さいせい」あつかいに なって、消音モードでも 声が きこえる。
 */
function keepPlaybackSession(): void {
  if (keepAlive || typeof Audio === 'undefined') return;
  try {
    const a = new Audio(silentWavUrl());
    a.loop = true;
    a.setAttribute('playsinline', '');
    keepAlive = a;
    void a.play().catch(() => (keepAlive = null));
    document.addEventListener('visibilitychange', () => {
      if (!keepAlive) return;
      if (document.hidden) keepAlive.pause();
      else void keepAlive.play().catch(() => undefined);
    });
  } catch {
    keepAlive = null;
  }
}

/** タップの 中で よぶ (iPad では これが ないと 音が でない) */
export function unlockAudio(): void {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = 'playback';
    else if (/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) keepPlaybackSession();
  } catch {
    /* noop */
  }
  const c = ensure();
  if (!c) return;
  if (c.state !== 'running') void c.resume();
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch {
    /* noop */
  }
}

/**
 * ろくおんした こえを ならす。Web Audio で ならすので、iPad の じどうさいせい せいげん を うけにくい。
 * @returns ならせたら true
 */
export async function playAudioData(data: ArrayBuffer): Promise<boolean> {
  const c = ensure();
  if (!c) return false;
  try {
    if (c.state !== 'running') await c.resume();
    const buf = await c.decodeAudioData(data.slice(0));
    return await new Promise<boolean>((resolve) => {
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.value = Math.max(0.4, volume) * 1.6;
      src.connect(g);
      g.connect(c.destination);
      src.onended = () => resolve(true);
      src.start();
    });
  } catch {
    return false;
  }
}

/** 声を ならす ための AudioContext と 出口 */
export function getAudioOut(): { ctx: AudioContext; voice: GainNode } | null {
  const c = ensure();
  return c && voiceBus ? { ctx: c, voice: voiceBus } : null;
}

/** iPad で バックグラウンドから もどったとき など、とまった 音を うごかす */
export function resumeAudio(): void {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined);
}

export function setSoundPrefs(p: { sfx?: boolean; bgm?: boolean; volume?: number }): void {
  if (p.sfx !== undefined) sfxEnabled = p.sfx;
  if (p.volume !== undefined) {
    volume = p.volume;
    if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }
  if (p.bgm !== undefined) {
    bgmEnabled = p.bgm;
    if (!bgmEnabled) stopBgm();
    else if (bgmWanted) startBgm();
  }
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  slideTo?: number;
  bus?: AudioNode | null;
}

function tone(freq: number, at: number, dur: number, o: ToneOpts = {}) {
  const c = ctx;
  const out = o.bus ?? master;
  if (!c || !out) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
  const peak = o.gain ?? 0.25;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(at: number, dur: number, o: { gain?: number; freq?: number; q?: number; sweepTo?: number } = {}) {
  const c = ctx;
  if (!c || !master) return;
  const t0 = c.currentTime + at;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(o.freq ?? 1500, t0);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t0 + dur);
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(o.gain ?? 0.3, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];

function play(fn: () => void) {
  if (!sfxEnabled) return;
  if (!ensure()) return;
  try {
    fn();
  } catch {
    /* noop */
  }
}

export const sfx = {
  tap: () => play(() => tone(880, 0, 0.08, { gain: 0.12 })),
  correct: () =>
    play(() => {
      tone(NOTE(76), 0, 0.18, { type: 'triangle', gain: 0.28 });
      tone(NOTE(79), 0.09, 0.18, { type: 'triangle', gain: 0.28 });
      tone(NOTE(84), 0.18, 0.35, { type: 'triangle', gain: 0.3 });
    }),
  wrong: () =>
    play(() => {
      tone(392, 0, 0.18, { gain: 0.18, slideTo: 330 });
      tone(330, 0.16, 0.25, { gain: 0.16, slideTo: 262 });
    }),
  pop: () =>
    play(() => {
      noise(0, 0.12, { gain: 0.5, freq: 2200, q: 0.8 });
      tone(700, 0, 0.12, { gain: 0.2, slideTo: 180 });
    }),
  sparkle: () =>
    play(() => {
      for (let i = 0; i < 6; i++) {
        tone(NOTE(PENTA[Math.floor(Math.random() * PENTA.length)] + 12), i * 0.06, 0.2, { gain: 0.08 });
      }
    }),
  fanfare: () =>
    play(() => {
      const mel: [number, number, number][] = [
        [72, 0, 0.14],
        [76, 0.14, 0.14],
        [79, 0.28, 0.14],
        [84, 0.42, 0.3],
        [79, 0.74, 0.12],
        [84, 0.88, 0.6],
      ];
      for (const [n, at, d] of mel) {
        tone(NOTE(n), at, d + 0.1, { type: 'square', gain: 0.07 });
        tone(NOTE(n), at, d + 0.15, { type: 'triangle', gain: 0.2 });
      }
      tone(NOTE(48), 0.88, 0.7, { type: 'triangle', gain: 0.2 });
    }),
  stroke: () =>
    play(() => {
      tone(NOTE(84), 0, 0.15, { gain: 0.14 });
      tone(NOTE(91), 0.05, 0.22, { gain: 0.1 });
    }),
  whoosh: () => play(() => noise(0, 0.35, { gain: 0.25, freq: 400, sweepTo: 2600, q: 1.2 })),
  sticker: () =>
    play(() => {
      tone(620, 0, 0.09, { gain: 0.2, slideTo: 900 });
      tone(1240, 0.07, 0.15, { gain: 0.14 });
    }),
  stamp: () =>
    play(() => {
      tone(140, 0, 0.18, { gain: 0.5, slideTo: 60 });
      noise(0, 0.08, { gain: 0.3, freq: 800 });
    }),
  hop: () => play(() => tone(380, 0, 0.14, { gain: 0.16, slideTo: 760 })),
  open: () =>
    play(() => {
      for (let i = 0; i < 5; i++) tone(NOTE(72 + i * 3), i * 0.05, 0.16, { type: 'triangle', gain: 0.15 });
    }),
  locked: () => play(() => tone(260, 0, 0.12, { type: 'triangle', gain: 0.14 })),
  /** れんぞく せいかい: かずが ふえるほど たかい おと */
  combo: (n: number) =>
    play(() => {
      const base = 72 + Math.min(12, (n - 2) * 2);
      [0, 4, 7, 12].forEach((d, i) => tone(NOTE(base + d), i * 0.045, 0.16, { type: 'triangle', gain: 0.12 }));
    }),
  levelUp: () =>
    play(() => {
      const mel: [number, number, number][] = [
        [67, 0, 0.1],
        [72, 0.1, 0.1],
        [76, 0.2, 0.1],
        [79, 0.3, 0.1],
        [84, 0.4, 0.18],
        [88, 0.62, 0.12],
        [91, 0.76, 0.7],
      ];
      for (const [n, at, d] of mel) {
        tone(NOTE(n), at, d + 0.15, { type: 'triangle', gain: 0.2 });
        tone(NOTE(n + 12), at, d + 0.1, { gain: 0.05 });
      }
      tone(NOTE(48), 0.76, 0.8, { type: 'triangle', gain: 0.18 });
      tone(NOTE(55), 0.76, 0.8, { type: 'triangle', gain: 0.12 });
    }),
  water: () =>
    play(() => {
      for (let i = 0; i < 7; i++) tone(NOTE(PENTA[(i * 3) % PENTA.length] + 7), i * 0.09, 0.12, { gain: 0.09, slideTo: NOTE(PENTA[(i * 3) % PENTA.length] + 12) });
      noise(0, 0.6, { gain: 0.06, freq: 3000, q: 0.6 });
    }),
  chest: () =>
    play(() => {
      tone(180, 0, 0.12, { gain: 0.25, slideTo: 90 });
      for (let i = 0; i < 8; i++) tone(NOTE(PENTA[i] + 12), 0.12 + i * 0.05, 0.22, { gain: 0.08 });
    }),
};

/* ---------------- BGM: オルゴールふうの ちいさな きょく ---------------- */

// [音, 拍] (8分音符 = 1拍)
const MELODY: [number | null, number][] = [
  [72, 1], [76, 1], [79, 1], [76, 1], [77, 1], [81, 1], [79, 2],
  [76, 1], [79, 1], [84, 1], [79, 1], [81, 1], [79, 1], [76, 2],
  [74, 1], [77, 1], [81, 1], [77, 1], [79, 1], [76, 1], [72, 2],
  [74, 1], [76, 1], [77, 1], [74, 1], [72, 2], [null, 2],
];
const BASS: number[] = [48, 53, 48, 53, 50, 48, 55, 48];
const BEAT = 0.3;

let bgmWanted = false;
let bgmTimer: ReturnType<typeof setInterval> | undefined;
let nextTime = 0;
let noteIndex = 0;
let beatCount = 0;

function scheduleBgm() {
  const c = ctx;
  if (!c || !musicBus) return;
  while (nextTime < c.currentTime + 0.6) {
    const [n, len] = MELODY[noteIndex];
    const at = nextTime - c.currentTime;
    if (n !== null) {
      tone(NOTE(n + 12), at, BEAT * len + 0.5, { gain: 0.07, bus: musicBus });
      tone(NOTE(n), at, BEAT * len + 0.3, { type: 'triangle', gain: 0.03, bus: musicBus });
    }
    if (beatCount % 4 === 0) {
      const bar = Math.floor(beatCount / 4) % BASS.length;
      tone(NOTE(BASS[bar]), at, BEAT * 3.5, { type: 'triangle', gain: 0.06, bus: musicBus });
    }
    nextTime += BEAT * len;
    beatCount += len;
    noteIndex = (noteIndex + 1) % MELODY.length;
    if (noteIndex === 0) beatCount = 0;
  }
}

export function startBgm(): void {
  bgmWanted = true;
  if (!bgmEnabled || bgmTimer) return;
  const c = ensure();
  if (!c || c.state !== 'running') return;
  nextTime = c.currentTime + 0.1;
  noteIndex = 0;
  beatCount = 0;
  if (musicBus) musicBus.gain.setTargetAtTime(0.55, c.currentTime, 0.3);
  bgmTimer = setInterval(scheduleBgm, 150);
  scheduleBgm();
}

export function stopBgm(): void {
  bgmWanted = false;
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = undefined;
}

/** BGM を ながしたいかどうかを 画面ごとに せってい する */
export function wantBgm(on: boolean): void {
  if (on) startBgm();
  else stopBgm();
}

/** よみあげ中は BGM を ちいさく する (main.tsx で よみあげと つなぐ) */
export function duckBgm(speaking: boolean): void {
  if (!ctx || !musicBus) return;
  musicBus.gain.setTargetAtTime(speaking ? 0.15 : 0.55, ctx.currentTime, 0.12);
}
