/**
 * えほん (オリジナルの おはなしと、むかしばなしの かきおろし)。
 *
 * text の かきかた:
 *  - ことばの くぎりは スペース (わかちがき)、ぎょうの くぎりは \n
 *  - {name} = こどもの よびかた、{buddy} = あいぼうの なまえ
 *  - 「ひょうじ|よみ」 で よみあげを かえられる (例: ねこは|ねこわ)
 */
import { A, type Actor, type Bg, type SceneSpec } from './scene';

export interface BookPage extends SceneSpec {
  text: string;
}

export interface Book {
  id: string;
  title: string;
  /** むずかしさ 1〜5 */
  level: 1 | 2 | 3 | 4 | 5;
  cover: SceneSpec;
  pages: BookPage[];
}

const P = (bg: Bg, text: string, ...actors: Actor[]): BookPage => ({ bg, text, actors });

export const BOOKS: Book[] = [
  {
    id: 'doubutsu',
    title: 'どうぶつ なにかな',
    level: 1,
    cover: { bg: 'meadow', actors: [A('🐶', 30, 68, 26, 'hop'), A('🐱', 52, 70, 24, 'bob', { d: 0.3 }), A('🐮', 74, 66, 28, 'sway')] },
    pages: [
      P('meadow', 'いぬ\nわん わん', A('🐶', 50, 62, 42, 'hop')),
      P('room', 'ねこ\nにゃあ にゃあ', A('🐱', 50, 64, 40, 'wiggle')),
      P('field', 'うし\nもう もう', A('🐮', 50, 60, 44, 'sway')),
      P('field', 'ぶた\nぶう ぶう', A('🐷', 50, 64, 40, 'bob')),
      P('meadow', 'ひよこ\nぴよ ぴよ', A('🐤', 34, 70, 22, 'hop'), A('🐤', 52, 72, 20, 'hop', { d: 0.25 }), A('🐤', 70, 70, 22, 'hop', { d: 0.5 })),
      P('meadow', 'かえる\nけろ けろ', A('🐸', 50, 66, 38, 'hop'), A('🪷', 26, 82, 18, 'none'), A('🪷', 76, 84, 16, 'none')),
      P('meadow', '{buddy}\nこんにちは!', A('buddy', 50, 60, 52, 'none', { mood: 'happy' })),
      P(
        'meadow',
        'みんな\nなかよし',
        A('🐶', 18, 72, 20, 'hop'),
        A('🐱', 34, 74, 18, 'hop', { d: 0.2 }),
        A('buddy', 52, 64, 34, 'none', { mood: 'happy' }),
        A('🐷', 70, 74, 18, 'hop', { d: 0.4 }),
        A('🐸', 86, 76, 16, 'hop', { d: 0.6 }),
      ),
    ],
  },
  {
    id: 'kudamono',
    title: 'くだもの いただきます',
    level: 1,
    cover: { bg: 'kitchen', actors: [A('🍎', 30, 66, 24, 'bob'), A('🍊', 50, 68, 22, 'bob', { d: 0.3 }), A('🍓', 70, 66, 22, 'bob', { d: 0.6 })] },
    pages: [
      P('kitchen', 'りんご\nしゃり しゃり', A('🍎', 50, 60, 42, 'pulse')),
      P('kitchen', 'みかん\nむき むき', A('🍊', 50, 60, 40, 'wiggle')),
      P('kitchen', 'いちご\nあまい あまい', A('🍓', 50, 60, 40, 'bob')),
      P('kitchen', 'ぶどう\nつぶ つぶ', A('🍇', 50, 60, 42, 'sway')),
      P('beach', 'すいか\nまんまる', A('🍉', 50, 66, 40, 'roll')),
      P('kitchen', 'もも\nふわ ふわ', A('🍑', 50, 60, 40, 'bob')),
      P(
        'kitchen',
        'みんなで\nいただきます!',
        A('child', 32, 62, 34, 'none'),
        A('buddy', 66, 62, 34, 'none', { mood: 'happy' }),
        A('🍎', 42, 84, 12, 'bob'),
        A('🍓', 54, 86, 12, 'bob', { d: 0.3 }),
        A('🍊', 66, 84, 12, 'bob', { d: 0.6 }),
      ),
      P('kitchen', 'おいしいね\nごちそうさま', A('child', 34, 60, 36, 'hop'), A('buddy', 66, 60, 36, 'none', { mood: 'happy' })),
    ],
  },
  {
    id: 'norimono',
    title: 'のりもの だいすき',
    level: 1,
    cover: { bg: 'town', actors: [A('🚃', 30, 74, 22, 'bob'), A('🚗', 62, 80, 18, 'bob', { d: 0.3 }), A('✈️', 76, 26, 16, 'fly')] },
    pages: [
      P('field', 'でんしゃ\nがたん ごとん', A('🚃', 50, 46, 40, 'run')),
      P('town', 'くるま\nぶう ぶう', A('🚗', 50, 76, 34, 'run')),
      P('sea', 'ふね\nぽう ぽう', A('🚢', 50, 52, 40, 'float')),
      P('sky', 'ひこうき\nびゅーん', A('✈️', 50, 44, 36, 'fly')),
      P('meadow', 'じてんしゃ\nすい すい', A('🚲', 50, 70, 34, 'run')),
      P('town', 'きゅうきゅうしゃ\nぴーぽー ぴーぽー', A('🚑', 50, 76, 34, 'run')),
      P(
        'meadow',
        'みんなで\nしゅっぱつ!',
        A('🚃', 22, 76, 18, 'run'),
        A('🚗', 44, 80, 14, 'run', { d: 0.2 }),
        A('🚲', 64, 80, 14, 'run', { d: 0.4 }),
        A('✈️', 72, 24, 16, 'fly'),
        A('buddy', 86, 70, 22, 'none', { mood: 'happy' }),
      ),
    ],
  },
  {
    id: 'oyasumi',
    title: 'おやすみ',
    level: 1,
    cover: { bg: 'night', actors: [A('buddy', 50, 64, 40, 'none', { mood: 'sleep' }), A('🌙', 80, 20, 14, 'twinkle')] },
    pages: [
      P('night', 'よるに なったよ。', A('🌙', 50, 36, 30, 'twinkle'), A('⭐', 22, 22, 10, 'twinkle', { d: 0.5 }), A('⭐', 80, 28, 8, 'twinkle', { d: 1 })),
      P('forest', 'おやすみ、ことりさん。', A('🐦', 50, 56, 30, 'sleep'), A('🌙', 80, 18, 12, 'twinkle')),
      P('room', 'おやすみ、ねこさん。', A('🐱', 50, 64, 32, 'sleep')),
      P('night', 'おやすみ、くまさん。', A('🐻', 50, 62, 34, 'sleep'), A('🌙', 82, 18, 12, 'twinkle')),
      P('night', 'おやすみ、おほしさま。', A('⭐', 30, 30, 16, 'twinkle'), A('⭐', 56, 22, 20, 'twinkle', { d: 0.4 }), A('⭐', 78, 36, 14, 'twinkle', { d: 0.8 })),
      P('night', 'おやすみ、{buddy}。', A('buddy', 50, 62, 42, 'none', { mood: 'sleep' })),
      P('night', 'おやすみ、{name}。\nまた あした。', A('child', 38, 64, 30, 'sleep'), A('buddy', 64, 66, 28, 'none', { mood: 'sleep' }), A('🌙', 82, 18, 14, 'twinkle')),
    ],
  },
  {
    id: 'iro',
    title: 'いろ いろ',
    level: 2,
    cover: { bg: 'rainbow', actors: [A('🌈', 50, 44, 50, 'pulse')] },
    pages: [
      P('kitchen', 'あかい\nりんご', A('🍎', 50, 60, 42, 'bob')),
      P('sea', 'あおい\nうみ', A('🐳', 50, 60, 34, 'float'), A('🐟', 24, 76, 12, 'float', { d: 0.5 })),
      P('meadow', 'きいろい\nひよこ', A('🐤', 50, 64, 36, 'hop')),
      P('forest', 'みどりの\nはっぱ', A('🍃', 40, 50, 26, 'sway'), A('🍃', 62, 60, 22, 'sway', { d: 0.4 })),
      P('sky', 'しろい\nくも', A('☁️', 36, 40, 30, 'float'), A('☁️', 66, 58, 24, 'float', { d: 1 })),
      P('night', 'くろい\nねこ', A('🐈‍⬛', 50, 66, 38, 'wiggle'), A('🌙', 78, 22, 16, 'twinkle')),
      P('meadow', 'ももいろの\nさくら', A('🌸', 34, 44, 22, 'spin'), A('🌸', 60, 58, 26, 'spin', { d: 0.5 }), A('🌸', 80, 36, 16, 'spin', { d: 1 })),
      P('rainbow', 'ぜんぶ あわせて\nにじ!', A('🌈', 50, 44, 56, 'pulse'), A('buddy', 50, 76, 26, 'none', { mood: 'wow' })),
    ],
  },
  {
    id: 'kakurenbo',
    title: 'かくれんぼ',
    level: 2,
    cover: { bg: 'forest', actors: [A('🌳', 40, 56, 50, 'none', { z: 2 }), A('🐿️', 58, 66, 18, 'wiggle', { z: 1 }), A('buddy', 78, 66, 26, 'none')] },
    pages: [
      P('forest', 'かくれんぼ しよう!\n「もう いいかい?」', A('buddy', 50, 62, 40, 'none'), A('🙈', 50, 26, 14, 'wiggle')),
      P('forest', '「もう いいよ!」', A('🌳', 30, 56, 44, 'none'), A('🌿', 60, 78, 26, 'sway'), A('🪨', 84, 76, 24, 'none')),
      P('forest', 'きの うしろに\nだれか いるよ。', A('🌳', 46, 52, 60, 'none', { z: 2 }), A('🐿️', 61, 44, 16, 'wiggle', { z: 1 })),
      P('forest', 'りすさん、\nみいつけた!', A('🐿️', 50, 62, 36, 'hop'), A('buddy', 78, 68, 24, 'none', { mood: 'happy' })),
      P('meadow', 'くさの なかに\nだれか いるよ。', A('🌿', 50, 70, 44, 'sway', { z: 2 }), A('🐰', 54, 62, 20, 'wiggle', { z: 1 })),
      P('meadow', 'うさぎさん、\nみいつけた!', A('🐰', 50, 62, 36, 'hop'), A('buddy', 78, 68, 24, 'none', { mood: 'happy' })),
      P('mountain', 'いわの かげに\nだれか いるよ。', A('🪨', 48, 72, 42, 'none', { z: 2 }), A('🦊', 58, 60, 20, 'wiggle', { z: 1 })),
      P(
        'meadow',
        'きつねさん、みいつけた!\nみんな みつかったね。',
        A('🦊', 26, 68, 22, 'hop'),
        A('🐿️', 44, 72, 16, 'hop', { d: 0.2 }),
        A('🐰', 60, 70, 18, 'hop', { d: 0.4 }),
        A('buddy', 80, 64, 28, 'none', { mood: 'happy' }),
      ),
    ],
  },
  {
    id: 'ookii',
    title: 'おおきい ちいさい',
    level: 2,
    cover: { bg: 'meadow', actors: [A('🐘', 36, 60, 44, 'bob'), A('🐭', 70, 78, 10, 'hop')] },
    pages: [
      P('meadow', 'おおきい ぞう。\nちいさい ねずみ。', A('🐘', 36, 56, 50, 'bob'), A('🐭', 76, 78, 10, 'hop')),
      P('sea', 'おおきい くじら。\nちいさい さかな。', A('🐳', 38, 56, 48, 'float'), A('🐟', 78, 70, 10, 'float', { d: 0.4 })),
      P('meadow', 'おおきい き。\nちいさい はな。', A('🌳', 36, 50, 60, 'sway'), A('🌷', 76, 80, 10, 'bob')),
      P('meadow', 'たかい きりん。\nひくい かめ。', A('🦒', 36, 50, 60, 'bob'), A('🐢', 76, 82, 12, 'sway')),
      P('room', 'おおきい {buddy}。\nちいさい {buddy}。', A('buddy', 36, 58, 52, 'none', { mood: 'happy' }), A('buddy', 76, 76, 16, 'none', { mood: 'happy' })),
      P('meadow', '{name}は まいにち\nおおきく なるね。', A('child', 40, 60, 38, 'hop'), A('buddy', 70, 66, 26, 'none', { mood: 'happy' }), A('🌈', 50, 20, 20, 'pulse')),
    ],
  },
  {
    id: 'ichinichi',
    title: '{buddy}の いちにち',
    level: 3,
    cover: { bg: 'room', actors: [A('buddy', 50, 62, 44, 'none', { mood: 'happy' }), A('☀️', 82, 22, 16, 'spin')] },
    pages: [
      P('room', 'あさ です。\n{buddy}が おきました。\n「おはよう!」', A('buddy', 50, 62, 44, 'none', { mood: 'happy' }), A('☀️', 82, 22, 16, 'rise')),
      P('room', 'かおを あらって、\nはを みがきます。', A('buddy', 44, 62, 40, 'none'), A('💧', 68, 50, 12, 'fall'), A('🧼', 72, 74, 12, 'wiggle')),
      P(
        'kitchen',
        'あさごはんは\nおにぎりと たまご。\n「いただきます!」',
        A('buddy', 36, 60, 40, 'none', { mood: 'happy' }),
        A('🍙', 62, 76, 16, 'bob'),
        A('🥚', 78, 76, 14, 'bob', { d: 0.4 }),
      ),
      P('meadow', 'そとで あそびます。\nぶらんこ ゆら ゆら。', A('buddy', 50, 54, 40, 'sway')),
      P(
        'meadow',
        'おともだちと\nおにごっこ。\n「まて まて〜!」|まてー!」',
        A('buddy', 30, 64, 32, 'run'),
        A('🐶', 58, 70, 22, 'run', { d: 0.2 }),
        A('🐱', 80, 72, 20, 'run', { d: 0.4 }),
      ),
      P('evening', 'ゆうがた です。\nおうちに かえります。', A('buddy', 40, 66, 34, 'walk'), A('🏠', 76, 62, 30, 'none')),
      P('room', 'おふろで\nぽか ぽか。', A('🛁', 50, 72, 40, 'none'), A('buddy', 50, 56, 30, 'bob', { mood: 'happy', z: 0 })),
      P('night', 'えほんを よんで もらって、\nおやすみなさい。\nまた あした。', A('buddy', 50, 64, 40, 'none', { mood: 'sleep' }), A('🌙', 80, 20, 16, 'twinkle'), A('⭐', 20, 18, 10, 'twinkle', { d: 0.6 })),
    ],
  },
  {
    id: 'osanpo',
    title: '{name}と おさんぽ',
    level: 3,
    cover: { bg: 'meadow', actors: [A('child', 38, 62, 36, 'hop'), A('buddy', 62, 64, 32, 'none', { mood: 'happy' })] },
    pages: [
      P('meadow', '{name}と {buddy}は\nおさんぽに いきました。', A('child', 36, 62, 36, 'walk'), A('buddy', 62, 64, 32, 'walk', { d: 0.2 })),
      P(
        'town',
        'いぬさんに あいました。\n「こんにちは!」\n「わん!」',
        A('child', 26, 64, 32, 'none'),
        A('buddy', 46, 66, 28, 'none', { mood: 'happy' }),
        A('🐕', 74, 70, 28, 'hop', { flip: true }),
      ),
      P('meadow', 'ちょうちょが ひら ひら。\n「まって まって。」', A('🦋', 64, 36, 16, 'fly'), A('child', 30, 64, 30, 'run'), A('buddy', 48, 68, 24, 'run', { d: 0.3 })),
      P('meadow', 'いけの そばに かめさん。\nのんびり ひなたぼっこ。', A('🐢', 54, 74, 28, 'sway'), A('☀️', 80, 20, 16, 'spin')),
      P('rain', 'あっ、あめが\nふって きたよ。', A('child', 36, 64, 30, 'shake'), A('buddy', 60, 66, 28, 'shake', { mood: 'wow' })),
      P(
        'rain',
        'おおきな はっぱを かさに して、\nいっしょに はいろう。',
        A('🍃', 48, 34, 44, 'sway'),
        A('child', 38, 66, 30, 'none'),
        A('buddy', 60, 68, 26, 'none', { mood: 'happy' }),
      ),
      P('rainbow', 'あめが やんで、\nにじが でたよ!', A('🌈', 50, 36, 50, 'pulse'), A('child', 34, 72, 26, 'hop'), A('buddy', 64, 74, 24, 'hop', { d: 0.3 })),
      P('evening', 'たのしかったね。\nまた いこうね。', A('child', 38, 66, 32, 'walk'), A('buddy', 60, 68, 28, 'walk', { d: 0.2, mood: 'happy' })),
    ],
  },
  {
    id: 'omusubi',
    title: 'おむすび ころりん',
    level: 4,
    cover: { bg: 'mountain', actors: [A('👴', 36, 64, 34, 'bob'), A('🍙', 64, 76, 18, 'roll')] },
    pages: [
      P('mountain', 'むかし むかし、\nやまの ちかくに\nやさしい おじいさんが いました。', A('👴', 40, 64, 36, 'bob'), A('🏡', 74, 62, 30, 'none')),
      P('forest', 'おじいさんは やまで\nしごとを しました。\n「さあ、おべんとうに しよう。」', A('👴', 44, 62, 36, 'bob'), A('🪓', 68, 70, 16, 'wiggle')),
      P('forest', 'おむすびを ひとつ\nとりだすと……\nころころ ころりん!', A('👴', 30, 60, 32, 'shake'), A('🍙', 58, 76, 16, 'roll')),
      P('hole', 'おむすびは あなの なかへ\nすっとん とん。', A('🍙', 50, 30, 16, 'drop')),
      P('hole', 'あなの なかから\nうたが きこえます。\n「おむすび ころりん すっとんとん」', A('🎵', 30, 40, 12, 'fly'), A('🎶', 70, 44, 12, 'fly', { d: 0.5 }), A('👴', 50, 24, 22, 'wiggle')),
      P('forest', 'おじいさんは うれしく なって、\nもう ひとつ ころりん。', A('👴', 36, 60, 32, 'hop'), A('🍙', 62, 76, 14, 'roll')),
      P('hole', 'あなを のぞくと、\nねずみたちが おどって いました。', A('🐭', 28, 70, 18, 'hop'), A('🐭', 50, 72, 20, 'hop', { d: 0.2 }), A('🐭', 72, 70, 18, 'hop', { d: 0.4 })),
      P('hole', '「おむすびを ありがとう。」\nねずみたちは おみやげを くれました。', A('🐭', 36, 70, 22, 'bob'), A('🎁', 62, 70, 22, 'wiggle')),
      P('room', 'はこを あけると、\nきらきらの たからもの!', A('🎁', 50, 70, 24, 'none'), A('💎', 40, 40, 14, 'twinkle'), A('✨', 60, 36, 14, 'twinkle', { d: 0.4 })),
      P('room', 'おじいさんと おばあさんは\nなかよく くらしました。\nおしまい。', A('👴', 38, 62, 32, 'bob'), A('👵', 62, 62, 32, 'bob', { d: 0.4 })),
    ],
  },
  {
    id: 'kabu',
    title: 'おおきな かぶ',
    level: 4,
    cover: { bg: 'field', actors: [A('kabu', 50, 58, 50, 'sway')] },
    pages: [
      P('field', 'おじいさんが\nかぶの たねを まきました。', A('👴', 40, 60, 34, 'bob'), A('🌱', 66, 78, 12, 'grow')),
      P('field', '「おおきく なあれ。\nあまく なあれ。」', A('👴', 36, 60, 34, 'bob'), A('💧', 62, 60, 10, 'fall'), A('🌱', 64, 78, 14, 'pulse')),
      P('field', 'かぶは ぐんぐん\nおおきく なりました。', A('kabu', 52, 54, 58, 'grow')),
      P('field', 'おじいさんが ひっぱります。\nよいしょ、よいしょ。\nでも ぬけません。', A('kabu', 34, 56, 46, 'wiggle'), A('👴', 70, 64, 30, 'shake')),
      P('field', 'おばあさんを よんで きました。\nよいしょ、よいしょ。\nまだ ぬけません。', A('kabu', 26, 56, 42, 'wiggle'), A('👴', 56, 64, 28, 'shake'), A('👵', 78, 64, 28, 'shake', { d: 0.1 })),
      P('field', 'まごを よんで きました。\nよいしょ、よいしょ。', A('kabu', 22, 56, 38, 'wiggle'), A('👴', 46, 64, 24, 'shake'), A('👵', 64, 64, 24, 'shake'), A('child', 82, 66, 22, 'shake')),
      P('field', 'いぬと ねこも きました。\nよいしょ、よいしょ。', A('kabu', 18, 56, 34, 'wiggle'), A('👴', 38, 64, 20, 'shake'), A('👵', 52, 64, 20, 'shake'), A('child', 66, 66, 18, 'shake'), A('🐕', 80, 72, 14, 'shake'), A('🐈', 92, 74, 12, 'shake')),
      P('field', 'さいごに ねずみも きました。\nみんなで……\nよいしょ、よいしょ!', A('kabu', 18, 56, 34, 'shake'), A('👴', 38, 64, 20, 'shake'), A('👵', 52, 64, 20, 'shake'), A('child', 66, 66, 18, 'shake'), A('🐕', 78, 72, 12, 'shake'), A('🐈', 88, 74, 11, 'shake'), A('🐭', 96, 76, 8, 'shake')),
      P('field', 'すっぽん!\nかぶが ぬけました!', A('kabu', 50, 36, 44, 'spin'), A('👴', 30, 80, 18, 'wiggle'), A('👵', 46, 82, 18, 'wiggle'), A('child', 62, 82, 16, 'hop'), A('🐭', 80, 84, 10, 'hop')),
      P('kitchen', 'みんなで なかよく\nおいしく たべました。\nおしまい。', A('🍲', 50, 70, 28, 'bob'), A('👴', 20, 62, 22, 'bob'), A('👵', 80, 62, 22, 'bob', { d: 0.3 }), A('child', 36, 66, 18, 'hop'), A('🐭', 64, 74, 10, 'hop')),
    ],
  },
  {
    id: 'tanjoubi',
    title: '{buddy}の たんじょうび',
    level: 5,
    cover: { bg: 'party', actors: [A('buddy', 50, 62, 44, 'none', { mood: 'happy' }), A('🎂', 78, 74, 18, 'bob')] },
    pages: [
      P('party', 'きょうは {buddy}の\nたんじょうび。', A('buddy', 50, 62, 44, 'none', { mood: 'happy' }), A('🎈', 16, 30, 14, 'bob'), A('🎈', 84, 26, 14, 'bob', { d: 0.5 })),
      P('room', 'でも、みんな どこかへ\nでかけて しまいました。\n「あれれ? さみしいな。」', A('buddy', 50, 62, 40, 'none', { mood: 'sad' })),
      P('room', 'とん とん。\nだれかが きたよ。', A('🚪', 72, 60, 38, 'wiggle'), A('buddy', 34, 64, 32, 'none', { mood: 'wow' })),
      P(
        'party',
        '「おたんじょうび おめでとう!」\n{name}と ともだちが きたよ。',
        A('child', 22, 64, 30, 'hop'),
        A('buddy', 50, 62, 34, 'none', { mood: 'happy' }),
        A('🐻', 74, 68, 22, 'hop', { d: 0.2 }),
        A('🐰', 90, 70, 18, 'hop', { d: 0.4 }),
        A('🎉', 50, 22, 16, 'spin'),
      ),
      P('party', 'くまさんは はちみつ。', A('🐻', 40, 62, 34, 'bob'), A('🍯', 66, 74, 20, 'wiggle')),
      P('meadow', 'うさぎさんは\nおはなの わ。', A('🐰', 40, 62, 32, 'hop'), A('💐', 66, 70, 22, 'sway')),
      P('party', '{name}は じぶんで かいた\nおてがみ。', A('child', 36, 62, 34, 'bob'), A('✉️', 66, 64, 20, 'wiggle')),
      P('party', 'ろうそくを ふうっと けして……', A('🎂', 50, 66, 36, 'pulse'), A('buddy', 50, 30, 20, 'none', { mood: 'wow' })),
      P(
        'party',
        '「みんな ありがとう。\nだいすき!」',
        A('buddy', 50, 60, 40, 'none', { mood: 'happy' }),
        A('child', 20, 66, 26, 'hop'),
        A('🐻', 78, 68, 22, 'hop', { d: 0.2 }),
        A('🎊', 30, 20, 14, 'spin'),
        A('🎉', 72, 18, 14, 'spin', { d: 0.3 }),
      ),
    ],
  },
  {
    id: 'hoshi',
    title: 'ほしの こ',
    level: 5,
    cover: { bg: 'night', actors: [A('⭐', 50, 40, 30, 'twinkle'), A('🌙', 80, 20, 14, 'bob')] },
    pages: [
      P('night', 'よるの そらから\nちいさな ほしが\nおちて きました。', A('⭐', 50, 60, 22, 'fall'), A('🌙', 82, 18, 14, 'twinkle')),
      P('meadow', '「えーん えーん。\nおうちに かえれないよう。」', A('⭐', 50, 64, 26, 'shake')),
      P('meadow', '{name}と {buddy}は\nほしの こを\nたすける ことに しました。', A('child', 30, 62, 30, 'bob'), A('⭐', 52, 70, 16, 'bob'), A('buddy', 72, 64, 28, 'none', { mood: 'normal' })),
      P('mountain', 'たかい やまに のぼっても、\nそらには とどきません。', A('child', 40, 50, 24, 'hop'), A('buddy', 58, 52, 22, 'hop', { d: 0.3 }), A('⭐', 50, 34, 12, 'bob')),
      P(
        'sky',
        'ふうせんを たくさん あつめて、\nふわ ふわ……\nでも まだ とどかない。',
        A('🎈', 36, 30, 16, 'bob'),
        A('🎈', 50, 24, 16, 'bob', { d: 0.3 }),
        A('🎈', 64, 30, 16, 'bob', { d: 0.6 }),
        A('⭐', 50, 56, 14, 'bob'),
      ),
      P('night', 'そこへ ふくろうが とんで きました。\n「わたしが つれて いって あげよう。」', A('🦉', 60, 40, 28, 'fly'), A('⭐', 36, 70, 14, 'hop')),
      P('night', 'ほしの こは ふくろうの せなかに のって、\nよぞらへ ぴゅーん!', A('🦉', 50, 50, 26, 'up'), A('⭐', 50, 42, 12, 'up')),
      P('night', '「ありがとう! ずっと みてるね。」\nそらで ほしが きらりと ひかりました。', A('⭐', 50, 26, 20, 'twinkle'), A('child', 36, 70, 26, 'none'), A('buddy', 62, 72, 24, 'none', { mood: 'happy' })),
      P('night', '{name}も {buddy}も\nにっこり。\nおやすみなさい。', A('child', 38, 66, 28, 'sleep'), A('buddy', 62, 68, 26, 'none', { mood: 'sleep' }), A('🌙', 82, 18, 14, 'twinkle')),
    ],
  },
];

export function findBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

export interface Token {
  /** ひょうじ */
  t: string;
  /** よみあげ */
  say: string;
}

/** {name} {buddy} を おきかえて、ぎょう→ことばに わける */
export function tokenize(text: string, vars: { name: string; buddy: string }): Token[][] {
  const filled = text.replaceAll('{name}', vars.name).replaceAll('{buddy}', vars.buddy);
  return filled.split('\n').map((line) =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => {
        const [t, say] = tok.split('|');
        return { t, say: particleSay(say ?? t) };
      }),
  );
}

/** くっつきの「は」を「わ」、「へ」を「え」と よませる */
export function particleSay(tok: string): string {
  const m = tok.match(/^(.+?)([はへ])([、。!?！？」…〜]*)$/u);
  if (!m) return tok;
  const [, head, p, tail] = m;
  // 1もじの ことば や、「ははは」 などは そのまま
  if ([...head].length < 1 || /^[はへ]+$/.test(head) || NOT_PARTICLE.has(head + p)) return tok;
  return head + (p === 'は' ? 'わ' : 'え') + tail;
}

const NOT_PARTICLE = new Set(['あはは', 'うふふ', 'いろは', 'おはようは']);

export function fillTitle(title: string, vars: { name: string; buddy: string }): string {
  return title.replaceAll('{name}', vars.name).replaceAll('{buddy}', vars.buddy);
}
