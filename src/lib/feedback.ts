/**
 * こたえた ときの ごほうび えんしゅつ:
 * せいかいで ほしが うえの すすみぐあいへ とんでいき、れんぞく せいかいで コンボが ふえる。
 */
import { comboHit, comboMiss } from '../state/combo';
import { sfx } from './sound';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** el の ばしょから ほしを とばす (すすみぐあいの まるが あれば そこへ) */
export function flyStar(from: Element | null | undefined): void {
  if (!from || typeof document === 'undefined' || reduced()) return;
  const r = from.getBoundingClientRect();
  if (!r.width && !r.height) return;
  const target = document.querySelector('.progress-dots i.now') ?? document.querySelector('.progress-dots');
  const t = target?.getBoundingClientRect();
  const x0 = r.left + r.width / 2;
  const y0 = r.top + r.height / 2;
  const x1 = t ? t.left + t.width / 2 : window.innerWidth / 2;
  const y1 = t ? t.top + t.height / 2 : 40;
  const star = document.createElement('div');
  star.className = 'fly-star';
  star.textContent = '⭐';
  star.setAttribute('aria-hidden', 'true');
  document.body.appendChild(star);
  const midX = (x0 + x1) / 2 + (x0 < x1 ? -60 : 60);
  const midY = Math.min(y0, y1) - 60;
  const anim = star.animate?.(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(0.4)`, opacity: 0 },
      { transform: `translate(${x0}px, ${y0 - 50}px) scale(1.4)`, opacity: 1, offset: 0.22 },
      { transform: `translate(${midX}px, ${midY}px) scale(1.1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.5)`, opacity: 0.4 },
    ],
    { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.3, 1)' },
  );
  const done = () => {
    star.remove();
    if (target) {
      target.classList.remove('got');
      void (target as HTMLElement).offsetWidth;
      target.classList.add('got');
    }
  };
  if (anim) anim.onfinish = done;
  else setTimeout(done, 900);
}

/** せいかい: ほしを とばして コンボを ふやす */
export function goodAnswer(el?: Element | null): number {
  const n = comboHit();
  flyStar(el);
  if (n >= 2) setTimeout(() => sfx.combo(n), 220);
  return n;
}

/** まちがい: コンボが きれる */
export function badAnswer(): void {
  comboMiss();
}
