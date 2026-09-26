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
      { say: 'こおり は どれかな?', caption: '「こおり」は どれかな?', answer: 'こおり', choices: ['こおり', 'こり', 'こうり'] },
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

export function findSpecialLesson(id: string): SpecialLesson | undefined {
  return SPECIAL_LESSONS.find((l) => l.id === id);
}
