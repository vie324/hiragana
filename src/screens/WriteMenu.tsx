import { useEffect, useState } from 'react';
import { Btn, Emoji, Stars, TopBar } from '../components/ui';
import KanaGrid from '../components/KanaGrid';
import { SEION_ROWS, DAKUON_ROWS, type KanaRow } from '../lib/kana';
import { navigate } from '../state/router';
import { useApp, callName } from '../state/store';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './menus.css';

const SMALL_ROWS: KanaRow[] = [
  { id: 'small1', name: 'ゃ', cells: ['ゃ', 'ゅ', 'ょ', 'っ', null] },
];

export default function WriteMenu({ tab: initial }: { tab?: string }) {
  const [tab, setTab] = useState(initial ?? 'seion');
  const kana = useApp((s) => s.kana);
  const profile = useApp((s) => s.profile);

  useEffect(() => {
    void speak('かきたい もじを えらんでね。');
  }, []);

  const rows = tab === 'seion' ? SEION_ROWS : [...DAKUON_ROWS, ...SMALL_ROWS];
  const list = rows.flatMap((r) => r.cells.filter((c): c is string => !!c));

  return (
    <div className="screen menu-screen write-menu">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>✏️</Emoji> かく
          </>
        }
      >
        <div className="tabs">
          <button className={`tab ${tab === 'seion' ? 'on' : ''}`} onClick={() => setTab('seion')}>
            あいうえお
          </button>
          <button className={`tab ${tab === 'daku' ? 'on' : ''}`} onClick={() => setTab('daku')}>
            が ぱ ゃ
          </button>
        </div>
      </TopBar>
      <div className="write-name-row">
        <Btn
          color="pink"
          onClick={() => {
            void speak(profile.name ? `${callName(profile)}の なまえを かこう!` : 'なまえを かこう!');
            navigate({ name: 'name' });
          }}
          data-testid="write-name"
        >
          <Emoji>📛</Emoji> {profile.name ? `「${profile.name}」を かく` : 'なまえを かく'}
        </Btn>
      </div>
      <div className="kana-grid-wrap">
        <KanaGrid
          rows={rows}
          testid="write"
          onTap={(k) => {
            sfx.tap();
            navigate({ name: 'writeKana', kana: k, list });
          }}
          cellClass={(k) => {
            const b = kana[k]?.writeBest ?? 0;
            return b ? `m${b}` : '';
          }}
          cellExtra={(k) => (kana[k]?.writeBest ? <Stars n={kana[k].writeBest} /> : null)}
        />
      </div>
    </div>
  );
}
