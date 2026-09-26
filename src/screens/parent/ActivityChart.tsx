import { useState } from 'react';
import type { DayRecord } from '../../state/store';
import { todayKey } from '../../state/store';

interface Props {
  days: Record<string, DayRecord>;
  count?: number;
}

const W = 700;
const H = 230;
const PAD_L = 40;
const PAD_B = 34;
const PAD_T = 26;

/** さいきんの あそんだ じかん (ふん) — ぼうグラフ */
export default function ActivityChart({ days, count = 14 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const today = new Date();
  const data = Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (count - 1 - i));
    const key = todayKey(d);
    const rec = days[key];
    return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, min: Math.round((rec?.sec ?? 0) / 60), acts: rec?.acts ?? 0 };
  });
  const max = Math.max(10, ...data.map((d) => d.min));
  const step = max <= 10 ? 5 : max <= 30 ? 10 : max <= 60 ? 20 : 30;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const plotW = W - PAD_L - 8;
  const plotH = H - PAD_B - PAD_T;
  const slot = plotW / count;
  const bw = Math.min(24, slot - 8);
  const y = (v: number) => PAD_T + plotH - (v / top) * plotH;
  const maxIdx = data.reduce((m, d, i) => (d.min > data[m].min ? i : m), 0);

  const bar = (x: number, v: number) => {
    const h = Math.max(0, (v / top) * plotH);
    if (h <= 0) return '';
    const r = Math.min(4, h, bw / 2);
    const x0 = x - bw / 2;
    const y0 = PAD_T + plotH - h;
    const yb = PAD_T + plotH;
    return `M${x0},${yb} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + bw - r} Q${x0 + bw},${y0} ${x0 + bw},${y0 + r} V${yb} Z`;
  };

  return (
    <div className="viz-root activity-chart">
      <div className="viz-title">この2週間の遊んだ時間(分)</div>
      <div className="viz-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="この2週間の遊んだ時間">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth="1" />
              <text x={PAD_L - 8} y={y(t)} textAnchor="end" dominantBaseline="central" className="viz-tick">
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD_L + slot * i + slot / 2;
            const isToday = i === count - 1;
            return (
              <g key={d.key}>
                <path d={bar(cx, d.min)} fill="var(--series-1)" opacity={hover === null || hover === i ? 1 : 0.55} />
                {(i === maxIdx || isToday) && d.min > 0 && (
                  <text x={cx} y={y(d.min) - 7} textAnchor="middle" className="viz-value">
                    {d.min}
                  </text>
                )}
                {(i % 2 === 1 || isToday) && (
                  <text x={cx} y={H - 12} textAnchor="middle" className="viz-tick">
                    {isToday ? '今日' : d.label}
                  </text>
                )}
                <rect
                  x={cx - slot / 2}
                  y={PAD_T}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerDown={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="viz-tip" style={{ left: `${((PAD_L + slot * hover + slot / 2) / W) * 100}%` }}>
            <b>{data[hover].min}分</b>
            <span>
              {data[hover].label}・{data[hover].acts}回
            </span>
          </div>
        )}
      </div>
      <details className="viz-table">
        <summary>表で見る</summary>
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>時間(分)</th>
              <th>クリアした活動</th>
            </tr>
          </thead>
          <tbody>
            {data
              .slice()
              .reverse()
              .map((d) => (
                <tr key={d.key}>
                  <td>{d.label}</td>
                  <td>{d.min}</td>
                  <td>{d.acts}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
