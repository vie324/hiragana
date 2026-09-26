import { useEffect, useState } from 'react';
import { Btn, Emoji, Stars, TopBar } from '../components/ui';
import KanaGrid from '../components/KanaGrid';
import { ROWS, type KanaRow, type Script } from '../lib/kana';
import ScriptSwitch from '../components/ScriptSwitch';
import { navigate } from '../state/router';
import { useApp, callName, useScript } from '../state/store';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { L } from '../voice/lines';
import './menus.css';

const SMALL_ROWS: Record<Script, KanaRow[]> = {
  hira: [{ id: 'small1', name: 'ゃ', cells: ['ゃ', 'ゅ', 'ょ', 'っ', null] }],
  kata: [{ id: 'ksmall1', name: 'ャ', cells: ['ャ', 'ュ', 'ョ', 'ッ', 'ー'] }],
};

const TAB_LABEL: Record<Script, [string, string]> = {
  hira: ['あいうえお', 'が ぱ ゃ'],
  kata: ['アイウエオ', 'ガ パ ャ ー'],
};

export default function WriteMenu({ tab: initial }: { tab?: string }) {
  const [tab, setTab] = useState(initial ?? 'seion');
  const kana = useApp((s) => s.kana);
  const profile = useApp((s) => s.profile);
  const script = useScript();

  useEffect(() => {
    void speak('かきたい もじを えらんでね。');
  }, []);

  const rows = tab === 'seion' ? ROWS[script].seion : [...ROWS[script].dakuon, ...SMALL_ROWS[script]];
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
          <ScriptSwitch />
          <button className={`tab ${tab === 'seion' ? 'on' : ''}`} onClick={() => setTab('seion')}>
            {TAB_LABEL[script][0]}
          </button>
          <button className={`tab ${tab === 'daku' ? 'on' : ''}`} onClick={() => setTab('daku')}>
            {TAB_LABEL[script][1]}
          </button>
        </div>
      </TopBar>
      <div className="write-name-row">
        <Btn
          color="pink"
          onClick={() => {
            void speak(profile.name ? L.writeName(callName(profile)) : 'なまえを かこう!');
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
