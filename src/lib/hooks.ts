import { useEffect, useRef, useState } from 'react';

/** アンマウント後に 非同期の つづきを しないための フラグ */
export function useAlive(): React.MutableRefObject<boolean> {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive;
}

/** ms の あいだ なにも おきなかったら fn (deps が かわると リセット) */
export function useIdle(ms: number, fn: () => void, deps: unknown[], enabled = true): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    let t = setTimeout(function tick() {
      ref.current();
      t = setTimeout(tick, ms * 1.5);
    }, ms);
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(function tick() {
        ref.current();
        t = setTimeout(tick, ms * 1.5);
      }, ms);
    };
    window.addEventListener('pointerdown', reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', reset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, enabled, ...deps]);
}

/** たてむき(portrait) かどうか */
export function usePortrait(): boolean {
  const get = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const [p, setP] = useState(get);
  useEffect(() => {
    const on = () => setP(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return p;
}
