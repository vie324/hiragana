import { useEffect, useState } from 'react';
import KanaGrid from '../KanaGrid';
import { Btn, Emoji } from '../ui';
import { DAKUON_ROWS, K_DAKUON_ROWS, K_SEION_ROWS, SEION_ROWS, type KanaRow } from '../../lib/kana';
import { normalizeLetterText, sayLetterChar } from '../../data/letters';
import { useApp } from '../../state/store';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import '../../screens/menus.css';
import '../../screens/letter/letters.css';

type Tab = 'seion' | 'daku' | 'small' | 'kata' | 'kdaku' | 'mark';

const SMALL_ROWS: KanaRow[] = [
  { id: 'ks1', name: 'ゃ', cells: ['ゃ', 'ゅ', 'ょ', 'っ', 'ー'] },
  { id: 'ks2', name: 'ぁ', cells: ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'] },
  { id: 'ks3', name: 'ャ', cells: ['ャ', 'ュ', 'ョ', 'ッ', null] },
  { id: 'ks4', name: 'ァ', cells: ['ァ', 'ィ', 'ゥ', 'ェ', 'ォ'] },
];

const MARK_ROWS: KanaRow[] = [
  { id: 'mk1', name: '！', cells: ['！', '？', '♡', '〜', 'ー'] },
  { id: 'mk2', name: '、', cells: ['、', '。', null, null, null] },
];

const TABS: { id: Tab; label: string; rows: KanaRow[]; kata?: boolean }[] = [
  { id: 'seion', label: 'あいう', rows: SEION_ROWS },
  { id: 'daku', label: 'がぱ', rows: DAKUON_ROWS },
  { id: 'small', label: 'ゃっー', rows: SMALL_ROWS },
  { id: 'kata', label: 'アイウ', rows: K_SEION_ROWS, kata: true },
  { id: 'kdaku', label: 'ガパ', rows: K_DAKUON_ROWS, kata: true },
  { id: 'mark', label: '♡！', rows: MARK_ROWS },
];

interface Props {
  /** うえに だす ことば (「なまえを いれてね」など) */
  title: string;
  initial?: string;
  max: number;
  /** くうはく (ことばの くぎり) を つかえる */
  space?: boolean;
  onDone: (text: string) => void;
  onCancel: () => void;
}

/** こどもでも つかえる 50おんの キーボード (ボタンを おすと よみあげる) */
export default function KanaKeyboard({ title, initial = '', max, space = true, onDone, onCancel }: Props) {
  const kata = useApp((s) => s.settings.kata);
  const [text, setText] = useState(initial);
  const [tab, setTab] = useState<Tab>('seion');
  const chars = [...text];
  const ok = normalizeLetterText(text).length > 0;

  useEffect(() => {
    void speak(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (k: string) => {
    if (chars.length >= max) {
      sfx.locked();
      return;
    }
    sfx.tap();
    void speak(sayLetterChar(k));
    setText((t) => t + k);
  };

  const rows = TABS.find((t) => t.id === tab)!.rows;

  return (
    <div className="overlay kk-overlay">
      <div className="kk-card card pop-in" data-testid="kana-keyboard">
        <div className="kk-head">
          <div className="kk-title">{title}</div>
          <button className="kk-close" onClick={onCancel} aria-label="やめる">
            <Emoji>✖️</Emoji>
          </button>
        </div>
        <div className="kk-display" data-testid="kk-display">
          {chars.map((c, i) => (
            <span key={i} className={c === ' ' ? 'kk-sp' : ''}>
              {c === ' ' ? '' : c}
            </span>
          ))}
          <i className="kk-caret" />
          <span className="kk-count">
            {chars.length}/{max}
          </span>
        </div>
        <div className="kk-tabs">
          {TABS.filter((t) => !t.kata || kata).map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)} data-testid={`kk-tab-${t.id}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="kk-grid">
          <KanaGrid rows={rows} testid="key" onTap={(k) => add(k)} />
        </div>
        <div className="kk-actions">
          <Btn
            color="white"
            onClick={() => {
              setText((t) => [...t].slice(0, -1).join(''));
            }}
            disabled={!chars.length}
            data-testid="kk-back"
          >
            <Emoji>⬅️</Emoji> けす
          </Btn>
          {space && (
            <Btn
              color="white"
              onClick={() => chars.length && chars[chars.length - 1] !== ' ' && chars.length < max && setText((t) => t + ' ')}
              data-testid="kk-space"
            >
              <span className="kk-space-icon" aria-hidden>
                ⎵
              </span>{' '}
              あける
            </Btn>
          )}
          <Btn
            color="green"
            className={ok ? 'pulse' : ''}
            onClick={() => ok && onDone(normalizeLetterText(text))}
            disabled={!ok}
            data-testid="kk-done"
          >
            <Emoji>✅</Emoji> できた
          </Btn>
        </div>
      </div>
    </div>
  );
}
