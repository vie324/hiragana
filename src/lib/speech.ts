/**
 * よみあげ。まえもって つくった 声 (src/voice/bank.ts) が あれば それを ならし、
 * ない ぶん (こどもの なまえ など) は Web Speech API で よむ。
 * iPad Safari の くせ に 対応している:
 *  - さいしょの よみあげは タップの 中で よぶ必要がある
 *  - onend が こないことが あるので タイマーで ほけんを かける
 *  - utterance が GC されると イベントが こないので 参照を もっておく
 */

export interface VoicePrefs {
  voiceURI: string | null;
  rate: number;
  pitch: number;
}

import { planVoice, playClip, prepareClips, type Part } from '../voice/bank';

type Listener = (speaking: boolean) => void;

const synth: SpeechSynthesis | undefined =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;

let voices: SpeechSynthesisVoice[] = [];
let prefs: VoicePrefs = { voiceURI: null, rate: 0.9, pitch: 1.1 };
const listeners = new Set<Listener>();
const captionListeners = new Set<(text: string | null) => void>();
const keep = new Set<SpeechSynthesisUtterance>();
let currentId = 0;
let speaking = false;
let cancelCurrent: (() => void) | null = null;
let caption: string | null = null;
const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff]/;
let captionTimer: ReturnType<typeof setTimeout> | undefined;
/** iPad で よみあげを つかえるように する ための むおんの よみあげ中 */
let unlocking = false;
let unlockState: 'no' | 'trying' | 'yes' = 'no';

/**
 * タップ (click) の なかで むおんの よみあげを して、iPad の よみあげを つかえるように する。
 * まえもって つくった 声の あとに なまえだけ よむ ときも、タップの そとで よめるように なる。
 * iPad が ほんとうに よんだ (onstart/onend が きた) ときだけ おわりに して、だめなら つぎの タップで もういちど。
 */
export function unlockSpeech(): void {
  if (unlockState !== 'no' || !synth) return;
  // もう なにか よんでいるなら つかえる
  if (synth.speaking || synth.pending) {
    unlockState = 'yes';
    return;
  }
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.lang = 'ja-JP';
    u.volume = 0;
    const ok = () => {
      unlockState = 'yes';
      unlocking = false;
      keep.delete(u);
    };
    u.onstart = ok;
    u.onend = ok;
    u.onerror = () => {
      unlocking = false;
      keep.delete(u);
      if (unlockState === 'trying') unlockState = 'no';
    };
    keep.add(u);
    unlockState = 'trying';
    unlocking = true;
    synth.speak(u);
    setTimeout(() => {
      unlocking = false;
      if (unlockState === 'trying') unlockState = 'no';
    }, 1500);
  } catch {
    unlocking = false;
    unlockState = 'no';
  }
}

/** まえもって つくれない なまえ (こどもの よびかた・あいぼうの なまえ) */
let dynamicNames: string[] = [];

export function setSpeechNames(names: readonly string[]): void {
  dynamicNames = names.filter(Boolean);
}

function setSpeaking(v: boolean) {
  if (speaking === v) return;
  speaking = v;
  listeners.forEach((l) => l(v));
}

function setCaption(text: string | null) {
  clearTimeout(captionTimer);
  caption = text;
  captionListeners.forEach((l) => l(text));
}

function loadVoices() {
  if (!synth) return;
  try {
    voices = synth.getVoices();
  } catch {
    voices = [];
  }
}

export function initSpeech(): void {
  if (!synth) return;
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
  let tries = 0;
  const t = setInterval(() => {
    loadVoices();
    if (jaVoices().length || ++tries > 40) clearInterval(t);
  }, 250);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSpeaking();
  });
}

export function jaVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
}

function voiceScore(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (/premium|enhanced|拡張|プレミアム|高品質/i.test(v.name)) s += 10;
  if (/kyoko|o-ren|hattori|otoya|nanami|haruka|ayumi/i.test(v.name)) s += 3;
  if (v.localService) s += 1;
  return s;
}

export function pickVoice(): SpeechSynthesisVoice | null {
  const ja = jaVoices();
  if (!ja.length) return null;
  if (prefs.voiceURI) {
    const v = ja.find((x) => x.voiceURI === prefs.voiceURI);
    if (v) return v;
  }
  return ja.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

export function setVoicePrefs(p: Partial<VoicePrefs>): void {
  prefs = { ...prefs, ...p };
}

export function getVoicePrefs(): VoicePrefs {
  return prefs;
}

export function isSpeaking(): boolean {
  return speaking;
}

export function onSpeakingChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getCaption(): string | null {
  return caption;
}

export function onCaptionChange(l: (text: string | null) => void): () => void {
  captionListeners.add(l);
  return () => captionListeners.delete(l);
}

/** よみあげに かかる じかんの めやす (ミリ秒) */
export function estimateMs(text: string, rate = prefs.rate): number {
  const chars = [...text.replace(/[\s、。！？!?「」『』・]/g, '')].length;
  const pauses = (text.match(/[、。！？!?]/g) ?? []).length;
  return Math.max(500, (chars * 170 + pauses * 250) / Math.max(0.3, rate));
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  /** ふきだしに だす テキスト (よみあげとは べつに したいとき) */
  caption?: string | null;
}

/**
 * よみあげる。まえの よみあげは とめる。
 * @returns さいごまで よめたら true、とちゅうで とめられたら false
 */
export function speak(text: string, opts: SpeakOptions = {}): Promise<boolean> {
  // さきに id を すすめて、まえの よみあげの おわりで「しゃべっていない」と しらせないようにする
  const id = ++currentId;
  if (cancelCurrent) cancelCurrent();
  const rate = opts.rate ?? prefs.rate;
  const pitch = opts.pitch ?? prefs.pitch;
  // ふきだしには ひらがなだけを だす (よみあげ用の 漢字は みせない)
  const shown = opts.caption === undefined ? (KANJI.test(text) ? null : text) : opts.caption;
  if (typeof window !== 'undefined') {
    window.__HIRAGANA_SPOKEN__?.push(text);
  }

  const plan = planVoice(text, dynamicNames, !(typeof window !== 'undefined' && window.__HIRAGANA_FAST_SPEECH__));
  if (typeof window !== 'undefined' && window.__HIRAGANA_VOICE_MISSES__ && !plan) window.__HIRAGANA_VOICE_MISSES__.push(text);

  return new Promise<boolean>((resolve) => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopPart: (() => void) | null = null;
    const finish = (completed: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (!completed) stopPart?.();
      if (id === currentId) {
        cancelCurrent = null;
        setSpeaking(false);
        // ふきだしは すこし のこす
        clearTimeout(captionTimer);
        captionTimer = setTimeout(() => {
          if (id === currentId) setCaption(null);
        }, 1200);
      }
      resolve(completed);
    };
    cancelCurrent = () => finish(false);
    setSpeaking(true);
    setCaption(shown ?? null);

    const fast = typeof window !== 'undefined' && window.__HIRAGANA_FAST_SPEECH__;
    if (fast) {
      timer = setTimeout(() => finish(true), 20);
      return;
    }
    if (plan) {
      void playParts(plan, rate, pitch, () => done, (stop) => (stopPart = stop)).then((ok) => finish(ok));
      return;
    }
    void ttsSpeak(text, rate, pitch, (stop) => (stopPart = stop)).then((ok) => finish(ok));
  });
}

const NAME_PITCH = 1.35;

/** まえもって つくった 声と (なまえだけ) iPad の 声を じゅんばんに ならす */
async function playParts(
  parts: readonly Part[],
  rate: number,
  pitch: number,
  cancelled: () => boolean,
  setStop: (stop: () => void) => void,
): Promise<boolean> {
  prepareClips(parts);
  for (let i = 0; i < parts.length; i++) {
    if (cancelled()) return false;
    const p = parts[i];
    let ok: boolean;
    if ('clip' in p) {
      const c = playClip(p.clip);
      setStop(c.stop);
      const r = await c.done;
      // ならせなかった ときは iPad の 声で よむ
      ok = r === 'failed' ? !cancelled() && (await ttsSpeak(p.clip, rate, pitch, setStop)) : r === 'ok';
    } else {
      // なまえは ずんだもんの 声に ちかづけるため たかめに よむ
      ok = await ttsSpeak(p.tts, rate, Math.max(pitch, NAME_PITCH), setStop);
    }
    if (!ok || cancelled()) return false;
    if (i < parts.length - 1) await wait(70);
  }
  return true;
}

/** Web Speech API で よむ。setStop に とめる ための かんすうを わたす */
function ttsSpeak(text: string, rate: number, pitch: number, setStop: (stop: () => void) => void): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (completed: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(completed);
    };
    setStop(() => {
      finish(false);
      try {
        synth?.cancel();
      } catch {
        /* noop */
      }
    });

    if (synth && !voices.length) loadVoices();
    const voice = pickVoice();
    // こえの リストが まだ よみこまれていない (iPad の きどうちょくご) ときは
    // lang だけ しめして よむ。日本語の こえが ない 環境では じかんだけ まつ。
    const noJapanese = voices.length > 0 && !voice;
    if (!synth || noJapanese) {
      timer = setTimeout(() => finish(true), estimateMs(text, rate));
      return;
    }

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;
    keep.add(u);
    const cleanup = () => keep.delete(u);
    u.onend = () => {
      cleanup();
      finish(true);
    };
    u.onerror = () => {
      cleanup();
      finish(false);
    };
    timer = setTimeout(() => {
      cleanup();
      finish(true);
    }, estimateMs(text, rate) * 1.6 + 2500);

    const run = () => {
      if (done) return;
      try {
        synth.resume();
        synth.speak(u);
      } catch {
        finish(false);
      }
    };
    // むおんの よみあげ (unlockSpeech) の あとは とめずに つづけて よむ
    if ((synth.speaking || synth.pending) && !unlocking) {
      synth.cancel();
      setTimeout(run, 80);
    } else {
      run();
    }
  });
}

export function stopSpeaking(): void {
  if (cancelCurrent) cancelCurrent();
  currentId++;
  setSpeaking(false);
  setCaption(null);
  try {
    synth?.cancel();
  } catch {
    /* noop */
  }
}

/**
 * いくつかを じゅんばんに よむ。onPart で いま よんでいる番号を しらせる。
 * とちゅうで ほかの よみあげが はじまったら false。
 */
export async function speakSequence(
  parts: readonly string[],
  opts: SpeakOptions & { gapMs?: number; onPart?: (i: number) => void } = {},
): Promise<boolean> {
  for (let i = 0; i < parts.length; i++) {
    opts.onPart?.(i);
    const ok = await speak(parts[i], opts);
    if (!ok) return false;
    const mine = currentId;
    if (opts.gapMs && i < parts.length - 1) await wait(opts.gapMs);
    // まっている あいだに ほかの よみあげが はじまったら やめる
    if (currentId !== mine) return false;
  }
  return true;
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
