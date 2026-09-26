import { useState } from 'react';
import { update, useApp } from '../state/store';
import { replace } from '../state/router';
import './parent.css';

const HIRAGANA_RE = /^[ぁ-ゖー]*$/;

export default function SetupScreen() {
  const profile = useApp((s) => s.profile);
  const settings = useApp((s) => s.settings);
  const [name, setName] = useState(profile.name);
  const [suffix, setSuffix] = useState(profile.suffix);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [limit, setLimit] = useState(settings.limitMin);
  const valid = HIRAGANA_RE.test(name) && [...name].length <= 8;

  const next = () => {
    if (!valid) return;
    update((d) => {
      d.profile.name = name;
      d.profile.suffix = suffix;
      d.profile.avatar = avatar;
      d.settings.limitMin = limit;
    });
    replace({ name: 'buddy' });
  };

  return (
    <div className="screen parent-screen ui">
      <div className="parent-scroll">
        <div className="parent-card setup">
          <h1>はじめに(おうちの方へ)</h1>
          <p className="lead">
            「ひらがな ぼうけん」は、キャラクターといっしょに、ひらがなを<b>よむ・かく・えほんをよむ</b>まで、ひとりで楽しく進められる学習アプリです。
            文字はすべて音声で読み上げるので、字が読めなくても遊べます。
          </p>

          <label className="field">
            <span>お子さまのお名前(ひらがな)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.trim())}
              placeholder="れい: ゆい"
              inputMode="text"
              lang="ja"
              autoComplete="off"
              maxLength={8}
              data-testid="setup-name"
            />
            {!valid && <em className="err">ひらがなで入力してください(8文字まで)</em>}
            <small>名前の文字から練習できる「なまえをかこう」や、絵本の登場人物に使われます。あとから変更できます。</small>
          </label>

          <div className="field">
            <span>よびかた</span>
            <div className="seg">
              {['ちゃん', 'くん', 'さん', ''].map((s) => (
                <button key={s || 'none'} className={suffix === s ? 'on' : ''} onClick={() => setSuffix(s)}>
                  {s ? `${name || 'なまえ'}${s}` : 'よびすて'}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>えほんに出てくる お子さまの絵</span>
            <div className="seg emoji-seg">
              {['👧', '👦', '🧒'].map((a) => (
                <button key={a} className={avatar === a ? 'on' : ''} onClick={() => setAvatar(a)}>
                  <span className="emoji">{a}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>1日に遊べる時間</span>
            <div className="seg">
              {[0, 15, 20, 30, 45].map((m) => (
                <button key={m} className={limit === m ? 'on' : ''} onClick={() => setLimit(m)}>
                  {m ? `${m}分` : 'せいげんなし'}
                </button>
              ))}
            </div>
            <small>時間になると、キャラクターが「またあした」とお休みします。おうちの方の画面から延長できます。</small>
          </div>

          <div className="tips">
            <h2>iPadでのおすすめ設定</h2>
            <ol>
              <li>Safariの共有ボタン →「ホーム画面に追加」で、アプリのように全画面で使えます(オフラインでも動きます)。</li>
              <li>
                「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 日本語」から <b>Kyoko(拡張)</b> などの声をダウンロードすると、読み上げがより自然になります。
              </li>
              <li>「設定 → アクセシビリティ → アクセスガイド」を使うと、お子さまがアプリの外に出られないようにできます。</li>
              <li>Apple Pencil を使うと、手のひらが画面に触れても大丈夫です(ペンを使うと指の入力を自動で無視します)。</li>
            </ol>
          </div>

          <button className="primary" onClick={next} disabled={!valid} data-testid="setup-next">
            つぎへ(お子さまに渡してください)
          </button>
        </div>
      </div>
    </div>
  );
}
