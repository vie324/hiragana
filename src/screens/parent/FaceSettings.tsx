import { useState } from 'react';
import FaceBadge from '../../components/FaceBadge';
import FaceCamera from '../../components/FaceCamera';
import { MAX_FACES, update, useApp } from '../../state/store';
import { addFace, removeFace } from '../../state/faces';

const KIND_EMOJI = { usagi: '🐰', kuma: '🐻', neko: '🐱', hiyoko: '🐤' } as const;

/** おうちの方の 画面: かおしゃしんを キャラクターに する */
export default function FaceSettings() {
  const faces = useApp((s) => s.faces);
  const profile = useApp((s) => s.profile);
  const [camera, setCamera] = useState(false);
  const [msg, setMsg] = useState('');

  return (
    <div className="parent-card" data-testid="face-settings">
      <h2>かおしゃしん(キャラクターになる)</h2>
      <p className="note">
        お子さまやご家族の顔写真を入れると、あいぼうの顔や、絵本に出てくるお子さまの絵になります。写真はこのiPadの中だけに保存され、インターネットには送信しません(バックアップファイルには含まれます)。
      </p>
      <div className="face-list">
        {faces.map((f) => (
          <div key={f.id} className="face-item">
            <FaceBadge img={f.img} size={84} />
            <button
              className="face-del"
              aria-label="この写真を消す"
              onClick={() => {
                if (window.confirm('この写真を消しますか?')) removeFace(f.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {faces.length < MAX_FACES && (
          <button className="face-add" onClick={() => setCamera(true)} data-testid="face-add">
            <span className="emoji">📷</span>
            <span>写真を入れる</span>
          </button>
        )}
      </div>
      {msg && <p className="msg">{msg}</p>}

      {faces.length > 0 && (
        <div className="field">
          <span>あいぼうの顔</span>
          <div className="seg emoji-seg">
            <button className={!profile.buddyFace ? 'on' : ''} onClick={() => update((d) => void (d.profile.buddyFace = null))}>
              <span className="emoji">{KIND_EMOJI[profile.buddy]}</span>
            </button>
            {faces.map((f) => (
              <button key={f.id} className={profile.buddyFace === f.id ? 'on' : ''} onClick={() => update((d) => void (d.profile.buddyFace = f.id))} data-testid={`buddy-face-${f.id}`}>
                <FaceBadge img={f.img} size={44} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field">
        <span>絵本に出てくる お子さま</span>
        <div className="seg emoji-seg">
          {['👧', '👦', '🧒'].map((a) => (
            <button key={a} className={profile.avatar === a ? 'on' : ''} onClick={() => update((d) => void (d.profile.avatar = a))}>
              <span className="emoji">{a}</span>
            </button>
          ))}
          {faces.map((f) => (
            <button key={f.id} className={profile.avatar === `face:${f.id}` ? 'on' : ''} onClick={() => update((d) => void (d.profile.avatar = `face:${f.id}`))} data-testid={`avatar-face-${f.id}`}>
              <FaceBadge img={f.img} size={44} />
            </button>
          ))}
        </div>
        {faces.length > 0 && <small>顔写真は、シール帳のシールとしても使えます。</small>}
      </div>

      {camera && (
        <FaceCamera
          onClose={() => setCamera(false)}
          onSave={(img) => {
            const first = faces.length === 0;
            const id = addFace(img);
            setCamera(false);
            setMsg(id ? (first ? '写真を入れました。あいぼうの顔と絵本のお子さまに使います(下で変えられます)。' : '写真を入れました。') : `写真は${MAX_FACES}枚までです。`);
          }}
        />
      )}
    </div>
  );
}
