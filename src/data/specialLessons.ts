/**
 * とくべつな レッスン (てんてん・まる・ちいさい もじ・のばす おと・くっつきの もじ)。
 * カードを じゅんばんに みせて、さいごに クイズを する。
 */

export interface LessonCard {
  /** おおきく みせる もじ ("か＋゛＝が" のように ＋ と ＝ で わける) */
  show: string;
  /** したに だす ことば */
  word?: string;
  emoji?: string;
  /** よみあげ */
  say: string;
  /** ふきだし */
  caption?: string;
}

export interface LessonQuiz {
  /** よみあげる もんだい */
  say: string;
  caption: string;
  answer: string;
  choices: string[];
}

export interface SpecialLesson {
  id: string;
  title: string;
  icon: string;
  intro: { say: string; caption: string };
  cards: LessonCard[];
  quiz: LessonQuiz[];
  /** このレッスンで おぼえる もじ (しんちょくに きろく) */
  kana: string[];
}

export const SPECIAL_LESSONS: SpecialLesson[] = [
  {
    id: 'tenten',
    title: 'てんてん',
    icon: 'が',
    intro: {
      say: 'もじの みぎうえに、てんてんを つけると、おとが かわるよ。',
      caption: 'てんてんを つけると おとが かわるよ',
    },
    cards: [
      { show: 'か＋゛＝が', word: 'がっこう', emoji: '🏫', say: 'か に てんてんで、が。 がっこう の が。' },
      { show: 'さ＋゛＝ざ', word: 'ざりがに', emoji: '🦞', say: 'さ に てんてんで、ざ。 ざりがに の ざ。' },
      { show: 'た＋゛＝だ', word: 'だんご', emoji: '🍡', say: 'た に てんてんで、だ。 だんご の だ。' },
      { show: 'は＋゛＝ば', word: 'ばら', emoji: '🌹', say: 'は に てんてんで、ば。 ばら の ば。' },
    ],
    quiz: [
      { say: 'が は どれかな?', caption: '「が」は どれかな?', answer: 'が', choices: ['が', 'か', 'ざ'] },
      { say: 'だ は どれかな?', caption: '「だ」は どれかな?', answer: 'だ', choices: ['た', 'だ', 'ば'] },
      { say: 'ぶ は どれかな?', caption: '「ぶ」は どれかな?', answer: 'ぶ', choices: ['ふ', 'ぷ', 'ぶ'] },
    ],
    kana: [],
  },
  {
    id: 'maru',
    title: 'まる',
    icon: 'ぱ',
    intro: {
      say: 'は ひ ふ へ ほ の みぎうえに、ちいさい まるを つけると、ぱ ぴ ぷ ぺ ぽ に なるよ。',
      caption: 'まるを つけると ぱぴぷぺぽ',
    },
    cards: [
      { show: 'は＋゜＝ぱ', word: 'はっぱ', emoji: '🍃', say: 'は に まるで、ぱ。 はっぱ の ぱ。' },
      { show: 'ひ＋゜＝ぴ', word: 'えんぴつ', emoji: '✏️', say: 'ひ に まるで、ぴ。 えんぴつ の ぴ。' },
      { show: 'ふ＋゜＝ぷ', word: 'てんぷら', emoji: '🍤', say: 'ふ に まるで、ぷ。 てんぷら の ぷ。' },
      { show: 'へ＋゜＝ぺ', word: 'ぺろぺろ', emoji: '👅', say: 'へ に まるで、ぺ。 ぺろぺろ の ぺ。' },
      { show: 'ほ＋゜＝ぽ', word: 'たんぽぽ', emoji: '🌼', say: 'ほ に まるで、ぽ。 たんぽぽ の ぽ。' },
    ],
    quiz: [
      { say: 'ぱ は どれかな?', caption: '「ぱ」は どれかな?', answer: 'ぱ', choices: ['ば', 'ぱ', 'は'] },
      { say: 'ぽ は どれかな?', caption: '「ぽ」は どれかな?', answer: 'ぽ', choices: ['ぽ', 'ほ', 'ぼ'] },
      { say: 'ぴ は どれかな?', caption: '「ぴ」は どれかな?', answer: 'ぴ', choices: ['び', 'ひ', 'ぴ'] },
    ],
    kana: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  },
  {
    id: 'small-ya',
    title: 'ちいさい や',
    icon: 'ゃ',
    intro: {
      say: 'ちいさい や は、まえの もじと くっついて、ひとつの おとに なるよ。',
      caption: 'ちいさい「ゃ」は まえの もじと くっつくよ',
    },
    cards: [
      { show: 'き＋ゃ＝きゃ', say: 'き と ちいさい や で、きゃ。' },
      { show: 'し＋ゃ＝しゃ', word: 'でんしゃ', emoji: '🚃', say: 'し と ちいさい や で、しゃ。 でんしゃ の しゃ。' },
      { show: 'ち＋ゃ＝ちゃ', word: 'おちゃ', emoji: '🍵', say: 'ち と ちいさい や で、ちゃ。 おちゃ の ちゃ。' },
      { show: 'じ＋ゃ＝じゃ', word: 'にんじゃ', emoji: '🥷', say: 'じ と ちいさい や で、じゃ。 にんじゃ の じゃ。' },
    ],
    quiz: [
      { say: 'しゃ は どれかな?', caption: '「しゃ」は どれかな?', answer: 'しゃ', choices: ['しや', 'しゃ', 'さ'] },
      { say: 'ちゃ は どれかな?', caption: '「ちゃ」は どれかな?', answer: 'ちゃ', choices: ['ちゃ', 'ちや', 'きゃ'] },
    ],
    kana: ['ゃ'],
  },
  {
    id: 'small-yu',
    title: 'ちいさい ゆ',
    icon: 'ゅ',
    intro: { say: 'こんどは ちいさい ゆ だよ。', caption: 'ちいさい「ゅ」' },
    cards: [
      { show: 'き＋ゅ＝きゅ', word: 'きゅうり', emoji: '🥒', say: 'き と ちいさい ゆ で、きゅ。 きゅうり の きゅ。' },
      { show: 'ぎ＋ゅ＝ぎゅ', word: 'ぎゅうにゅう', emoji: '🥛', say: 'ぎ と ちいさい ゆ で、ぎゅ。 ぎゅうにゅう の ぎゅ。' },
      { show: 'ち＋ゅ＝ちゅ', word: 'ちきゅう', emoji: '🌏', say: 'ちきゅう の きゅう にも、ちいさい ゆ が あるよ。' },
    ],
    quiz: [
      { say: 'きゅ は どれかな?', caption: '「きゅ」は どれかな?', answer: 'きゅ', choices: ['きゆ', 'きゅ', 'きょ'] },
      { say: 'しゅ は どれかな?', caption: '「しゅ」は どれかな?', answer: 'しゅ', choices: ['しゅ', 'しょ', 'しゆ'] },
    ],
    kana: ['ゅ'],
  },
  {
    id: 'small-yo',
    title: 'ちいさい よ',
    icon: 'ょ',
    intro: { say: 'さいごは ちいさい よ だよ。', caption: 'ちいさい「ょ」' },
    cards: [
      { show: 'き＋ょ＝きょ', word: 'きょうりゅう', emoji: '🦕', say: 'き と ちいさい よ で、きょ。 きょうりゅう の きょ。' },
      { show: 'ち＋ょ＝ちょ', word: 'ちょうちょ', emoji: '🦋', say: 'ち と ちいさい よ で、ちょ。 ちょうちょ の ちょ。' },
      { show: 'ぎ＋ょ＝ぎょ', word: 'きんぎょ', emoji: '🐠', say: 'ぎ と ちいさい よ で、ぎょ。 きんぎょ の ぎょ。' },
      { show: 'ひ＋ょ＝ひょ', word: 'ひょう', emoji: '🐆', say: 'ひ と ちいさい よ で、ひょ。 ひょう の ひょ。' },
    ],
    quiz: [
      { say: 'ちょ は どれかな?', caption: '「ちょ」は どれかな?', answer: 'ちょ', choices: ['ちよ', 'ちゃ', 'ちょ'] },
      { say: 'きょ は どれかな?', caption: '「きょ」は どれかな?', answer: 'きょ', choices: ['きょ', 'きゅ', 'きよ'] },
    ],
    kana: ['ょ'],
  },
  {
    id: 'small-tsu',
    title: 'ちいさい っ',
    icon: 'っ',
    intro: {
      say: 'ちいさい つ は、いきを ちょっと とめる しるし だよ。',
      caption: 'ちいさい「っ」は いきを とめる しるし',
    },
    cards: [
      { show: 'はっぱ', word: 'はっぱ', emoji: '🍃', say: 'は、っ、ぱ。 はっぱ。' },
      { show: 'らっぱ', word: 'らっぱ', emoji: '🎺', say: 'ら、っ、ぱ。 らっぱ。' },
      { show: 'きっぷ', word: 'きっぷ', emoji: '🎫', say: 'き、っ、ぷ。 きっぷ。' },
      { show: 'がっこう', word: 'がっこう', emoji: '🏫', say: 'が、っ、こう。 がっこう。' },
    ],
    quiz: [
      { say: 'はっぱ は どれかな?', caption: '「はっぱ」は どれかな?', answer: 'はっぱ', choices: ['はつぱ', 'はっぱ', 'はぱ'] },
      { say: 'らっぱ は どれかな?', caption: '「らっぱ」は どれかな?', answer: 'らっぱ', choices: ['らっぱ', 'らぱ', 'らつぱ'] },
    ],
    kana: ['っ'],
  },
  {
    id: 'long',
    title: 'のばす おと',
    icon: 'ー',
    intro: {
      say: 'おなじ おとが つづくと、ながく のばして よむよ。',
      caption: 'ながく のばして よむ ことば',
    },
    cards: [
      { show: 'おかあさん', word: 'おかあさん', emoji: '👩', say: 'おかあさん。 か あ で、かー と のばすよ。' },
      { show: 'おとうさん', word: 'おとうさん', emoji: '👨', say: 'おとうさん。 と う で、とー と のばすよ。' },
      { show: 'ぞう', word: 'ぞう', emoji: '🐘', say: 'ぞう。 ぞー と のばすよ。' },
      { show: 'こおり', word: 'こおり', emoji: '🧊', say: 'こおり。 こー と のばすよ。' },
      { show: 'とけい', word: 'とけい', emoji: '⏰', say: 'とけい。 けい は、けー と よむことが おおいよ。' },
    ],
    quiz: [
      { say: 'ぞう は どれかな?', caption: '「ぞう」は どれかな?', answer: 'ぞう', choices: ['そう', 'ぞう', 'ぞ'] },
      { say: 'こおり は どれかな?', caption: '「こおり」は どれかな?', answer: 'こおり', choices: ['こおり', 'こり', 'おり'] },
    ],
    kana: [],
  },
  {
    id: 'particle-wa',
    title: 'くっつきの は',
    icon: 'は',
    intro: {
      say: 'ことばの あとに くっつく は は、わ と よむよ。',
      caption: 'くっつきの「は」は「わ」と よむ',
    },
    cards: [
      { show: 'こんにちは', say: 'こんにちは。 さいごの は は、わ と よむよ。', caption: 'こんにちは (わ)' },
      { show: 'ねこは ねむい', emoji: '😴', say: '猫は眠い。 ねこわ ねむい、と よむよ。', caption: 'ねこは (わ) ねむい' },
      { show: 'わたしは げんき', emoji: '😊', say: '私は元気。', caption: 'わたしは (わ) げんき' },
    ],
    quiz: [
      {
        say: 'くっつきの は、 わ と よむ ほうは どれかな?',
        caption: '「わ」と よむ「は」は どれ?',
        answer: 'くまは',
        choices: ['はな', 'くまは', 'はし'],
      },
    ],
    kana: [],
  },
  {
    id: 'particle-e',
    title: 'くっつきの へ',
    icon: 'へ',
    intro: {
      say: 'いくところの あとに くっつく へ は、え と よむよ。',
      caption: 'くっつきの「へ」は「え」と よむ',
    },
    cards: [
      { show: 'うみへ いく', emoji: '🌊', say: '海へ行く。 うみえ いく、と よむよ。', caption: 'うみへ (え) いく' },
      { show: 'やまへ いく', emoji: '⛰️', say: '山へ行く。', caption: 'やまへ (え) いく' },
    ],
    quiz: [
      {
        say: 'え と よむ へ は どれかな?',
        caption: '「え」と よむ「へ」は どれ?',
        answer: 'いえへ',
        choices: ['へび', 'いえへ', 'へや'],
      },
    ],
    kana: [],
  },
  {
    id: 'particle-o',
    title: 'くっつきの を',
    icon: 'を',
    intro: {
      say: 'を は、ことばと ことばを つなぐ もじ。 お と おなじ おとで よむよ。',
      caption: '「を」は「お」と おなじ おと',
    },
    cards: [
      { show: 'ほんを よむ', emoji: '📖', say: '本を読む。', caption: 'ほんを よむ' },
      { show: 'ごはんを たべる', emoji: '🍚', say: 'ご飯を食べる。', caption: 'ごはんを たべる' },
      { show: 'えを かく', emoji: '🖍️', say: '絵を描く。', caption: 'えを かく' },
    ],
    quiz: [
      { say: 'ほんを よむ の を は どれかな?', caption: '「を」は どれかな?', answer: 'を', choices: ['お', 'を', 'と'] },
    ],
    kana: ['を'],
  },
];

/** カタカナの とくべつ レッスン */
export const KATA_SPECIAL_LESSONS: SpecialLesson[] = [
  {
    id: 'k-long',
    title: 'のばす ぼう',
    icon: 'ー',
    intro: {
      say: 'カタカナで ながく のばす ときは、ー の ぼうを かくよ。',
      caption: 'のばす ぼう「ー」',
    },
    cards: [
      { show: 'ケーキ', word: 'ケーキ', emoji: '🍰', say: 'ケーキ。 ケー と のばすよ。' },
      { show: 'ボール', word: 'ボール', emoji: '🏀', say: 'ボール。 ボー と のばすよ。' },
      { show: 'ラーメン', word: 'ラーメン', emoji: '🍜', say: 'ラーメン。 ラー と のばすよ。' },
      { show: 'ヒーロー', word: 'ヒーロー', emoji: '🦸', say: 'ヒーロー。 2かい のばすよ。' },
    ],
    quiz: [
      { say: 'ケーキ は どれかな?', caption: '「ケーキ」は どれかな?', answer: 'ケーキ', choices: ['ケキ', 'ケーキ', 'ケイキ'] },
      { say: 'ボール は どれかな?', caption: '「ボール」は どれかな?', answer: 'ボール', choices: ['ボール', 'ボル', 'ホール'] },
    ],
    kana: ['ー'],
  },
  {
    id: 'k-tenten',
    title: 'カタカナの てんてん',
    icon: 'ガ',
    intro: {
      say: 'カタカナも、てんてんを つけると おとが かわるよ。',
      caption: 'カタカナも てんてんで おとが かわるよ',
    },
    cards: [
      { show: 'カ＋゛＝ガ', word: 'ガム', emoji: '🍬', say: 'カ に てんてんで、ガ。 ガム の ガ。' },
      { show: 'サ＋゛＝ザ', word: 'ピザ', emoji: '🍕', say: 'サ に てんてんで、ザ。 ピザ の ザ。' },
      { show: 'タ＋゛＝ダ', word: 'ダンス', emoji: '💃', say: 'タ に てんてんで、ダ。 ダンス の ダ。' },
      { show: 'ハ＋゛＝バ', word: 'バナナ', emoji: '🍌', say: 'ハ に てんてんで、バ。 バナナ の バ。' },
    ],
    quiz: [
      { say: 'ガ は どれかな?', caption: '「ガ」は どれかな?', answer: 'ガ', choices: ['ガ', 'カ', 'ザ'] },
      { say: 'ダ は どれかな?', caption: '「ダ」は どれかな?', answer: 'ダ', choices: ['タ', 'ダ', 'バ'] },
      { say: 'ブ は どれかな?', caption: '「ブ」は どれかな?', answer: 'ブ', choices: ['フ', 'プ', 'ブ'] },
    ],
    kana: [],
  },
  {
    id: 'k-maru',
    title: 'カタカナの まる',
    icon: 'パ',
    intro: {
      say: 'ハ ヒ フ ヘ ホ に まるを つけると、パ ピ プ ペ ポ に なるよ。',
      caption: 'まるを つけると パピプペポ',
    },
    cards: [
      { show: 'ハ＋゜＝パ', word: 'パンダ', emoji: '🐼', say: 'ハ に まるで、パ。 パンダ の パ。' },
      { show: 'ヒ＋゜＝ピ', word: 'ピアノ', emoji: '🎹', say: 'ヒ に まるで、ピ。 ピアノ の ピ。' },
      { show: 'フ＋゜＝プ', word: 'プリン', emoji: '🍮', say: 'フ に まるで、プ。 プリン の プ。' },
      { show: 'ヘ＋゜＝ペ', word: 'ペンギン', emoji: '🐧', say: 'ヘ に まるで、ペ。 ペンギン の ペ。' },
      { show: 'ホ＋゜＝ポ', word: 'ポスト', emoji: '📮', say: 'ホ に まるで、ポ。 ポスト の ポ。' },
    ],
    quiz: [
      { say: 'パ は どれかな?', caption: '「パ」は どれかな?', answer: 'パ', choices: ['バ', 'パ', 'ハ'] },
      { say: 'ポ は どれかな?', caption: '「ポ」は どれかな?', answer: 'ポ', choices: ['ポ', 'ホ', 'ボ'] },
      { say: 'ピ は どれかな?', caption: '「ピ」は どれかな?', answer: 'ピ', choices: ['ビ', 'ヒ', 'ピ'] },
    ],
    kana: ['パ', 'ピ', 'プ', 'ペ', 'ポ'],
  },
  {
    id: 'k-small',
    title: 'ちいさい ャ ュ ョ',
    icon: 'ャ',
    intro: {
      say: 'カタカナにも ちいさい ヤ ユ ヨ が あるよ。 まえの もじと くっついて、ひとつの おとに なるよ。',
      caption: 'ちいさい「ャ ュ ョ」は まえの もじと くっつくよ',
    },
    cards: [
      { show: 'キ＋ャ＝キャ', word: 'キャベツ', emoji: '🥬', say: 'キ と ちいさい ヤ で、キャ。 キャベツ の キャ。' },
      { show: 'シ＋ャ＝シャ', word: 'シャツ', emoji: '👕', say: 'シ と ちいさい ヤ で、シャ。 シャツ の シャ。' },
      { show: 'ジ＋ュ＝ジュ', word: 'ジュース', emoji: '🧃', say: 'ジ と ちいさい ユ で、ジュ。 ジュース の ジュ。' },
      { show: 'チ＋ョ＝チョ', word: 'チョコレート', emoji: '🍫', say: 'チ と ちいさい ヨ で、チョ。 チョコレート の チョ。' },
    ],
    quiz: [
      { say: 'シャ は どれかな?', caption: '「シャ」は どれかな?', answer: 'シャ', choices: ['シヤ', 'シャ', 'サ'] },
      { say: 'ジュ は どれかな?', caption: '「ジュ」は どれかな?', answer: 'ジュ', choices: ['ジュ', 'ジユ', 'ジョ'] },
      { say: 'チョ は どれかな?', caption: '「チョ」は どれかな?', answer: 'チョ', choices: ['チョ', 'チヨ', 'チャ'] },
    ],
    kana: ['ャ', 'ュ', 'ョ'],
  },
  {
    id: 'k-tsu',
    title: 'ちいさい ッ',
    icon: 'ッ',
    intro: {
      say: 'カタカナの ちいさい ツ も、いきを ちょっと とめる しるし だよ。',
      caption: 'ちいさい「ッ」は いきを とめる しるし',
    },
    cards: [
      { show: 'ロボット', word: 'ロボット', emoji: '🤖', say: 'ロ、ボ、ッ、ト。 ロボット。' },
      { show: 'クッキー', word: 'クッキー', emoji: '🍪', say: 'ク、ッ、キー。 クッキー。' },
      { show: 'ラッパ', word: 'ラッパ', emoji: '🎺', say: 'ラ、ッ、パ。 ラッパ。' },
      { show: 'ヨット', word: 'ヨット', emoji: '⛵', say: 'ヨ、ッ、ト。 ヨット。' },
    ],
    quiz: [
      { say: 'ロボット は どれかな?', caption: '「ロボット」は どれかな?', answer: 'ロボット', choices: ['ロボト', 'ロボット', 'ロボツト'] },
      { say: 'クッキー は どれかな?', caption: '「クッキー」は どれかな?', answer: 'クッキー', choices: ['クッキー', 'クキー', 'クツキー'] },
    ],
    kana: ['ッ'],
  },
];

export function findSpecialLesson(id: string): SpecialLesson | undefined {
  return SPECIAL_LESSONS.find((l) => l.id === id) ?? KATA_SPECIAL_LESSONS.find((l) => l.id === id);
}

export const ALL_SPECIAL_LESSONS: SpecialLesson[] = [...SPECIAL_LESSONS, ...KATA_SPECIAL_LESSONS];
