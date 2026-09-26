import { useEffect, useMemo, useRef, useState } from 'react';
import ParentGate from '../components/ParentGate';
import ActivityChart from './parent/ActivityChart';
import { back, resetTo } from '../state/router';
import {
  BUDDY_DEFAULT_NAMES,
  defaultData,
  exportJson,
  getData,
  normalizeData,
  replaceData,
  todayKey,
  update,
  useApp,
  type AppData,
  type BuddyKind,
  type FingerMode,
} from '../state/store';
import { grantExtraMinutes, remainingSeconds } from '../state/actions';
import { clearGallery, exportGallery, galleryKanaList, getNameSamples, getSamples, importGallery } from '../state/gallery';
import { ALL_NODES } from '../data/curriculum';
import { BOOKS } from '../data/books';
import { SEION, SEION_ROWS, DAKUON_ROWS } from '../lib/kana';
import { masteryStars, isKnown } from '../lib/srs';
import { jaVoices, speak } from '../lib/speech';
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
        <div className="field">
          <span>絵本に出てくる お子さまの絵</span>
          <div className="seg emoji-seg">
            {['👧', '👦', '🧒'].map((a) => (
              <button key={a} className={profile.avatar === a ? 'on' : ''} onClick={() => set((d) => void (d.profile.avatar = a))}>
                <span className="emoji">{a}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

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
        <label className="field">
          <span>声</span>
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
          <input type="range" min="0.8" max="1.5" step="0.05" value={settings.pitch} onChange={(e) => set((d) => void (d.settings.pitch = Number(e.target.value)))} />
        </label>
        <button className="secondary" onClick={() => void speak('こんにちは。いっしょに ひらがなを おぼえようね。')}>
          ▶ 試しに聞く
        </button>
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

function DataTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const payload = () => JSON.stringify({ app: 'hiragana-bouken', exportedAt: new Date().toISOString(), data: JSON.parse(exportJson()), gallery: exportGallery() });

  const download = () => {
    const blob = new Blob([payload()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hiragana-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg('バックアップを保存しました。');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload());
      setMsg('クリップボードにコピーしました。メモなどに貼り付けて保存できます。');
    } catch {
      setMsg('コピーできませんでした。');
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      const data = obj?.data ?? obj;
      if (!data || typeof data !== 'object' || !('profile' in data)) throw new Error('bad');
      if (!window.confirm('今の記録を、読み込んだバックアップで上書きします。よろしいですか?')) return;
      replaceData(normalizeData(data));
      if (obj.gallery) importGallery(obj.gallery);
      setMsg('バックアップを読み込みました。');
    } catch {
      setMsg('読み込めませんでした。このアプリのバックアップファイルか確認してください。');
    }
  };

  const reset = () => {
    if (!window.confirm('学習の記録・シール・書いた文字をすべて消します。よろしいですか?')) return;
    if (!window.confirm('本当に消しますか?(元に戻せません)')) return;
    const fresh = defaultData();
    const cur = getData();
    // なまえ・キャラクター・せっていは のこす
    fresh.settings = cur.settings;
    fresh.profile = cur.profile;
    replaceData(fresh);
    clearGallery();
    resetTo({ name: 'start' });
  };

  return (
    <>
      <div className="parent-card">
        <h2>バックアップ</h2>
        <p className="note">
          記録はこのiPadの中だけに保存されます(インターネットには送信しません)。Safariのデータを消去すると記録も消えるため、ときどきバックアップをおすすめします。
        </p>
        <div className="row gap">
          <button className="secondary" onClick={download}>
            ファイルに保存
          </button>
          <button className="secondary" onClick={() => void copy()}>
            コピー
          </button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>
            バックアップを読み込む
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
      <div className="parent-card">
        <h2>リセット</h2>
        <p className="note">名前・キャラクター・設定は残したまま、学習の記録・シール・きせかえ・書いた文字を消して最初からやり直します。</p>
        <button className="danger" onClick={reset}>
          記録をすべて消す
        </button>
      </div>
      <div className="parent-card">
        <h2>このアプリについて</h2>
        <ul className="about">
          <li>ひらがな ぼうけん v{__APP_VERSION__}</li>
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
        {tab === 'progress' && <ProgressTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'gallery' && <GalleryTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </div>
  );
}
