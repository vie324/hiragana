import { useEffect, useState } from 'react';
import { Btn, Emoji, Stars, TopBar } from '../components/ui';
import KanaGrid from '../components/KanaGrid';
import StrokeOrder from '../components/StrokeOrder';
import { SEION_ROWS, DAKUON_ROWS, YOUON_ROWS, sayKana } from '../lib/kana';
import { kanaExample, exampleSentence } from '../data/kanaInfo';
import { masteryStars } from '../lib/srs';
import { hasStrokes } from '../lib/strokes';
import { useApp } from '../state/store';
import { navigate } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './menus.css';

export default function ChartScreen() {
  const [tab, setTab] = useState<'seion' | 'daku' | 'youon'>('seion');
  const [detail, setDetail] = useState<string | null>(null);
  const [play, setPlay] = useState(0);
  const progress = useApp((s) => s.kana);

  useEffect(() => {
    void speak('もじを タッチすると よむよ。');
  }, []);

  const rows = tab === 'seion' ? SEION_ROWS : tab === 'daku' ? DAKUON_ROWS : YOUON_ROWS;
  const ex = detail ? kanaExample(detail) : null;

  const open = (k: string) => {
    sfx.tap();
    void speak(sayKana(k));
    setDetail(k);
    setPlay((p) => p + 1);
  };

  return (
    <div className="screen menu-screen chart-screen">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>🔤</Emoji>
          </>
        }
      >
        <div className="tabs">
          <button className={`tab ${tab === 'seion' ? 'on' : ''}`} onClick={() => setTab('seion')}>
            あいうえお
          </button>
          <button className={`tab ${tab === 'daku' ? 'on' : ''}`} onClick={() => setTab('daku')}>
            が ざ だ ば ぱ
          </button>
          <button className={`tab ${tab === 'youon' ? 'on' : ''}`} onClick={() => setTab('youon')}>
            きゃ きゅ きょ
          </button>
        </div>
      </TopBar>
      <div className="kana-grid-wrap">
        <KanaGrid
          rows={rows}
          testid="chart"
          onTap={open}
          cellClass={(k) => {
            const m = [...k].length === 1 ? masteryStars(progress[k]) : 0;
            return m ? `m${m}` : '';
          }}
          cellExtra={(k) => {
            const m = [...k].length === 1 ? masteryStars(progress[k]) : 0;
            return m ? <Stars n={m} /> : null;
          }}
        />
      </div>
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="chart-detail card pop-in" onClick={(e) => e.stopPropagation()}>
            <button className="chart-close" onClick={() => setDetail(null)} aria-label="とじる">
              <Emoji>✖️</Emoji>
            </button>
            <div className="chart-detail-main">
              <button className="chart-big" onClick={() => void speak(sayKana(detail))}>
                {detail}
              </button>
              {hasStrokes(detail) && (
                <div className="chart-order" onClick={() => setPlay((p) => p + 1)}>
                  <StrokeOrder kana={detail} playKey={play} />
                </div>
              )}
            </div>
            {ex && (
              <button
                className="chart-example"
                onClick={() => {
                  const s = exampleSentence(detail);
                  if (s) void speak(s.say, { caption: s.text });
                }}
              >
                <Emoji className="chart-ex-emoji">{ex.emoji}</Emoji>
                <span className="chart-ex-word">
                  {[...ex.word].map((c, i) => (
                    <span key={i} className={c === detail ? 'hl' : ''}>
                      {c}
                    </span>
                  ))}
                </span>
              </button>
            )}
            <div className="chart-actions">
              <Btn color="yellow" onClick={() => void speak(sayKana(detail))}>
                <Emoji>🔊</Emoji> きく
              </Btn>
              {hasStrokes(detail) && (
                <Btn color="blue" onClick={() => navigate({ name: 'writeKana', kana: detail })}>
                  <Emoji>✏️</Emoji> かく
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
