import { beforeEach, describe, expect, it } from 'vitest';

// node には localStorage が ないので かんたんな ものを よういする
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
  },
});

const store = await import('./store');
const backup = await import('./backup');

const IMG = 'data:image/jpeg;base64,/9j/AAAA';

describe('backup', () => {
  beforeEach(() => {
    mem.clear();
    store.replaceData(store.defaultData());
  });

  it('ほぞんした ファイルを よみこめる (かおしゃしん も)', () => {
    store.update((d) => {
      d.profile.name = 'ゆい';
      d.kana['あ'] = { box: 2, ok: 3, ng: 0, last: 1, due: 2, intro: true, write: 1 } as never;
      d.faces.push({ id: 'f1', img: IMG, at: 1 });
      d.profile.buddyFace = 'f1';
    });
    const text = backup.backupPayload();
    store.replaceData(store.defaultData());
    const parsed = backup.parseBackup(text);
    expect(parsed.summary).toMatchObject({ name: 'ゆい', kana: 1, faces: 1 });
    backup.restoreBackup(parsed);
    expect(store.getData().profile.buddyFace).toBe('f1');
    expect(store.getData().faces[0].img).toBe(IMG);
  });

  it('このアプリの ファイルで なければ エラー', () => {
    expect(() => backup.parseBackup('{"hello": 1}')).toThrow();
    expect(() => backup.parseBackup('not json')).toThrow();
  });

  it('よみこむ まえの じょうたいに もどせる', () => {
    store.update((d) => void (d.profile.name = 'まえ'));
    const other = store.defaultData();
    other.profile.name = 'あと';
    backup.restoreBackup({ data: other, gallery: null });
    expect(store.getData().profile.name).toBe('あと');
    expect(backup.undoInfo()?.why).toBe('restore');
    expect(backup.applyUndo()).toBe(true);
    expect(store.getData().profile.name).toBe('まえ');
    expect(backup.undoInfo()).toBeNull();
  });

  it('リセットしても なまえ・かお・せっていは のこり、もとに もどせる', () => {
    store.update((d) => {
      d.profile.name = 'ゆい';
      d.faces.push({ id: 'f1', img: IMG, at: 1 });
      d.stickers['🐶'] = 3;
    });
    backup.resetKeepingProfile(store.defaultData());
    expect(store.getData().profile.name).toBe('ゆい');
    expect(store.getData().faces).toHaveLength(1);
    expect(store.getData().stickers['🐶']).toBeUndefined();
    expect(backup.undoInfo()?.why).toBe('reset');
    backup.applyUndo();
    expect(store.getData().stickers['🐶']).toBe(3);
  });

  it('あそんで いて しばらく とっていなければ バックアップを すすめる', () => {
    const now = Date.now();
    expect(backup.backupDue(now)).toBe(false);
    store.update((d) => {
      d.days['2026-01-01'] = { sec: 60, acts: 1, stamp: true };
      d.days['2026-01-02'] = { sec: 60, acts: 1, stamp: true };
    });
    expect(backup.backupDue(now)).toBe(true);
    backup.markBackedUp(now);
    expect(backup.backupDue(now + 86400_000)).toBe(false);
    expect(backup.backupDue(now + 15 * 86400_000)).toBe(true);
  });

  it('こわれた かおしゃしんは すてて、つかっていた ところも もどす', () => {
    const d = store.defaultData();
    d.faces = [{ id: 'ok', img: IMG, at: 1 }, { id: 'bad', img: 'javascript:alert(1)', at: 2 } as never];
    d.profile.buddyFace = 'bad';
    d.profile.avatar = 'face:bad';
    const n = store.normalizeData(JSON.parse(JSON.stringify(d)));
    expect(n.faces.map((f) => f.id)).toEqual(['ok']);
    expect(n.profile.buddyFace).toBeNull();
    expect(n.profile.avatar).toBe('🧒');
  });
});
