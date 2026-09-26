import { useCombo } from '../state/combo';
import './combo.css';

/** れんぞく せいかいの バッジ (2れんぞく から でる) */
export default function ComboBadge() {
  const n = useCombo();
  if (n < 2) return null;
  const tier = n >= 5 ? 'hot' : n >= 3 ? 'warm' : '';
  return (
    <div className={`combo-badge ${tier}`} key={n} data-testid="combo" data-combo={n} aria-live="polite">
      <span className="emoji">🔥</span>
      <b>{n}</b>
      <span className="combo-label">れんぞく!</span>
    </div>
  );
}
