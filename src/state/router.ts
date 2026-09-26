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
  | { name: 'parent' }
  | { name: 'sleep' };

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
