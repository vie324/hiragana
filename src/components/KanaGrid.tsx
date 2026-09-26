import type { ReactNode } from 'react';
import type { KanaRow } from '../lib/kana';

interface Props {
  rows: KanaRow[];
  onTap: (kana: string, row: KanaRow) => void;
  cellClass?: (kana: string) => string;
  cellExtra?: (kana: string) => ReactNode;
  testid?: string;
}

/** 50音表 (みぎから ひだりへ、たて に ならぶ) */
export default function KanaGrid({ rows, onTap, cellClass, cellExtra, testid = 'cell' }: Props) {
  const n = Math.max(...rows.map((r) => r.cells.length));
  return (
    <div className="kana-grid" style={{ gridTemplateRows: `repeat(${n}, auto)` }}>
      {rows.flatMap((row) =>
        Array.from({ length: n }, (_, i) => {
          const k = row.cells[i];
          if (!k) return <div key={`${row.id}-${i}`} className="kana-cell empty" />;
          return (
            <button
              key={`${row.id}-${i}`}
              className={`kana-cell ${cellClass?.(k) ?? ''}`}
              onClick={() => onTap(k, row)}
              data-testid={`${testid}-${k}`}
            >
              <span className="k" style={[...k].length > 1 ? { fontSize: '0.8em' } : undefined}>
                {k}
              </span>
              {cellExtra?.(k)}
            </button>
          );
        }),
      )}
    </div>
  );
}
