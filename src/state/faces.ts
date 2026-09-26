/** かおしゃしんの ついか・さくじょ */
import { MAX_FACES, update, getData } from './store';

export function addFace(img: string): string | null {
  if (getData().faces.length >= MAX_FACES) return null;
  const id = `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  update((d) => {
    const first = d.faces.length === 0;
    d.faces.push({ id, img, at: Date.now() });
    // はじめての しゃしんは あいぼうと えほんの こどもに つかう
    if (first) {
      d.profile.buddyFace = id;
      d.profile.avatar = `face:${id}`;
    }
  });
  return id;
}

export function removeFace(id: string): void {
  update((d) => {
    d.faces = d.faces.filter((f) => f.id !== id);
    if (d.profile.buddyFace === id) d.profile.buddyFace = null;
    if (d.profile.avatar === `face:${id}`) d.profile.avatar = '🧒';
    for (const list of Object.values(d.placed)) {
      for (let i = list.length - 1; i >= 0; i--) if (list[i].s === `face:${id}`) list.splice(i, 1);
    }
  });
}
