/**
 * てがみの おうちの方むけ の そうさ (画像に して おくる・けす)。
 * おうちの方の ことばは よみあげないので、こどもの 画面とは べつの ファイルに おく。
 */
import { letterFileName, renderLetterBlob } from '../../components/letter/letterImage';
import { shareImage } from '../../state/backup';
import { deleteLetter, type Letter } from '../../state/letters';

export const LETTER_PARENT_TEXT = {
  label: 'おうちの方',
  share: '送る・保存',
  remove: '消す',
} as const;

/** てがみを 画像に して 共有シートへ (LINE・メール・写真 App・プリント)。おうちの方への メッセージを かえす */
export async function shareLetter(letter: Letter): Promise<string> {
  const blob = await renderLetterBlob(letter, 1600, 'image/jpeg');
  if (!blob) return '画像を作れませんでした。';
  const r = await shareImage(blob, letterFileName(letter));
  return r === 'cancelled'
    ? ''
    : r === 'shared'
      ? '手紙の画像を送りました(保存しました)。'
      : '手紙の画像を「ファイル」App の「ダウンロード」に保存しました。';
}

/** たしかめてから けす。けしたら true */
export function confirmDeleteLetter(letter: Letter): boolean {
  if (!window.confirm(`${letter.to ? `「${letter.to}へ」の` : ''}手紙を消します。よろしいですか?(元に戻せません)`)) return false;
  deleteLetter(letter.id);
  return true;
}
