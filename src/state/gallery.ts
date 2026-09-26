/**
 * こどもが かいた もじの きろく (おうちのかた むけ ギャラリー)。
 * 本体データとは べつの キーに ほぞんする。
 */
export interface Sample {
  at: number;
  stars: number;
  /** 109x109 座標の 画 (小数1けたに まるめる) */
  strokes: [number, number][][];
}

export interface NameSample {
  at: number;
  name: string;
  chars: { kana: string; strokes: [number, number][][] }[];
}

interface GalleryData {
  kana: Record<string, Sample[]>;
  names: NameSample[];
}

const KEY = 'hiragana-bouken:gallery';
const PER_KANA = 4;
const NAMES = 12;

function load(): GalleryData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<GalleryData>;
      return { kana: d.kana ?? {}, names: d.names ?? [] };
    }
  } catch {
    /* noop */
  }
  return { kana: {}, names: [] };
}

let data: GalleryData | null = null;
const get = () => (data ??= load());

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(get()));
  } catch {
    // いっぱいなら ふるいものを へらして もういちど
    const d = get();
    for (const k of Object.keys(d.kana)) d.kana[k] = d.kana[k].slice(-2);
    d.names = d.names.slice(-4);
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* noop */
    }
  }
}

export const round = (strokes: { x: number; y: number }[][]): [number, number][][] =>
  strokes.map((s) => s.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10] as [number, number]));

export function addSample(kana: string, sample: Sample): void {
  const d = get();
  const list = d.kana[kana] ?? [];
  // さいしょの 1まいは のこす (せいちょうが わかるように)
  const next = [...list, sample];
  if (next.length > PER_KANA) next.splice(1, next.length - PER_KANA);
  d.kana[kana] = next;
  save();
}

export function addNameSample(s: NameSample): void {
  const d = get();
  d.names = [...d.names, s].slice(-NAMES);
  save();
}

export function getSamples(kana: string): Sample[] {
  return get().kana[kana] ?? [];
}

export function getNameSamples(): NameSample[] {
  return get().names;
}

export function galleryKanaList(): string[] {
  return Object.keys(get().kana).filter((k) => get().kana[k].length > 0);
}

export function clearGallery(): void {
  data = { kana: {}, names: [] };
  save();
}

export function exportGallery(): GalleryData {
  return get();
}

export function importGallery(d: unknown): void {
  if (d && typeof d === 'object') {
    const g = d as Partial<GalleryData>;
    data = { kana: g.kana ?? {}, names: g.names ?? [] };
    save();
  }
}
