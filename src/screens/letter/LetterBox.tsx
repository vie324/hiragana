import { useEffect, useMemo } from 'react';
import { Btn, Emoji, TopBar } from '../../components/ui';
import Buddy from '../../components/Buddy';
import PostBox from '../../components/letter/PostBox';
import LetterPaper from '../../components/letter/LetterPaper';
import { EnvelopeFront } from '../../components/letter/Envelope';
import { letterSlots } from '../../lib/letterLayout';
import { missingSlots, useLetters, type Letter } from '../../state/letters';
import { navigate } from '../../state/router';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import { burstAt } from '../../lib/confetti';
import './letters.css';

const md = (t: number) => `${new Date(t).getMonth() + 1}がつ ${new Date(t).getDate()}にち`;

/** かきかけの てがみを ひらく ところ (どこまで すすんだかで かえる) */
function resume(l: Letter) {
  if (!l.lines.length) navigate({ name: 'letter', id: l.id, step: 'msg' });
  else if (missingSlots(l).length) navigate({ name: 'letter', id: l.id, step: 'write' });
  else navigate({ name: 'letter', id: l.id, step: 'deco' });
}

/** てがみばこ: あたらしい てがみ・かきかけ・おくった てがみ */
export default function LetterBox({ focus }: { focus?: string }) {
  const letters = useLetters();
  const posted = useMemo(() => letters.filter((l) => l.posted).sort((a, b) => (b.posted ?? 0) - (a.posted ?? 0)), [letters]);
  const drafts = useMemo(() => letters.filter((l) => !l.posted && Object.keys(l.ink).length > 0), [letters]);

  useEffect(() => {
    if (focus) {
      setTimeout(() => {
        burstAt(document.querySelector(`[data-letter="${focus}"]`), 40);
        sfx.sparkle();
      }, 450);
      return;
    }
    void speak(posted.length ? 'てがみばこ だよ。あたらしい てがみも かけるよ。' : 'おおきく かいた もじで、てがみを かこう!');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen letter-screen letter-box">
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>💌</Emoji> てがみ
          </>
        }
      />
      <div className="lb-body">
        <div className="lb-side">
          <div className="lb-post">
            <PostBox happy={!!focus} />
          </div>
          <Btn
            color="pink"
            className="lb-new"
            onClick={() => {
              void speak('だれに てがみを かく?');
              navigate({ name: 'letterTo' });
            }}
            data-testid="letter-new"
          >
            <Emoji>✏️</Emoji> あたらしい てがみ
          </Btn>
          {drafts.length > 0 && (
            <div className="lb-drafts">
              {drafts.slice(0, 3).map((l) => {
                const total = letterSlots(l).length;
                const done = total - missingSlots(l).length;
                return (
                  <button
                    key={l.id}
                    className="lb-draft"
                    onClick={() => {
                      sfx.tap();
                      void speak('つづきを かこう!');
                      resume(l);
                    }}
                    data-testid="letter-draft"
                  >
                    <span className="lb-draft-paper">
                      <LetterPaper letter={l} mode="write" />
                    </span>
                    <span className="lb-draft-text">
                      <b>かきかけ</b>
                      <small>
                        {l.to ? `${l.to}へ` : 'てがみ'} {done}/{total}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="lb-buddy">
            <Buddy size="min(15vh, 12vw)" bubble="top" bubbleMax="min(30vw, 340px)" />
          </div>
        </div>
        <div className="lb-shelf">
          {posted.length === 0 ? (
            <div className="lb-empty">
              <Emoji className="lb-empty-emoji">📮</Emoji>
              <p>
                かいた てがみは
                <br />
                ここに たまるよ
              </p>
            </div>
          ) : (
            <div className="lb-grid">
              {posted.map((l, i) => (
                <button
                  key={l.id}
                  className={`lb-env ${l.id === focus ? 'new' : ''}`}
                  style={{ ['--tilt' as string]: `${((i * 37) % 7) - 3}deg`, ['--i' as string]: i }}
                  onClick={() => {
                    sfx.open();
                    navigate({ name: 'letterView', id: l.id });
                  }}
                  data-letter={l.id}
                  data-testid="letter-env"
                >
                  <EnvelopeFront letter={l} stamped still />
                  <span className="lb-date">{md(l.posted ?? l.created)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
