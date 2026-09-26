/** れんぞく せいかい (コンボ) の かず。画面が かわったら 0 に もどす */
import { useSyncExternalStore } from 'react';

let combo = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** せいかい: コンボを 1 ふやして その かずを かえす */
export function comboHit(): number {
  combo++;
  emit();
  return combo;
}

/** まちがい: コンボを きる */
export function comboMiss(): void {
  if (!combo) return;
  combo = 0;
  emit();
}

export function comboReset(): void {
  comboMiss();
}

export function getCombo(): number {
  return combo;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useCombo(): number {
  return useSyncExternalStore(subscribe, getCombo, getCombo);
}
