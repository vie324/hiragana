/**
 * アプリが よみあげる ぶんの いちらん (声の ファイルを まえもって つくるため)。
 * scripts/voice/catalog.ts から よばれる。アプリ本体には はいらない。
 *
 * - lines.ts の セリフは、はいりうる もじ・ことば ぜんぶで よびだして ぶんに わける
 * - ことば・えほん・レッスンの データは そのまま あつめる
 * - ソースに ちょくせつ かいてある セリフは scripts 側で ひろって staticTexts で わたす
 * - こどもの なまえ は NAME_MARK に して、なまえ いがいの ところだけ つくる
 */
import { L, WRITE_MODE_SAY } from './lines';
import { NAME_MARK, isTinyFragment, splitNames, splitSentences, voiceKey } from './split';
import { BASIC_KANA, K_BASIC_KANA, K_SMALL_KANA, K_WRITABLE_KANA, K_YOUON_ROWS, SMALL_KANA, WRITABLE_KANA, YOUON_ROWS, sayKana, splitUnits } from '../lib/kana';
import { KATA_WORDS, WORDS, lastSound, sayWord, type Word } from '../data/words';
import { ALL_BOOKS, fillTitle, tokenize } from '../data/books';
import { ALL_SPECIAL_LESSONS } from '../data/specialLessons';
import { OUTFITS } from '../data/outfits';
import { exampleSentence, kanaExample } from '../data/kanaInfo';
import { ALL_NODES, KATA_NODES, KATA_STAGES, STAGES } from '../data/curriculum';
import { findSpecialLesson } from '../data/specialLessons';
import { findBook } from '../data/books';
import { BUDDY_DEFAULT_NAMES, BUDDY_KIND_SAY, type BuddyKind } from '../state/store';
import { greeting } from '../lib/session';
import { MISSIONS } from '../data/missions';
import { MAX_LEVEL, streakWorthPraising } from '../state/progress';

export type Pack = 'kana' | 'word' | 'book' | 'ui';

export interface CatalogEntry {
  key: string;
  /** 声を つくる ときの テキスト (空白は ことばの くぎりとして のこす) */
  text: string;
  pack: Pack;
}

const uniq = <T,>(xs: Iterable<T>): T[] => [...new Set(xs)];

/** もじの ぶんるい */
const YOUON = [...YOUON_ROWS, ...K_YOUON_ROWS].flatMap((r) => r.cells.filter((c): c is string => !!c));
const SPECIAL_KANA = uniq(ALL_SPECIAL_LESSONS.flatMap((l) => l.kana));
const ALL_WORDS = [...WORDS, ...KATA_WORDS];
const WORD_UNITS = uniq(ALL_WORDS.flatMap((w) => splitUnits(w.w)));
const STAGE_KANA = uniq([...STAGES, ...KATA_STAGES].flatMap((s) => s.kana));
/** ゲームや レッスンに でてくる もじ */
const GAME_KANA = uniq([...BASIC_KANA, ...K_BASIC_KANA, ...SPECIAL_KANA, ...STAGE_KANA]);
/** とにかく よまれる かもしれない もじ */
const ALL_KANA = uniq([...WRITABLE_KANA, ...SMALL_KANA, ...K_WRITABLE_KANA, ...K_SMALL_KANA, ...YOUON, ...WORD_UNITS, ...SPECIAL_KANA, ...STAGE_KANA]);
const BUDDIES = Object.keys(BUDDY_DEFAULT_NAMES) as BuddyKind[];
const BUDDY_NAMES = BUDDIES.map((k) => BUDDY_DEFAULT_NAMES[k]);
/** なまえが ない ときは「きみ」 */
const NAMES = [NAME_MARK, 'きみ'];
const GREETINGS = uniq([new Date(2020, 0, 1, 8), new Date(2020, 0, 1, 12), new Date(2020, 0, 1, 20)].map((d) => greeting(d)));

function firstUnits(w: Word): string[] {
  return uniq([w.w[0], splitUnits(w.w)[0]]);
}

export function buildCatalog(staticTexts: readonly string[] = []): CatalogEntry[] {
  const map = new Map<string, CatalogEntry>();

  const addSentence = (s: string, pack: Pack) => {
    // なまえの ところは つくらない (アプリでは iPad の 声で よむ)
    const pieces = s.includes(NAME_MARK) ? splitNames(s, [NAME_MARK]) : [{ text: s }];
    for (const p of pieces) {
      if (!('text' in p)) continue;
      if (s.includes(NAME_MARK) && isTinyFragment(p.text)) continue;
      const key = voiceKey(p.text);
      if (!key || !/[\p{L}\p{N}]/u.test(key)) continue;
      const cur = map.get(key);
      // おなじ ぶんが いくつかの ところで つかわれるなら、ちいさい パックに いれる
      if (!cur) map.set(key, { key, text: p.text, pack });
      else if (PACK_ORDER.indexOf(pack) < PACK_ORDER.indexOf(cur.pack)) cur.pack = pack;
    }
  };
  const add = (text: string, pack: Pack) => {
    for (const s of splitSentences(text)) addSentence(s, pack);
  };

  // もじの おと
  for (const k of ALL_KANA) add(sayKana(k), 'kana');

  // ことば (よみあげ用)
  for (const w of ALL_WORDS) add(sayWord(w), 'word');

  // 1もじ レッスン・かく
  for (const k of GAME_KANA) {
    add(L.lessonIntro(k), 'kana');
    add(L.whichIs(k), 'kana');
    add(L.wroteGreat(k), 'kana');
    add(L.wrote(k), 'kana');
    add(L.correctKana(k), 'kana');
    add(L.onceMore(k), 'kana');
    add(L.learnKana(k), 'kana');
    add(L.balloonAsk(k), 'kana');
    add(L.balloonHit(k), 'kana');
    add(L.firstAsk(k), 'kana');
    for (const other of GAME_KANA) {
      add(L.findOther(other, k), 'kana');
      add(L.balloonMiss(other, k), 'kana');
    }
    const ex = kanaExample(k);
    if (ex) add(ex.say, 'word');
    const sentence = exampleSentence(k);
    if (sentence) add(sentence.say, 'kana');
  }
  for (const k of WRITABLE_KANA) {
    for (const mode of Object.values(WRITE_MODE_SAY)) add(L.writeKana(k, mode), 'kana');
    add(L.nameNext(k), 'kana');
    for (const n of NAMES) add(L.nameStart(n, k), 'kana');
  }
  for (const k of K_WRITABLE_KANA) {
    for (const mode of Object.values(WRITE_MODE_SAY)) add(L.writeKana(k, mode), 'kana');
  }
  // ことばづくりの まちがいの タイルは、ならった もじ なら なんでも でる
  for (const unit of ALL_KANA) {
    add(L.buildNext(unit), 'kana');
    add(L.buildMiss(unit, true), 'kana');
    add(L.buildMiss(unit, false), 'kana');
  }

  // ことばの ゲーム (しりとりは ひらがな だけ)
  const soundsOf = uniq(WORDS.map((w) => lastSound(w.w)));
  for (const w of ALL_WORDS) {
    for (const k of firstUnits(w)) {
      add(L.firstHit(w, k), 'word');
      add(L.firstMiss(w, k), 'word');
      add(L.memoryHit(w, k), 'word');
    }
    add(L.readHit(w), 'word');
    add(L.readMiss(w), 'word');
    add(L.buildAsk(w), 'word');
    add(L.buildDone(w), 'word');
  }
  for (const w of WORDS) {
    add(L.shiriStart(w), 'word');
    add(L.shiriHit(w), 'word');
    add(L.shiriAsk(w, lastSound(w.w)), 'word');
    for (const s of soundsOf) add(L.shiriMiss(w, s), 'word');
  }

  // えほん (あいぼうの なまえを かえた ときは、なまえと おなじく iPad の 声で よむ)
  for (const b of ALL_BOOKS) {
    for (const buddy of [...BUDDY_NAMES, NAME_MARK]) {
      const vars = { name: NAME_MARK, buddy };
      add(fillTitle(b.title, vars), 'book');
      for (const page of b.pages) {
        for (const line of tokenize(page.text, vars)) {
          for (const tok of line) addSentence(tok.say, 'book');
        }
      }
    }
  }

  // とくべつ レッスン
  for (const l of ALL_SPECIAL_LESSONS) {
    add(l.intro.say, 'kana');
    for (const c of l.cards) {
      add(c.say, 'kana');
      const parts = c.show.split(/[＋＝]/).filter((p) => p && !/^[゛゜]$/u.test(p));
      if (parts.length > 1) for (const p of parts) add(sayKana(p), 'kana');
    }
    for (const q of l.quiz) add(q.say, 'kana');
  }

  // マップ
  for (const n of [...ALL_NODES, ...KATA_NODES]) {
    if (n.kind === 'lesson' && n.kana) add(L.learnKana(n.kana[0]), 'ui');
    if (n.kind === 'special') add(L.specialLesson(findSpecialLesson(n.lessonId!)?.title ?? ''), 'ui');
    if (n.kind === 'book') {
      for (const buddy of [...BUDDY_NAMES, NAME_MARK]) add(L.bookNode(fillTitle(findBook(n.bookId!)?.title ?? '', { name: NAME_MARK, buddy })), 'ui');
    }
  }

  // あいぼう・あいさつ・ごほうび
  for (const n of NAMES) {
    add(L.love(n), 'ui');
    add(L.homeNext(n), 'ui');
    add(L.sleep(n), 'ui');
    add(L.chooseBuddy(n), 'ui');
    add(L.writeName(n), 'ui');
    add(L.nameDone(n), 'ui');
    for (const g of GREETINGS) add(L.hello(n, g), 'ui');
  }
  for (const k of BUDDIES) add(L.buddyIntro(BUDDY_KIND_SAY[k], BUDDY_DEFAULT_NAMES[k]), 'ui');
  for (const buddy of [...BUDDY_NAMES, NAME_MARK]) {
    add(L.buddyStart(buddy), 'ui');
    add(L.dressAsk(buddy), 'ui');
    for (const o of OUTFITS) add(L.gotOutfit(o.say, buddy), 'ui');
  }
  for (const o of OUTFITS) add(L.dressNice(o.say), 'ui');
  for (let n = 0; n <= 31; n++) add(L.stamps(n), 'ui');

  // ミッション・レベル・れんぞく
  for (const m of Object.values(MISSIONS)) add(m.say, 'ui');
  for (let n = 2; n <= MAX_LEVEL; n++) add(L.levelUp(n), 'ui');
  for (let n = 2; n <= 400; n++) if (streakWorthPraising(n)) add(L.streak(n), 'ui');

  // ソースに かいてある セリフ
  for (const t of staticTexts) add(t, 'ui');

  return [...map.values()].sort((a, b) => PACK_ORDER.indexOf(a.pack) - PACK_ORDER.indexOf(b.pack) || a.key.localeCompare(b.key, 'ja'));
}

export const PACK_ORDER: Pack[] = ['ui', 'kana', 'word', 'book'];
