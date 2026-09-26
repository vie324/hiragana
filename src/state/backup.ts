/**
 * バックアップ (ファイルに ほぞん・よみこみ) と、もとに もどす ための スナップショット。
 * きろくは iPad の なか (localStorage) に じどうで ほぞん される。
 * Safari の データを けすと きえるので、ファイルに して iCloud Drive などに のこせるように する。
 */
import { getData, normalizeData, replaceData, todayKey, type AppData } from './store';
import { exportGallery, importGallery } from './gallery';

export const APP_ID = 'hiragana-bouken';
const UNDO_KEY = 'hiragana-bouken:undo';
const META_KEY = 'hiragana-bouken:meta';
/** これより まえに バックアップしていたら おしらせ しない */
export const BACKUP_REMIND_DAYS = 14;

export interface BackupSummary {
  exportedAt: string | null;
  name: string;
  kana: number;
  stickers: number;
  faces: number;
  days: number;
}

interface Meta {
  lastBackupAt: number | null;
}

function readMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? '{}') as Partial<Meta>;
    return { lastBackupAt: typeof m.lastBackupAt === 'number' ? m.lastBackupAt : null };
  } catch {
    return { lastBackupAt: null };
  }
}

export function lastBackupAt(): number | null {
  return readMeta().lastBackupAt;
}

export function markBackedUp(at = Date.now()): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ ...readMeta(), lastBackupAt: at }));
  } catch {
    /* noop */
  }
}

/** バックアップを すすめる ほうが よいか (まなんだ きろくが あって、しばらく とっていない) */
export function backupDue(now = Date.now(), d: AppData = getData()): boolean {
  const played = Object.keys(d.days).length >= 2 || Object.keys(d.kana).length >= 3;
  if (!played) return false;
  const last = lastBackupAt();
  return !last || now - last > BACKUP_REMIND_DAYS * 86400_000;
}

export function backupPayload(): string {
  return JSON.stringify({ app: APP_ID, exportedAt: new Date().toISOString(), data: getData(), gallery: exportGallery() });
}

export function backupFileName(): string {
  return `hiragana-backup-${todayKey()}.json`;
}

function summarize(data: AppData, exportedAt: string | null): BackupSummary {
  return {
    exportedAt,
    name: data.profile.name,
    kana: Object.keys(data.kana).length,
    stickers: Object.values(data.stickers).reduce((a, b) => a + b, 0),
    faces: data.faces.length,
    days: Object.keys(data.days).length,
  };
}

export function currentSummary(): BackupSummary {
  return summarize(getData(), null);
}

/** ファイルの なかみを しらべる。このアプリの ものでなければ エラー */
export function parseBackup(text: string): { data: AppData; gallery: unknown; summary: BackupSummary } {
  const obj = JSON.parse(text) as { app?: string; exportedAt?: string; data?: unknown; gallery?: unknown } | null;
  const raw = obj && typeof obj === 'object' && 'data' in obj ? obj.data : obj;
  if (!raw || typeof raw !== 'object' || !('profile' in raw)) throw new Error('not a backup');
  const data = normalizeData(raw);
  return { data, gallery: obj?.gallery, summary: summarize(data, typeof obj?.exportedAt === 'string' ? obj.exportedAt : null) };
}

/** いまの きろくを のこしてから (もとに もどせるように)、バックアップで うわがき する */
export function restoreBackup(parsed: { data: AppData; gallery: unknown }): void {
  saveUndo('restore');
  replaceData(parsed.data);
  if (parsed.gallery) importGallery(parsed.gallery);
}

/* ---------- もとに もどす ---------- */

export type UndoReason = 'restore' | 'reset';

interface UndoSnapshot {
  at: number;
  why: UndoReason;
  data: AppData;
  gallery: unknown;
}

export function saveUndo(why: UndoReason): void {
  try {
    const snap: UndoSnapshot = { at: Date.now(), why, data: getData(), gallery: exportGallery() };
    localStorage.setItem(UNDO_KEY, JSON.stringify(snap));
  } catch {
    /* ようりょうが たりない ときは あきらめる */
  }
}

export function undoInfo(): { at: number; why: UndoReason } | null {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as UndoSnapshot;
    // 1しゅうかん たったら けす
    if (Date.now() - s.at > 7 * 86400_000) {
      localStorage.removeItem(UNDO_KEY);
      return null;
    }
    return { at: s.at, why: s.why };
  } catch {
    return null;
  }
}

export function applyUndo(): boolean {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as UndoSnapshot;
    replaceData(normalizeData(s.data));
    if (s.gallery) importGallery(s.gallery);
    localStorage.removeItem(UNDO_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ---------- ファイルに する ---------- */

/**
 * バックアップを ファイルに する。
 * iPad では 共有シート →「"ファイル"に保存」で iCloud Drive などに のこせる。
 * 共有できない ときは ダウンロード (「ファイル」App の ダウンロード フォルダ)。
 */
export async function saveBackupFile(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const text = backupPayload();
  const name = backupFileName();
  const file = new File([text], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'ひらがな ぼうけん バックアップ' });
      markBackedUp();
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
      // ほかの エラーは ダウンロードに きりかえる
    }
  }
  downloadBlob(new Blob([text], { type: 'application/json' }), name);
  markBackedUp();
  return 'downloaded';
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** 画像を 共有シートで (「画像を保存」で 写真 App へ)。できなければ ダウンロード */
export async function shareImage(blob: Blob, name: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], name, { type: blob.type || 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, name);
  return 'downloaded';
}

/* ---------- ほぞんの ようす ---------- */

/** ホーム画面から ひらいているか (Safari の タブでは ない) */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches);
}

export async function storageStatus(): Promise<{ persisted: boolean | null; usage: number | null }> {
  try {
    const persisted = (await navigator.storage?.persisted?.()) ?? null;
    const est = await navigator.storage?.estimate?.();
    return { persisted, usage: est?.usage ?? null };
  } catch {
    return { persisted: null, usage: null };
  }
}

/** おうちの方が「リセット」した ときも、もとに もどせるように のこす */
export function resetKeepingProfile(fresh: AppData): void {
  saveUndo('reset');
  const cur = getData();
  fresh.settings = cur.settings;
  fresh.profile = cur.profile;
  fresh.faces = cur.faces;
  replaceData(fresh);
}

