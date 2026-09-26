import { useMemo, useState } from 'react';
import '../screens/parent.css';

interface Props {
  onPass: () => void;
  onCancel: () => void;
}

/** おとな むけ の かぎ (けいさん もんだい) */
export default function ParentGate({ onPass, onCancel }: Props) {
  const q = useMemo(() => {
    const a = 11 + Math.floor(Math.random() * 18);
    const b = 3 + Math.floor(Math.random() * 7);
    return { a, b, ans: a + b };
  }, []);
  const [input, setInput] = useState('');
  const [err, setErr] = useState(false);

  const press = (d: string) => {
    setErr(false);
    if (d === 'del') setInput((s) => s.slice(0, -1));
    else if (d === 'ok') {
      if (Number(input) === q.ans) onPass();
      else {
        setErr(true);
        setInput('');
      }
    } else if (input.length < 3) setInput((s) => s + d);
  };

  return (
    <div className="gate ui">
      <div className="gate-card">
        <h2>おうちの方へ</h2>
        <p>この先は保護者向けの画面です。次の計算の答えを入力してください。</p>
        <div className="gate-q" data-testid="gate-question" data-answer={q.ans}>
          {q.a} + {q.b} = <span className={`gate-in ${err ? 'err' : ''}`}>{input || '?'}</span>
        </div>
        <div className="gate-pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((d) => (
            <button key={d} className={`gate-key ${d === 'ok' ? 'ok' : ''}`} onClick={() => press(d)} data-testid={`gate-${d}`}>
              {d === 'del' ? '←' : d === 'ok' ? 'OK' : d}
            </button>
          ))}
        </div>
        <button className="gate-cancel" onClick={onCancel}>
          もどる
        </button>
      </div>
    </div>
  );
}
