/** えほん・マップで つかう 「ばめん」 の データ */

export type Bg =
  | 'meadow'
  | 'forest'
  | 'sea'
  | 'beach'
  | 'night'
  | 'room'
  | 'town'
  | 'snow'
  | 'sky'
  | 'party'
  | 'kitchen'
  | 'field'
  | 'mountain'
  | 'space'
  | 'hole'
  | 'rain'
  | 'evening'
  | 'rainbow';

export type Anim =
  | 'none'
  | 'bob'
  | 'hop'
  | 'walk'
  | 'walkL'
  | 'spin'
  | 'shake'
  | 'pulse'
  | 'fall'
  | 'sway'
  | 'fly'
  | 'grow'
  | 'wiggle'
  | 'roll'
  | 'twinkle'
  | 'rise'
  | 'sleep'
  | 'run'
  | 'float'
  | 'drop'
  | 'up';

export interface Actor {
  /** えもじ、または 'buddy' (あいぼう) / 'child' (こども) / 'kabu' (かぶ) */
  e: string;
  /** まんなかの いち (%) */
  x: number;
  y: number;
  /** おおきさ (ばめんの たかさに たいする %) */
  s?: number;
  a?: Anim;
  /** アニメーションの おくれ (びょう) */
  d?: number;
  flip?: boolean;
  z?: number;
  /** あいぼうの きもち */
  mood?: 'normal' | 'happy' | 'sad' | 'sleep' | 'wow';
}

export interface SceneSpec {
  bg: Bg;
  actors: Actor[];
}

export const A = (e: string, x: number, y: number, s = 20, a: Anim = 'bob', extra: Partial<Actor> = {}): Actor => ({
  e,
  x,
  y,
  s,
  a,
  ...extra,
});
