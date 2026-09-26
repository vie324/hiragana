import { useEffect } from 'react';
import { Btn, Emoji, TopBar } from '../components/ui';
import Mascot from '../components/Mascot';
import FaceBadge from '../components/FaceBadge';
import { OUTFITS } from '../data/outfits';
import { KATA_NODES } from '../data/curriculum';
import { update, useApp, useBuddyFace } from '../state/store';
import { navigate } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import { L } from '../voice/lines';
import './stickers.css';
import './dressup.css';

const KIND_EMOJI = { usagi: '🐰', kuma: '🐻', neko: '🐱', hiyoko: '🐤' } as const;

/** カタカナの ぼうけんで もらえる きせかえ */
const KATA_OUTFITS = new Set(KATA_NODES.filter((n) => n.kind === 'treasure').map((n) => n.outfit));

export default function DressUpScreen() {
  const profile = useApp((s) => s.profile);
  const face = useBuddyFace();
  const outfits = useApp((s) => s.outfits);
  const wear = useApp((s) => s.wear);
  const faces = useApp((s) => s.faces);
  const kata = useApp((s) => s.settings.kata);
  // カタカナを かくしている ときは、まだ もっていない カタカナの きせかえは ださない
  const shown = OUTFITS.filter((o) => kata || !KATA_OUTFITS.has(o.id) || outfits.includes(o.id));

  const setFace = (id: string | null) => {
    sfx.sparkle();
    update((d) => {
      d.profile.buddyFace = id;
    });
    void speak(id ? 'かおを かえたよ!' : 'もとの かおに もどったよ。');
  };

  useEffect(() => {
    void speak(outfits.length ? L.dressAsk(profile.buddyName) : 'ぼうけんの たからばこで、きせかえが もらえるよ。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string, say: string) => {
    sfx.sparkle();
    update((d) => {
      d.wear = d.wear === id ? null : id;
    });
    void speak(wear === id ? 'はずしたよ。' : L.dressNice(say));
  };

  return (
    <div className="screen dressup-screen">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>🎀</Emoji> きせかえ
          </>
        }
      />
      <div className="dressup-body">
        <div className="dressup-stage">
          <Mascot kind={profile.buddy} outfit={wear} face={face} size="min(52vh, 40vw)" onTap={() => void speak('えへへ。')} />
          <div className="dressup-name">{profile.buddyName}</div>
        </div>
        <div className="dressup-closet">
          {faces.length > 0 && (
            <div className="closet-faces" data-testid="closet-faces">
              <button className={`closet-item ${!profile.buddyFace ? 'on' : ''}`} onClick={() => setFace(null)} aria-label="どうぶつの かお">
                <span className="emoji">{KIND_EMOJI[profile.buddy]}</span>
              </button>
              {faces.map((f) => (
                <button key={f.id} className={`closet-item face ${profile.buddyFace === f.id ? 'on' : ''}`} onClick={() => setFace(f.id)} aria-label="しゃしんの かお">
                  <FaceBadge img={f.img} size="78%" />
                </button>
              ))}
            </div>
          )}
          {shown.map((o) => {
            const have = outfits.includes(o.id);
            return (
              <button
                key={o.id}
                className={`closet-item ${have ? '' : 'locked'} ${wear === o.id ? 'on' : ''}`}
                onClick={() => (have ? toggle(o.id, o.say) : (sfx.locked(), void speak('ぼうけんを すすめると もらえるよ。')))}
                data-testid={`outfit-${o.id}`}
              >
                <span className="emoji">{have ? o.emoji : '❓'}</span>
              </button>
            );
          })}
          <Btn color="white" className="change-buddy" onClick={() => navigate({ name: 'buddy' })}>
            <Emoji>🔁</Emoji> おともだちを かえる
          </Btn>
        </div>
      </div>
    </div>
  );
}
