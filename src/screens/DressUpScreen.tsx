import { useEffect } from 'react';
import { Btn, Emoji, TopBar } from '../components/ui';
import Mascot from '../components/Mascot';
import { OUTFITS } from '../data/outfits';
import { update, useApp } from '../state/store';
import { navigate } from '../state/router';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './stickers.css';
import './dressup.css';

export default function DressUpScreen() {
  const profile = useApp((s) => s.profile);
  const outfits = useApp((s) => s.outfits);
  const wear = useApp((s) => s.wear);

  useEffect(() => {
    void speak(outfits.length ? `${profile.buddyName}に なにを つけてあげる?` : 'ぼうけんの たからばこで、きせかえが もらえるよ。');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string, say: string) => {
    sfx.sparkle();
    update((d) => {
      d.wear = d.wear === id ? null : id;
    });
    void speak(wear === id ? 'はずしたよ。' : `${say}、にあうね!`);
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
          <Mascot kind={profile.buddy} outfit={wear} size="min(52vh, 40vw)" onTap={() => void speak('えへへ。')} />
          <div className="dressup-name">{profile.buddyName}</div>
        </div>
        <div className="dressup-closet">
          {OUTFITS.map((o) => {
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
