/** あいぼうの きせかえ (たからばこで もらえる) */
export interface Outfit {
  id: string;
  emoji: string;
  /** よみあげ用 */
  say: string;
  /** どこに つけるか */
  pos: 'head' | 'ear' | 'eyes' | 'neck' | 'hand';
}

export const OUTFITS: Outfit[] = [
  { id: 'ribbon', emoji: '🎀', say: 'リボン', pos: 'ear' },
  { id: 'crown', emoji: '👑', say: 'かんむり', pos: 'head' },
  { id: 'flower', emoji: '🌸', say: 'さくらの はな', pos: 'ear' },
  { id: 'glasses', emoji: '🕶️', say: 'サングラス', pos: 'eyes' },
  { id: 'hat', emoji: '🎩', say: 'シルクハット', pos: 'head' },
  { id: 'star', emoji: '⭐', say: 'おほしさま', pos: 'ear' },
  { id: 'balloon', emoji: '🎈', say: 'ふうせん', pos: 'hand' },
  { id: 'straw', emoji: '👒', say: 'むぎわら ぼうし', pos: 'head' },
  { id: 'butterfly', emoji: '🦋', say: 'ちょうちょ', pos: 'ear' },
  { id: 'scarf', emoji: '🧣', say: 'マフラー', pos: 'neck' },
  { id: 'wand', emoji: '🪄', say: 'まほうの つえ', pos: 'hand' },
  { id: 'cap', emoji: '🧢', say: 'ぼうし', pos: 'head' },
  { id: 'clover', emoji: '🍀', say: 'よつばの クローバー', pos: 'ear' },
  { id: 'tulip', emoji: '🌷', say: 'チューリップ', pos: 'hand' },
  { id: 'grad', emoji: '🎓', say: 'はかせの ぼうし', pos: 'head' },
  { id: 'gem', emoji: '💎', say: 'ほうせき', pos: 'neck' },
  // カタカナの ぼうけんの たからばこ
  { id: 'headphones', emoji: '🎧', say: 'ヘッドホン', pos: 'head' },
  { id: 'sunflower', emoji: '🌻', say: 'ひまわり', pos: 'ear' },
  { id: 'lollipop', emoji: '🍭', say: 'キャンディ', pos: 'hand' },
  { id: 'medal', emoji: '🏅', say: 'メダル', pos: 'neck' },
  { id: 'helmet', emoji: '⛑️', say: 'ヘルメット', pos: 'head' },
  { id: 'heart', emoji: '💖', say: 'ハート', pos: 'ear' },
  { id: 'icecream', emoji: '🍦', say: 'ソフトクリーム', pos: 'hand' },
  { id: 'mushroom', emoji: '🍄', say: 'きのこ', pos: 'ear' },
  { id: 'mic', emoji: '🎤', say: 'マイク', pos: 'hand' },
  { id: 'guitar', emoji: '🎸', say: 'ギター', pos: 'hand' },
  { id: 'sparkles', emoji: '✨', say: 'キラキラ', pos: 'ear' },
  { id: 'rose', emoji: '🌹', say: 'バラ', pos: 'hand' },
  { id: 'rocket', emoji: '🚀', say: 'ロケット', pos: 'hand' },
  { id: 'bell', emoji: '🔔', say: 'すず', pos: 'neck' },
  { id: 'windchime', emoji: '🎐', say: 'ふうりん', pos: 'hand' },
  { id: 'party', emoji: '🎉', say: 'クラッカー', pos: 'hand' },
];

export function findOutfit(id: string | null | undefined): Outfit | undefined {
  return OUTFITS.find((o) => o.id === id);
}
