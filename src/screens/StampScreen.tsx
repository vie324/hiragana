import { useEffect, useState } from 'react';
import { Btn, Emoji, TopBar } from '../components/ui';
import { useApp, todayKey } from '../state/store';
import { speak } from '../lib/speech';
import './stamps.css';

const WEEK = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];

export default function StampScreen() {
  const days = useApp((s) => s.days);
  const [offset, setOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array.from({ length: first }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const stamps = Array.from({ length: count }, (_, i) => days[todayKey(new Date(year, month, i + 1))]?.stamp).filter(Boolean).length;
  const total = Object.values(days).filter((d) => d.stamp).length;

  useEffect(() => {
    void speak(total ? `スタンプが ${total}こ たまったよ!` : 'あそぶと スタンプが もらえるよ。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen stamp-screen">
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>💮</Emoji> スタンプ カード
          </>
        }
        right={
          <div className="stamp-total">
            <Emoji>💮</Emoji> {total}
          </div>
        }
      />
      <div className="stamp-card card">
        <div className="stamp-head">
          <Btn round size={64} color="white" onClick={() => setOffset((o) => o - 1)} aria-label="まえの つき">
            <Emoji>◀️</Emoji>
          </Btn>
          <div className="stamp-month">
            {month + 1}がつ <small>({stamps}こ)</small>
          </div>
          <Btn round size={64} color="white" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0} aria-label="つぎの つき">
            <Emoji>▶️</Emoji>
          </Btn>
        </div>
        <div className="stamp-grid">
          {WEEK.map((w) => (
            <div key={w} className="stamp-wd">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key = todayKey(new Date(year, month, d));
            const has = days[key]?.stamp;
            return (
              <div key={key} className={`stamp-day ${key === todayKey() ? 'today' : ''}`}>
                <span className="n">{d}</span>
                {has && <Emoji className="st">💮</Emoji>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
