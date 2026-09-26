/**
 * まえもって つくった 声 (VOICEVOX) を ならす。
 * public/voice/<slug>/index.json に ぶん → パックの なかの いち が かいてある。
 * パックは さいしょに まとめて よみこみ、ならす ときに 1ぶんずつ デコードする。
 */
import { getAudioOut } from '../lib/sound';
import { isTinyFragment, splitNames, splitSentences, voiceKey } from './split';

interface VoiceIndex {
  v: number;
  voice: { slug: string; name: string; style: string; credit: string };
  packs: { file: string; bytes: number }[];
  /** キー → [パック, はじまり, ながさ, ミリ秒] */
  clips: Record<string, [number, number, number, number]>;
}

export interface VoiceInfo {
  slug: string;
  name: string;
  style: string;
  credit: string;
}

/** アプリに はいっている 声 */
export const VOICES: VoiceInfo[] = [{ slug: 'zundamon', name: 'ずんだもん', style: 'ノーマル', credit: 'VOICEVOX:ずんだもん' }];

export type Part = { clip: string; ms: number } | { tts: string };

let index: VoiceIndex | null = null;
let slug: string | null = null;
let packs: (ArrayBuffer | null)[] = [];
let packLoads: Promise<void> | null = null;
let gen = 0;
const decoded = new Map<string, Promise<AudioBuffer | null>>();
const MAX_DECODED = 60;
const readyListeners = new Set<() => void>();

const url = (file: string) => `${import.meta.env.BASE_URL}voice/${slug}/${file}`;

/** 声を きりかえる (null = iPad の 声だけ)。パックは うしろで よみこむ */
export async function loadVoice(next: string | null, opts: { packs?: boolean } = {}): Promise<boolean> {
  if (next === slug && index) {
    if (opts.packs !== false) void loadPacks();
    return true;
  }
  const my = ++gen;
  slug = next;
  index = null;
  packs = [];
  packLoads = null;
  decoded.clear();
  notify();
  if (!next) return false;
  try {
    const res = await fetch(url('index.json'));
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as VoiceIndex;
    if (my !== gen) return false;
    index = data;
    packs = data.packs.map(() => null);
    notify();
    if (opts.packs !== false) void loadPacks();
    return true;
  } catch {
    return false;
  }
}

function loadPacks(): Promise<void> {
  if (packLoads || !index) return packLoads ?? Promise.resolve();
  const my = gen;
  const list = index.packs;
  packLoads = (async () => {
    // ちいさい パック (よく つかう セリフ) から じゅんばんに
    for (let i = 0; i < list.length; i++) {
      if (my !== gen) return;
      for (let attempt = 0; attempt < 3 && !packs[i]; attempt++) {
        try {
          const res = await fetch(url(list[i].file));
          if (!res.ok) throw new Error(String(res.status));
          const buf = await res.arrayBuffer();
          if (my !== gen) return;
          packs[i] = buf;
          notify();
          keepOffline(url(list[i].file), buf);
        } catch {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
    }
  })();
  return packLoads;
}

/**
 * はじめて ひらいた ときは Service Worker が まだ うごいていないので、
 * パックを じぶんで キャッシュに いれて つぎから オフラインでも つかえるように する。
 */
function keepOffline(href: string, buf: ArrayBuffer) {
  if (!import.meta.env.PROD || typeof caches === 'undefined' || navigator.serviceWorker?.controller) return;
  const req = new URL(href, location.href).href;
  void caches
    .open('hiragana-voice')
    .then((c) => c.put(req, new Response(buf.slice(0), { headers: { 'Content-Type': 'application/octet-stream' } })))
    .catch(() => undefined);
}

function notify() {
  readyListeners.forEach((l) => l());
}

export function onVoiceChange(l: () => void): () => void {
  readyListeners.add(l);
  return () => readyListeners.delete(l);
}

export function currentVoice(): VoiceInfo | null {
  return index ? { ...index.voice } : null;
}

/** すべての パックを よみこんだか (0〜1) */
export function voiceProgress(): number {
  if (!index) return 0;
  const total = index.packs.reduce((a, p) => a + p.bytes, 0) || 1;
  return index.packs.reduce((a, p, i) => a + (packs[i] ? p.bytes : 0), 0) / total;
}

function clipOf(key: string): [number, number, number, number] | undefined {
  return index?.clips[key];
}

/**
 * テキストを 声の ファイルと (なまえだけ) iPad の 声 に わける。
 * ひとつでも ない ぶんが あれば null (まるごと iPad の 声で よむ)。
 * needPacks: パックが まだ よみこめていない ときも null
 */
export function planVoice(text: string, names: readonly string[], needPacks = true): Part[] | null {
  if (!index) return null;
  const out: Part[] = [];
  const pushTts = (t: string) => {
    const last = out[out.length - 1];
    if (last && 'tts' in last) last.tts += t;
    else out.push({ tts: t });
  };
  const pushClip = (text: string): boolean => {
    const c = clipOf(voiceKey(text));
    if (!c || (needPacks && !packs[c[0]])) return false;
    out.push({ clip: voiceKey(text), ms: c[3] });
    return true;
  };
  for (const s of splitSentences(text)) {
    if (pushClip(s)) continue;
    const pieces = splitNames(s, names);
    if (!pieces.some((p) => 'name' in p)) return null;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if ('name' in p) pushTts(p.name);
      else if (!pushClip(p.text)) {
        // なまえに くっついた「も」「と」などは なまえと いっしょに よむ
        if (!isTinyFragment(p.text)) return null;
        pushTts(p.text);
      }
    }
  }
  return out.length ? out : null;
}

function decode(key: string): Promise<AudioBuffer | null> {
  const hit = decoded.get(key);
  if (hit) {
    decoded.delete(key);
    decoded.set(key, hit);
    return hit;
  }
  const out = getAudioOut();
  const c = clipOf(key);
  const pack = c ? packs[c[0]] : null;
  if (!out || !c || !pack) return Promise.resolve(null);
  const p = out.ctx.decodeAudioData(pack.slice(c[1], c[1] + c[2])).catch(() => null);
  decoded.set(key, p);
  while (decoded.size > MAX_DECODED) decoded.delete(decoded.keys().next().value!);
  return p;
}

/** つぎに ならす ぶんを さきに デコードしておく */
export function prepareClips(parts: readonly Part[]): void {
  for (const p of parts) if ('clip' in p) void decode(p.clip);
}

/**
 * 1ぶん ならす。stop() で とめられる。
 * @returns 'ok' ならしおわった / 'stopped' とめた / 'failed' ならせなかった (iPad の 声で よみなおす)
 */
export function playClip(key: string): { done: Promise<'ok' | 'stopped' | 'failed'>; stop: () => void } {
  let stopped = false;
  let src: AudioBufferSourceNode | null = null;
  let finish: (v: 'ok' | 'stopped' | 'failed') => void = () => undefined;
  const done = new Promise<'ok' | 'stopped' | 'failed'>((resolve) => {
    finish = resolve;
    void decode(key).then((buf) => {
      const out = getAudioOut();
      if (stopped) return resolve('stopped');
      if (!buf || !out) return resolve('failed');
      if (out.ctx.state !== 'running') void out.ctx.resume().catch(() => undefined);
      try {
        src = out.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(out.voice);
        src.onended = () => resolve(stopped ? 'stopped' : 'ok');
        src.start();
      } catch {
        return resolve('failed');
      }
      // iPad で onended が こないときの ほけん
      setTimeout(() => resolve(stopped ? 'stopped' : 'ok'), buf.duration * 1000 + 1500);
    });
  });
  return {
    done,
    stop: () => {
      stopped = true;
      try {
        src?.stop();
      } catch {
        /* noop */
      }
      finish('stopped');
    },
  };
}
