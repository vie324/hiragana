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

/**
 * ms の あいだ なにも おきなかったら fn を よぶ (deps が かわると リセット)。
 * こどもが はなれていても しゃべりつづけないよう、タッチが あるまでは max かいまで。
 */
export function useIdle(ms: number, fn: () => void, deps: unknown[], enabled = true, max = 2): void {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    let count = 0;
    let t: ReturnType<typeof setTimeout> | undefined;
    const schedule = (delay: number) => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (count >= max) return;
        count++;
        ref.current();
        schedule(ms * 1.5);
      }, delay);
    };
    const reset = () => {
      count = 0;
      schedule(ms);
    };
    schedule(ms);
    window.addEventListener('pointerdown', reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', reset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, enabled, max, ...deps]);
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
