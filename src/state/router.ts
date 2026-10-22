/** かんたんな 画面の きりかえ (スタック方式) */
import { useSyncExternalStore } from 'react';
import type { Script } from '../lib/kana';

export type Route =
  | { name: 'start' }
  | { name: 'setup' }
  | { name: 'buddy' }
  | { name: 'home' }
  | { name: 'map'; focus?: string }
  | { name: 'lesson'; kana: string; nodeId?: string }
  | { name: 'special'; lessonId: string; nodeId?: string }
  | { name: 'balloon'; kana?: string[]; nodeId?: string; script?: Script }
  | { name: 'firstsound'; kana?: string[]; nodeId?: string; script?: Script }
  | { name: 'wordbuild'; nodeId?: string; pool?: string[]; script?: Script }
  | { name: 'readquiz'; nodeId?: string; pool?: string[]; script?: Script }
  | { name: 'memory'; nodeId?: string; script?: Script }
  | { name: 'shiritori' }
  | { name: 'play' }
  | { name: 'write'; tab?: string }
  | { name: 'writeKana'; kana: string; list?: string[]; nodeId?: string }
  | { name: 'name' }
  | { name: 'chart' }
  | { name: 'books' }
  | { name: 'book'; id: string; nodeId?: string }
  | { name: 'stickers' }
  | { name: 'dressup' }
  | { name: 'stamps' }
  | { name: 'tree' }
  | { name: 'letters'; focus?: string }
  | { name: 'letterTo' }
  | { name: 'letter'; id: string; step: LetterStep }
  | { name: 'letterView'; id: string }
  | { name: 'parent' }
  | { name: 'sleep' };

/** てがみを つくる じゅんばん: ぶん → かく → かざる → ポスト */
export type LetterStep = 'msg' | 'write' | 'deco' | 'post';

export type RouteName = Route['name'];

let stack: Route[] = [{ name: 'start' }];
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export function navigate(r: Route): void {
  stack = [...stack, r];
  emit();
}

export function replace(r: Route): void {
  stack = [...stack.slice(0, -1), r];
  emit();
}

export function back(): void {
  if (stack.length > 1) stack = stack.slice(0, -1);
  else stack = [{ name: 'home' }];
  emit();
}

export function resetTo(r: Route): void {
  stack = [r];
  emit();
}

/** まえに ひらいた おなじ 画面まで もどって r に する (なければ ホームの つぎに r) */
export function backTo(r: Route): void {
  const i = stack.map((x) => x.name).lastIndexOf(r.name);
  stack = i >= 0 ? [...stack.slice(0, i), r] : [{ name: 'home' }, r];
  emit();
}

/** home を ねもとに して ひらく */
export function goHome(): void {
  resetTo({ name: 'home' });
}

export function currentRoute(): Route {
  return stack[stack.length - 1];
}

export function stackDepth(): number {
  return stack.length;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useRoute(): { route: Route; version: number; depth: number } {
  const v = useSyncExternalStore(subscribe, () => version);
  return { route: currentRoute(), version: v, depth: stack.length };
}
