import { useEffect, useMemo, useRef, useState } from 'react';
import ParentGate from '../components/ParentGate';
import ActivityChart from './parent/ActivityChart';
import FaceSettings from './parent/FaceSettings';
import { back, resetTo } from '../state/router';
import {
  BUDDY_DEFAULT_NAMES,
  callName,
  defaultData,
  todayKey,
  update,
  useApp,
  type AppData,
  type BuddyKind,
  type FingerMode,
} from '../state/store';
import { grantExtraMinutes, remainingSeconds } from '../state/actions';
import { clearGallery, galleryKanaList, getNameSamples, getSamples } from '../state/gallery';
import {
  applyUndo,
  backupDue,
  backupPayload,
  currentSummary,
  isStandalone,
  lastBackupAt,
  markBackedUp,
  parseBackup,
  resetKeepingProfile,
  restoreBackup,
  saveBackupFile,
  shareImage,
  storageStatus,
  undoInfo,
} from '../state/backup';
import { hasGallery, renderGalleryImage } from '../state/galleryImage';
import { ALL_NODES } from '../data/curriculum';
import { BOOKS } from '../data/books';
import { SEION, SEION_ROWS, DAKUON_ROWS } from '../lib/kana';
import { masteryStars, isKnown } from '../lib/srs';
import { jaVoices, speak } from '../lib/speech';
import { greeting } from '../lib/session';
import { VOICES, currentVoice, onVoiceChange, voiceProgress } from '../voice/bank';
import { L } from '../voice/lines';
import type { WriteLevel } from '../lib/stroke';
import './parent.css';

type Tab = 'progress' | 'settings' | 'gallery' | 'data';

const HIRAGANA_RE = /^[ぁ-ゖー]*$/;

function streak(days: AppData['days']): number {
  let n = 0;
  const d = new Date();
  if (!days[todayKey(d)]?.acts) d.setDate(d.getDate() - 1);
  while (days[todayKey(d)]?.acts) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function Ink({ strokes, size = 64 }: { strokes: [number, number][][]; size?: number }) {
  return (
    <svg viewBox="0 0 109 109" width={size} height={size} className="ink-thumb">
      <rect x="1" y="1" width="107" height="107" rx="10" fill="#fffdf8" stroke="#f0e2d0" />
      <line x1="54.5" y1="6" x2="54.5" y2="103" stroke="#f5dcc0" strokeDasharray="3 3" />
      <line x1="6" y1="54.5" x2="103" y2="54.5" stroke="#f5dcc0" strokeDasharray="3 3" />
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.map(([x, y], j) => `${j ? 'L' : 'M'}${x},${y}`).join(' ')}
          fill="none"
          stroke="#e2691a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function ProgressTab() {
  const d = useApp((s) => s);
  const [sel, setSel] = useState<string | null>(null);
  const today = d.days[todayKey()];
  const knownSeion = SEION.filter((k) => isKnown(d.kana[k])).length;
  const introduced = SEION.filter((k) => d.kana[k]?.intro).length;
  const nodesDone = ALL_NODES.filter((n) => d.nodes[n.id]).length;
  const bookReads = Object.values(d.books).reduce((a, b) => a + b.reads, 0);
  const weak = Object.entries(d.kana)
    .filter(([, p]) => p.ng >= 2 && p.ng >= p.ok * 0.5)
    .sort((a, b) => b[1].ng / (b[1].ok + 1) - a[1].ng / (a[1].ok + 1))
    .slice(0, 8)
    .map(([k]) => k);
  const p = sel ? d.kana[sel] : undefined;

  return (
    <>
      <div className="parent-card">
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">今日の学習</span>
            <span className="stat-value">{Math.round((today?.sec ?? 0) / 60)}分</span>
          </div>
          <div className="stat">
            <span className="stat-label">連続</span>
            <span className="stat-value">{streak(d.days)}日</span>
          </div>
          <div className="stat">
            <span className="stat-label">読める文字(清音)</span>
            <span className="stat-value">
              {knownSeion}
              <small>/46</small>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">ならった文字</span>
            <span className="stat-value">
              {introduced}
              <small>/46</small>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">冒険マップ</span>
            <span className="stat-value">
              {nodesDone}
              <small>/{ALL_NODES.length}</small>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">絵本を読んだ回数</span>
            <span className="stat-value">{bookReads}回</span>
          </div>
        </div>
      </div>

      <div className="parent-card">
        <ActivityChart days={d.days} />
      </div>

      <div className="parent-card">
        <h2>文字ごとの習熟度</h2>
        <p className="note">
          ★1: ならった ／ ★2: 何度か正解 ／ ★3: 日をまたいで覚えていて、書く練習もした。文字をタップすると詳しい記録が見られます。
        </p>
        <div className="mastery-grid">
          {[...SEION_ROWS, ...DAKUON_ROWS].map((row) => (
            <div className="mastery-col" key={row.id}>
              {row.cells.map((k, i) =>
                k ? (
                  <button key={k} className={`mastery-cell m${masteryStars(d.kana[k])} ${sel === k ? 'sel' : ''}`} onClick={() => setSel(k)}>
                    <span>{k}</span>
                    <small>{'★'.repeat(masteryStars(d.kana[k])) || '·'}</small>
                  </button>
                ) : (
                  <span key={i} className="mastery-cell empty" />
                ),
              )}
            </div>
          ))}
        </div>
        {sel && (
          <div className="kana-detail">
            <b className="kd-kana">{sel}</b>
            {p ? (
              <ul>
                <li>レッスン: {p.intro ? '済み' : 'まだ'}</li>
                <li>
                  正解 {p.ok}回 ／ まちがい {p.ng}回
                </li>
                <li>
                  書いた回数 {p.write}回(最高 {'★'.repeat(p.writeBest) || 'なし'})
                </li>
                <li>最後に取り組んだ日: {p.last ? new Date(p.last).toLocaleDateString('ja-JP') : '—'}</li>
              </ul>
            ) : (
              <span className="note">まだ記録がありません</span>
            )}
          </div>
        )}
        {weak.length > 0 && (
          <div className="weak">
            <h3>まちがえやすい文字</h3>
            <div className="weak-list">
              {weak.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            <p className="note">ゲームでは、まちがえた文字が自動的に多めに出題されます。</p>
          </div>
        )}
      </div>

      <div className="parent-card">
        <h2>絵本</h2>
        <ul className="book-list">
          {BOOKS.map((b) => (
            <li key={b.id}>
              <span>{b.title.replace('{name}', d.profile.name || 'なまえ').replace('{buddy}', d.profile.buddyName)}</span>
              <span className="note">レベル{b.level}</span>
              <b>{d.books[b.id]?.reads ?? 0}回</b>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** iPad の 声の よみかた (たかめに すると かわいく きこえる) */
const IPAD_PRESETS = [
  { label: 'ふつう', pitch: 1.1, rate: 0.9 },
  { label: 'かわいく(高め)', pitch: 1.45, rate: 0.95 },
  { label: 'ゆっくり', pitch: 1.2, rate: 0.75 },
];

function VoiceStatus() {
  const [, force] = useState(0);
  useEffect(() => onVoiceChange(() => force((n) => n + 1)), []);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const voice = useApp((s) => s.settings.voice);
  if (voice === 'tts') return <small>iPadに入っている読み上げの声を使います。</small>;
  const info = currentVoice();
  const progress = voiceProgress();
  if (!info) return <small>声のデータを読み込んでいます…(はじめはインターネットが必要です)</small>;
  return (
    <small>
      {progress < 1 ? `声のデータを準備中… ${Math.round(progress * 100)}%(準備ができるまではiPadの声で読みます)` : '準備OK。オフラインでもこの声で読みます。'}
      <br />
      音声: {info.credit}(お子さまの名前など一部はiPadの声で読みます)
    </small>
  );
}

function SettingsTab() {
  const profile = useApp((s) => s.profile);
  const settings = useApp((s) => s.settings);
  const [name, setName] = useState(profile.name);
  const [buddyName, setBuddyName] = useState(profile.buddyName);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(jaVoices());
  const [remain, setRemain] = useState(remainingSeconds());

  useEffect(() => {
    const t = setInterval(() => setVoices(jaVoices()), 800);
    return () => clearInterval(t);
  }, []);

  const set = (fn: (d: AppData) => void) => update(fn);
  const nameOk = HIRAGANA_RE.test(name) && [...name].length <= 8;
  const buddyOk = HIRAGANA_RE.test(buddyName) && [...buddyName].length > 0 && [...buddyName].length <= 6;

  return (
    <>
      <div className="parent-card">
        <h2>お子さま</h2>
        <label className="field">
          <span>お名前(ひらがな)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.trim())}
            onBlur={() => nameOk && set((d) => void (d.profile.name = name))}
            lang="ja"
            maxLength={8}
            data-testid="settings-name"
          />
          {!nameOk && <em className="err">ひらがなで入力してください(8文字まで)</em>}
        </label>
        <div className="field">
          <span>よびかた</span>
          <div className="seg">
            {['ちゃん', 'くん', 'さん', ''].map((s) => (
              <button key={s || 'none'} className={profile.suffix === s ? 'on' : ''} onClick={() => set((d) => void (d.profile.suffix = s))}>
                {s ? `${profile.name || 'なまえ'}${s}` : 'よびすて'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FaceSettings />

      <div className="parent-card">
        <h2>あいぼう(キャラクター)</h2>
        <div className="field">
          <span>しゅるい</span>
          <div className="seg">
            {(Object.keys(BUDDY_DEFAULT_NAMES) as BuddyKind[]).map((k) => (
              <button
                key={k}
                className={profile.buddy === k ? 'on' : ''}
                onClick={() =>
                  set((d) => {
                    d.profile.buddy = k;
                    d.profile.buddyName = BUDDY_DEFAULT_NAMES[k];
                    setBuddyName(BUDDY_DEFAULT_NAMES[k]);
                  })
                }
              >
                {{ usagi: 'うさぎ', kuma: 'くま', neko: 'ねこ', hiyoko: 'ひよこ' }[k]}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>なまえ(ひらがな)</span>
          <input value={buddyName} onChange={(e) => setBuddyName(e.target.value.trim())} onBlur={() => buddyOk && set((d) => void (d.profile.buddyName = buddyName))} lang="ja" maxLength={6} />
          {!buddyOk && <em className="err">ひらがな1〜6文字で入力してください</em>}
        </label>
      </div>

      <div className="parent-card">
        <h2>読み上げ</h2>
        <div className="field">
          <span>声</span>
          <div className="seg">
            {VOICES.map((v) => (
              <button key={v.slug} className={settings.voice === v.slug ? 'on' : ''} onClick={() => set((d) => void (d.settings.voice = v.slug))} data-testid={`voice-${v.slug}`}>
                {v.name}
              </button>
            ))}
            <button className={settings.voice === 'tts' ? 'on' : ''} onClick={() => set((d) => void (d.settings.voice = 'tts'))} data-testid="voice-tts">
              iPadの声
            </button>
          </div>
          <VoiceStatus />
        </div>
        <button className="secondary" onClick={() => void speak(`${L.hello(callName(profile), greeting())} いっしょに あそぼう!`)} data-testid="voice-try">
          ▶ 試しに聞く
        </button>
        <details className="voice-ipad" open={settings.voice === 'tts'}>
          <summary>iPadの声の設定(お子さまの名前もこの声で読みます)</summary>
          <div className="field">
            <span>声の感じ</span>
            <div className="seg">
              {IPAD_PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  className={Math.abs(settings.pitch - pr.pitch) < 0.01 && Math.abs(settings.rate - pr.rate) < 0.01 ? 'on' : ''}
                  onClick={() =>
                    set((d) => {
                      d.settings.pitch = pr.pitch;
                      d.settings.rate = pr.rate;
                    })
                  }
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span>iPadの声の種類</span>
            <select
              value={settings.voiceURI ?? ''}
              onChange={(e) => set((d) => void (d.settings.voiceURI = e.target.value || null))}
            >
              <option value="">おまかせ(いちばん自然な声)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
            {voices.length === 0 && <small>日本語の声が見つかりません。iPadの「設定 → アクセシビリティ → 読み上げコンテンツ → 声」で日本語の声を追加してください。</small>}
            <small>「Kyoko(拡張)」などの高品質な声をダウンロードすると、より聞き取りやすくなります。</small>
          </label>
          <label className="field">
            <span>話す速さ: {settings.rate.toFixed(2)}</span>
            <input type="range" min="0.6" max="1.3" step="0.05" value={settings.rate} onChange={(e) => set((d) => void (d.settings.rate = Number(e.target.value)))} />
          </label>
          <label className="field">
            <span>声の高さ: {settings.pitch.toFixed(2)}</span>
            <input type="range" min="0.8" max="1.8" step="0.05" value={settings.pitch} onChange={(e) => set((d) => void (d.settings.pitch = Number(e.target.value)))} />
          </label>
        </details>
        <div className="field">
          <span>吹き出しに文字を表示</span>
          <div className="seg">
            <button className={settings.caption ? 'on' : ''} onClick={() => set((d) => void (d.settings.caption = true))}>
              表示する
            </button>
            <button className={!settings.caption ? 'on' : ''} onClick={() => set((d) => void (d.settings.caption = false))}>
              表示しない
            </button>
          </div>
        </div>
      </div>

      <div className="parent-card">
        <h2>音</h2>
        <div className="field">
          <span>効果音</span>
          <div className="seg">
            <button className={settings.sfx ? 'on' : ''} onClick={() => set((d) => void (d.settings.sfx = true))}>
              オン
            </button>
            <button className={!settings.sfx ? 'on' : ''} onClick={() => set((d) => void (d.settings.sfx = false))}>
              オフ
            </button>
          </div>
        </div>
        <div className="field">
          <span>BGM(ホーム画面など)</span>
          <div className="seg">
            <button className={settings.bgm ? 'on' : ''} onClick={() => set((d) => void (d.settings.bgm = true))}>
              オン
            </button>
            <button className={!settings.bgm ? 'on' : ''} onClick={() => set((d) => void (d.settings.bgm = false))}>
              オフ
            </button>
          </div>
        </div>
        <label className="field">
          <span>音量: {Math.round(settings.volume * 100)}%</span>
          <input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => set((d) => void (d.settings.volume = Number(e.target.value)))} />
        </label>
      </div>

      <div className="parent-card">
        <h2>書く練習</h2>
        <div className="field">
          <span>判定のきびしさ</span>
          <div className="seg">
            {(
              [
                ['easy', 'やさしい(おすすめ)'],
                ['normal', 'ふつう'],
                ['hard', 'きびしい'],
              ] as [WriteLevel, string][]
            ).map(([v, l]) => (
              <button key={v} className={settings.writeLevel === v ? 'on' : ''} onClick={() => set((d) => void (d.settings.writeLevel = v))}>
                {l}
              </button>
            ))}
          </div>
          <small>「やさしい」は書き順の向きが逆でも正解にします。慣れてきたら「ふつう」にすると、書き始めの位置と向きもチェックします。</small>
        </div>
        <div className="field">
          <span>指での入力</span>
          <div className="seg">
            {(
              [
                ['auto', '自動(ペンを使ったら指は無視)'],
                ['allow', '指でも書ける'],
                ['pen', 'ペンだけ'],
              ] as [FingerMode, string][]
            ).map(([v, l]) => (
              <button key={v} className={settings.finger === v ? 'on' : ''} onClick={() => set((d) => void (d.settings.finger = v))}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="parent-card">
        <h2>遊ぶ時間</h2>
        <div className="field">
          <span>1日に遊べる時間</span>
          <div className="seg">
            {[0, 10, 15, 20, 30, 45, 60].map((m) => (
              <button key={m} className={settings.limitMin === m ? 'on' : ''} onClick={() => set((d) => void (d.settings.limitMin = m))}>
                {m ? `${m}分` : 'せいげんなし'}
              </button>
            ))}
          </div>
          {settings.limitMin > 0 && (
            <small>今日の残り: {Math.max(0, Math.floor(remain / 60))}分</small>
          )}
        </div>
        {settings.limitMin > 0 && (
          <button
            className="secondary"
            onClick={() => {
              grantExtraMinutes(10);
              setRemain(remainingSeconds());
            }}
          >
            今日だけ10分のばす
          </button>
        )}
      </div>

      <div className="parent-card">
        <h2>冒険マップ</h2>
        <div className="field">
          <span>すべてのステージを開く</span>
          <div className="seg">
            <button className={!settings.unlockAll ? 'on' : ''} onClick={() => set((d) => void (d.settings.unlockAll = false))}>
              順番に進む(おすすめ)
            </button>
            <button className={settings.unlockAll ? 'on' : ''} onClick={() => set((d) => void (d.settings.unlockAll = true))}>
              すべて開く
            </button>
          </div>
          <small>すでに読める文字が多い場合は「すべて開く」にすると、好きなところから始められます。</small>
        </div>
      </div>
    </>
  );
}

function GalleryTab() {
  const list = galleryKanaList();
  const names = getNameSamples();
  return (
    <>
      <div className="parent-card">
        <h2>名前の練習</h2>
        {names.length === 0 ? (
          <p className="note">まだありません。「かく」→「なまえ を かく」で練習できます。</p>
        ) : (
          <div className="gallery-names">
            {names
              .slice()
              .reverse()
              .map((n) => (
                <div key={n.at} className="gallery-name">
                  <div className="row">
                    {n.chars.map((c, i) => (
                      <Ink key={i} strokes={c.strokes} size={72} />
                    ))}
                  </div>
                  <span className="note">{new Date(n.at).toLocaleDateString('ja-JP')}</span>
                </div>
              ))}
          </div>
        )}
      </div>
      <div className="parent-card">
        <h2>書いた文字</h2>
        <p className="note">左がはじめて書いた文字、右ほど最近の文字です。成長の記録にどうぞ。</p>
        {list.length === 0 && <p className="note">まだありません。</p>}
        <div className="gallery">
          {list.map((k) => (
            <div key={k} className="gallery-row">
              <b>{k}</b>
              <div className="row">
                {getSamples(k).map((s) => (
                  <div key={s.at} className="gallery-item">
                    <Ink strokes={s.strokes} />
                    <small>
                      {new Date(s.at).getMonth() + 1}/{new Date(s.at).getDate()} {'★'.repeat(s.stars)}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function fmtDate(t: number | string | null): string {
  if (!t) return '—';
  const d = new Date(t);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function DataTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [last, setLast] = useState(() => lastBackupAt());
  const [undo, setUndo] = useState(() => undoInfo());
  const [status, setStatus] = useState<{ persisted: boolean | null; usage: number | null }>({ persisted: null, usage: null });
  const standalone = isStandalone();
  const summary = currentSummary();

  useEffect(() => {
    void storageStatus().then(setStatus);
  }, []);

  const save = async () => {
    const r = await saveBackupFile();
    setLast(lastBackupAt());
    setMsg(
      r === 'shared'
        ? 'バックアップを保存しました。'
        : r === 'downloaded'
          ? 'バックアップを「ファイル」App の「ダウンロード」に保存しました。'
          : '保存をやめました。',
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(backupPayload());
      markBackedUp();
      setLast(lastBackupAt());
      setMsg('クリップボードにコピーしました。メモなどに貼り付けて保存できます。');
    } catch {
      setMsg('コピーできませんでした。');
    }
  };

  const onFile = async (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
      setMsg('');
    } catch {
      setPending(null);
      setMsg('読み込めませんでした。このアプリのバックアップファイルか確認してください。');
    }
  };

  const restore = () => {
    if (!pending) return;
    restoreBackup(pending);
    setPending(null);
    setUndo(undoInfo());
    setMsg('バックアップを読み込みました。');
  };

  const reset = () => {
    if (!window.confirm('学習の記録・シール・書いた文字をすべて消します。よろしいですか?')) return;
    if (!window.confirm('本当に消しますか?(1週間以内なら「元に戻す」で戻せます)')) return;
    resetKeepingProfile(defaultData());
    clearGallery();
    resetTo({ name: 'start' });
  };

  const galleryImage = async () => {
    const blob = await renderGalleryImage();
    if (!blob) return setMsg('画像を作れませんでした。');
    const r = await shareImage(blob, `hiragana-moji-${todayKey()}.png`);
    setMsg(r === 'cancelled' ? '' : r === 'shared' ? '画像を保存しました。' : '画像を「ファイル」App の「ダウンロード」に保存しました。');
  };

  return (
    <>
      <div className="parent-card" data-testid="save-status">
        <h2>記録の保存</h2>
        <p className="note">
          学習の記録・シール・顔写真などは、遊ぶたびに<b>このiPadの中へ自動で保存</b>されます(インターネットには送信しません)。
        </p>
        <ul className="save-status">
          <li>
            <span>保存場所</span>
            <b>{standalone ? 'ホーム画面のアプリ' : 'Safari'}</b>
          </li>
          <li>
            <span>消えにくくする設定</span>
            <b>{status.persisted === null ? '—' : status.persisted ? 'オン' : 'オフ(iPadの空きが少ないと消えることがあります)'}</b>
          </li>
          <li>
            <span>使っている容量</span>
            <b>{status.usage === null ? '—' : `${(status.usage / 1e6).toFixed(1)} MB`}</b>
          </li>
          <li>
            <span>最後のバックアップ</span>
            <b>{fmtDate(last)}</b>
          </li>
        </ul>
        {!standalone && (
          <p className="warn">
            いまはSafariで開いています。Safariとホーム画面のアプリでは、記録が別々に保存されます。共有ボタン →「ホーム画面に追加」で追加し、そちらで遊ぶのがおすすめです。Safariで遊んだ記録を移すときは、ここで「ファイルに保存」→ ホーム画面のアプリで「バックアップを読み込む」を使ってください。
          </p>
        )}
      </div>

      <div className="parent-card">
        <h2>バックアップ</h2>
        <p className="note">
          Safariの履歴・Webサイトデータを消去したり、iPadを買い替えたりすると、iPadの中の記録は消えてしまいます。ときどき「ファイルに保存」→「"ファイル"に保存」で <b>iCloud Drive</b> などに保存しておくと安心です。
        </p>
        <p className="note">
          いまの記録: {summary.name || '(名前なし)'} / 覚えた文字 {summary.kana} / シール {summary.stickers}まい / 顔写真 {summary.faces}まい / 遊んだ日 {summary.days}日
        </p>
        <div className="row gap">
          <button className="primary" onClick={() => void save()} data-testid="backup-save">
            ファイルに保存
          </button>
          <button className="secondary" onClick={() => void copy()}>
            コピー
          </button>
          <button className="secondary" onClick={() => fileRef.current?.click()} data-testid="backup-load">
            バックアップを読み込む
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json,text/plain" hidden onChange={(e) => void onFile(e.target.files?.[0])} data-testid="backup-input" />
        </div>
        {pending && (
          <div className="restore-confirm" data-testid="restore-confirm">
            <p>
              <b>{fmtDate(pending.summary.exportedAt)}</b> のバックアップ({pending.summary.name || '名前なし'} / 覚えた文字 {pending.summary.kana} / シール{' '}
              {pending.summary.stickers}まい / 顔写真 {pending.summary.faces}まい)で、いまの記録を上書きします。
            </p>
            <div className="row gap">
              <button className="primary" onClick={restore} data-testid="restore-ok">
                読み込む
              </button>
              <button className="secondary" onClick={() => setPending(null)}>
                やめる
              </button>
            </div>
          </div>
        )}
        {msg && <p className="msg">{msg}</p>}
      </div>

      {undo && (
        <div className="parent-card">
          <h2>元に戻す</h2>
          <p className="note">
            {fmtDate(undo.at)} に{undo.why === 'reset' ? '記録を消す' : 'バックアップを読み込む'}前の状態に戻せます(1週間まで)。
          </p>
          <button
            className="secondary"
            onClick={() => {
              if (!window.confirm('いまの記録を、その前の状態に戻します。よろしいですか?')) return;
              setMsg(applyUndo() ? '元に戻しました。' : '戻せませんでした。');
              setUndo(undoInfo());
            }}
            data-testid="undo"
          >
            元に戻す
          </button>
        </div>
      )}

      {hasGallery() && (
        <div className="parent-card">
          <h2>書いた文字を画像で保存</h2>
          <p className="note">お子さまが書いた文字を1枚の画像にします。共有シートの「画像を保存」で写真Appに残せます。</p>
          <button className="secondary" onClick={() => void galleryImage()} data-testid="gallery-image">
            画像にして保存
          </button>
        </div>
      )}

      <div className="parent-card">
        <h2>リセット</h2>
        <p className="note">名前・キャラクター・顔写真・設定は残したまま、学習の記録・シール・きせかえ・書いた文字を消して最初からやり直します。</p>
        <button className="danger" onClick={reset}>
          記録をすべて消す
        </button>
      </div>
      <div className="parent-card">
        <h2>このアプリについて</h2>
        <ul className="about">
          <li>ひらがな ぼうけん v{__APP_VERSION__}</li>
          <li>
            音声: <a href="https://voicevox.hiroshiba.jp/" target="_blank" rel="noreferrer">VOICEVOX</a>
            {VOICES.map((v) => ` / ${v.credit}`).join('')}(お子さまの名前などはiPadの読み上げ機能で読みます)
          </li>
          <li>
            書き順データ: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a> © Ulrich Apel(CC BY-SA 3.0)
          </li>
          <li>
            フォント: <a href="https://fonts.google.com/specimen/Klee+One" target="_blank" rel="noreferrer">Klee One</a> © The Klee Project Authors(SIL Open Font License 1.1)
          </li>
          <li>絵本のお話・キャラクターはこのアプリのオリジナルです(「おむすびころりん」「おおきなかぶ」は昔話をもとに書き下ろし)。</li>
        </ul>
      </div>
    </>
  );
}

export default function ParentScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('progress');
  const setupDone = useApp((s) => s.profile.setup);
  const [remind, setRemind] = useState(() => backupDue());
  const tabs = useMemo(
    () =>
      [
        ['progress', 'きろく'],
        ['settings', 'せってい'],
        ['gallery', '書いた文字'],
        ['data', 'データ'],
      ] as [Tab, string][],
    [],
  );

  const close = () => {
    if (!setupDone) resetTo({ name: 'start' });
    else back();
  };

  if (!unlocked) return <ParentGate onPass={() => setUnlocked(true)} onCancel={close} />;

  return (
    <div className="screen parent-screen ui">
      <div className="parent-head">
        <h1>おうちの方へ</h1>
        <div className="parent-tabs">
          {tabs.map(([t, l]) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)} data-testid={`ptab-${t}`}>
              {l}
            </button>
          ))}
        </div>
        <button className="parent-close" onClick={close} data-testid="parent-close">
          閉じる
        </button>
      </div>
      <div className="parent-scroll with-head">
        {remind && (
          <div className="parent-card remind" data-testid="backup-remind">
            <p>
              <b>バックアップのおすすめ:</b> {lastBackupAt() ? '前回のバックアップから2週間以上たちました。' : 'まだバックアップがありません。'}
              記録を iCloud Drive などに保存しておくと、Safariのデータを消したときやiPadを買い替えたときも安心です。
            </p>
            <div className="row gap">
              <button
                className="primary"
                onClick={() =>
                  void saveBackupFile().then((r) => {
                    if (r !== 'cancelled') setRemind(false);
                  })
                }
              >
                ファイルに保存
              </button>
              <button className="secondary" onClick={() => setRemind(false)}>
                あとで
              </button>
            </div>
          </div>
        )}
        {tab === 'progress' && <ProgressTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </div>
  );
}
