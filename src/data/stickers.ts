/** シール (ごほうび) */
export interface StickerDef {
  s: string;
  /** キラキラ (でにくい) */
  rare?: boolean;
}

export const STICKERS: StickerDef[] = [
  // どうぶつ
  ...['🐶', '🐱', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐤', '🐬', '🐳', '🦋', '🐞', '🐢', '🐙', '🦀', '🐠', '🦒', '🐘', '🦔', '🦩', '🐝'].map(
    (s) => ({ s }),
  ),
  // たべもの
  ...['🍎', '🍓', '🍒', '🍑', '🍊', '🍇', '🍉', '🍰', '🧁', '🍩', '🍪', '🍭', '🍬', '🍙', '🍡', '🍦', '🥞', '🍮'].map((s) => ({ s })),
  // しぜん・もの
  ...['🌸', '🌷', '🌻', '🍀', '🍄', '⛄', '🎈', '🎀', '🎁', '🚗', '🚂', '🚲', '⛵', '🧸', '🪁', '🎠', '🏠', '🌳'].map((s) => ({ s })),
  // キラキラ
  ...['🦄', '👑', '💎', '🌈', '🏰', '🌟', '🐉', '🦚', '🪐', '🧜‍♀️'].map((s) => ({ s, rare: true })),
];

export const RARE = new Set(STICKERS.filter((x) => x.rare).map((x) => x.s));

/** シールちょうの ページ */
export interface StickerPage {
  id: string;
  name: string;
  sky: [string, string];
  ground: string;
  groundHeight: number;
}

export const STICKER_PAGES: StickerPage[] = [
  { id: 'meadow', name: 'はらっぱ', sky: ['#aee3ff', '#e9f9ff'], ground: '#8fd672', groundHeight: 35 },
  { id: 'sea', name: 'うみ', sky: ['#9fdcff', '#d8f3ff'], ground: '#4fb3e8', groundHeight: 55 },
  { id: 'night', name: 'よぞら', sky: ['#1d2257', '#4a3f8f'], ground: '#2e2a5c', groundHeight: 20 },
  { id: 'room', name: 'おへや', sky: ['#ffe9d6', '#fff6ec'], ground: '#e0b98f', groundHeight: 28 },
];
