import { update, useApp, useScript } from '../state/store';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import type { Script } from '../lib/kana';
import './script-switch.css';

const ITEMS: { script: Script; label: string; say: string }[] = [
  { script: 'hira', label: 'ひらがな', say: 'ひらがな!' },
  { script: 'kata', label: 'カタカナ', say: 'カタカナ!' },
];

/** ひらがな ⇔ カタカナ の きりかえ (カタカナを かくす せっていなら ださない) */
export default function ScriptSwitch({ size = 'md', onChange }: { size?: 'md' | 'lg'; onChange?: (s: Script) => void }) {
  const script = useScript();
  const show = useApp((s) => s.settings.kata);
  if (!show) return null;
  return (
    <div className={`script-switch ${size} is-${script}`} role="tablist" aria-label="もじの しゅるい">
      <span className="script-thumb" aria-hidden />
      {ITEMS.map((it) => (
        <button
          key={it.script}
          role="tab"
          aria-selected={script === it.script}
          className={script === it.script ? 'on' : ''}
          onClick={() => {
            if (script === it.script) return;
            sfx.whoosh();
            update((d) => void (d.settings.script = it.script));
            void speak(it.say);
            onChange?.(it.script);
          }}
          data-testid={`script-${it.script}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
