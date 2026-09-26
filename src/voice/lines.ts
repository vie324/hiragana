/**
 * よみあげる セリフの うち、もじ・ことば・なまえが はいる もの。
 *
 * ここに まとめておくと、scripts/voice で すべての くみあわせを かぞえて
 * 声の ファイルを まえもって つくれる (src/voice/catalog.ts)。
 * あたらしい セリフを ふやしたら catalog.ts にも はいる もじ・ことばを かく。
 */
import { sayKana } from '../lib/kana';
import { sayWord, type Word } from '../data/words';

/** かく れんしゅうの モード (WriteKanaScreen) */
export const WRITE_MODE_SAY = {
  trace: 'なぞって かこう',
  faint: 'うすい もじを なぞって かこう',
  blank: 'おてほんを みないで かいて みよう',
} as const;

export const L = {
  // あいぼう・あいさつ
  love: (name: string) => `${name}、だいすき!`,
  hello: (name: string, greet: string) => `${name}、${greet}!`,
  homeNext: (name: string) => `${name}、つぎは なにに する?`,
  sleep: (name: string) => `${name}、きょうは たくさん がんばったね。また あした あそぼうね。おやすみなさい。`,
  chooseBuddy: (name: string) => `${name}、いっしょに あそぶ おともだちを えらんでね。`,
  buddyIntro: (kindSay: string, buddyName: string) => `${kindSay} ${buddyName} だよ。よろしくね!`,
  buddyStart: (buddyName: string) => `${buddyName}と いっしょに、ひらがなの ぼうけんに しゅっぱつ!`,
  dressAsk: (buddyName: string) => `${buddyName}に なにを つけてあげる?`,
  dressNice: (outfitSay: string) => `${outfitSay}、にあうね!`,
  gotOutfit: (outfitSay: string, buddyName: string) => `${outfitSay}を もらったよ! ${buddyName}に つけて あげたよ。`,
  stamps: (n: number) => (n > 30 ? 'スタンプが たくさん たまったよ!' : `スタンプが ${n}こ たまったよ!`),

  // ぼうけんマップ
  learnKana: (k: string) => `「${k}」を おぼえよう!`,
  specialLesson: (title: string) => `${title}の おべんきょう!`,
  bookNode: (title: string) => `えほん、${title}!`,

  // 1もじ レッスン
  lessonIntro: (k: string) => `これは、「${sayKana(k)}」。いっしょに いってみよう。`,
  whichIs: (k: string) => `「${sayKana(k)}」は どれかな?`,
  wroteGreat: (k: string) => `じょうず! 「${sayKana(k)}」が かけたね!`,
  wrote: (k: string) => `「${sayKana(k)}」が かけたね!`,
  correctKana: (k: string) => `せいかい! 「${sayKana(k)}」!`,
  onceMore: (k: string) => `もう いっかい。「${sayKana(k)}」は どれかな?`,
  findOther: (picked: string, k: string) => `これは「${sayKana(picked)}」。「${sayKana(k)}」を さがしてね。`,

  // かく
  writeKana: (k: string, modeSay: string) => `「${sayKana(k)}」を かこう。 ${modeSay}。`,
  writeName: (name: string) => `${name}の なまえを かこう!`,
  nameStart: (name: string, k: string) => `${name}の なまえを かこう! はじめは「${sayKana(k)}」。`,
  nameNext: (k: string) => `じょうず! つぎは「${sayKana(k)}」。`,
  nameDone: (name: string) => `やったあ! ${name}の なまえが かけたね! すごい!`,

  // ゲーム
  balloonAsk: (k: string) => `「${sayKana(k)}」の ふうせんを わってね。`,
  balloonHit: (k: string) => `「${sayKana(k)}」! あたり!`,
  balloonMiss: (got: string, k: string) => `これは「${sayKana(got)}」。「${sayKana(k)}」は どれかな?`,
  firstAsk: (k: string) => `「${sayKana(k)}」から はじまる もの、どれかな?`,
  firstHit: (w: Word, k: string) => `${sayWord(w)}! 「${sayKana(k)}」から はじまるね!`,
  firstMiss: (w: Word, first: string) => `${sayWord(w)}は、「${sayKana(first)}」から はじまるよ。`,
  memoryHit: (w: Word, k: string) => `${sayWord(w)}の「${sayKana(k)}」! ぴったり!`,
  readHit: (w: Word) => `${sayWord(w)}! よめたね!`,
  readMiss: (w: Word) => `これは ${sayWord(w)}。 もういちど、よんで みよう。`,
  buildAsk: (w: Word) => `${sayWord(w)}。 ${sayWord(w)}を つくろう!`,
  buildNext: (unit: string) => `つぎは「${sayKana(unit)}」だよ。`,
  buildDone: (w: Word) => `${sayWord(w)}! できたね!`,
  buildMiss: (unit: string, first: boolean) => `それは「${sayKana(unit)}」。 ${first ? 'はじめの' : 'つぎの'} おとは なにかな?`,
  shiriStart: (w: Word) => `しりとり しよう! はじめは ${sayWord(w)}。`,
  shiriAsk: (w: Word, sound: string) =>
    `${sayWord(w)}の さいごの おとは「${sayKana(sound)}」。「${sayKana(sound)}」から はじまる ものは どれかな?`,
  shiriHit: (w: Word) => `${sayWord(w)}! つながったね!`,
  shiriMiss: (w: Word, sound: string) =>
    `${sayWord(w)}は「${sayKana(w.w[0])}」から はじまるね。「${sayKana(sound)}」から はじまる ものを さがそう。`,
} as const;

export type LineKey = keyof typeof L;
