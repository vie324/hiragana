import { useEffect, useMemo, useRef, useState } from 'react';
import { Btn, Emoji } from '../components/ui';
import Scene from '../components/Scene';
import RewardModal from '../components/RewardModal';
import { findBook, fillTitle, tokenize, type Token } from '../data/books';
import { useApp, callName } from '../state/store';
import { back } from '../state/router';
import { speak, stopSpeaking, wait } from '../lib/speech';
import { sfx } from '../lib/sound';
import { celebrate } from '../lib/confetti';
import { useAlive } from '../lib/hooks';
import { completeActivity, recordBookRead, type RewardResult } from '../state/actions';
import Mascot from '../components/Mascot';
import './books.css';

type Mode = 'auto' | 'self';

export default function BookReader({ id, nodeId }: { id: string; nodeId?: string }) {
  const book = findBook(id);
  const alive = useAlive();
  const profile = useApp((s) => s.profile);
  const wear = useApp((s) => s.wear);
  const vars = { name: callName(profile), buddy: profile.buddyName };
  // -1 = ひょうし, pages.length = おしまい
  const [page, setPage] = useState(-1);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [mode, setMode] = useState<Mode>(nodeId ? 'self' : 'auto');
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState<{ l: number; t: number } | null>(null);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const readToken = useRef(0);
  const seen = useRef<Map<number, number>>(new Map());
  const pageStart = useRef(Date.now());

  const pages = book?.pages ?? [];
  const lines: Token[][] = useMemo(() => (page >= 0 && page < pages.length ? tokenize(pages[page].text, vars) : []), [page, pages, vars.name, vars.buddy]);
  const title = book ? fillTitle(book.title, vars) : '';

  const readPage = async (auto: boolean) => {
    const my = ++readToken.current;
    setPlaying(true);
    for (let l = 0; l < lines.length; l++) {
      for (let t = 0; t < lines[l].length; t++) {
        if (readToken.current !== my || !alive.current) return;
        setLit({ l, t });
        const ok = await speak(lines[l][t].say, { caption: null });
        if (!ok || readToken.current !== my) return;
        await wait(60);
      }
      await wait(260);
    }
    if (readToken.current !== my || !alive.current) return;
    setLit(null);
    setPlaying(false);
    if (auto) {
      await wait(1800);
      if (readToken.current === my && alive.current) turn(1);
    }
  };

  const stopReading = () => {
    readToken.current++;
    setPlaying(false);
    setLit(null);
    stopSpeaking();
  };

  // ページが かわったら
  useEffect(() => {
    pageStart.current = Date.now();
    if (page === -1) {
      void speak(title, { caption: null });
      return;
    }
    if (page >= pages.length) {
      void finish();
      return;
    }
    sfx.whoosh();
    if (mode === 'auto') void readPage(true);
    return () => {
      const s = (Date.now() - pageStart.current) / 1000;
      seen.current.set(page, Math.max(seen.current.get(page) ?? 0, s));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const turn = (delta: number) => {
    readToken.current++;
    setLit(null);
    setPlaying(false);
    setDir(delta > 0 ? 'next' : 'prev');
    setPage((p) => Math.max(-1, Math.min(pages.length, p + delta)));
  };

  const start = (m: Mode) => {
    sfx.open();
    setMode(m);
    setDir('next');
    setPage(0);
  };

  const finish = async () => {
    if (!book) return;
    recordBookRead(book.id);
    celebrate();
    sfx.fanfare();
    await speak('おしまい。 さいごまで よめたね!');
    if (!alive.current) return;
    // ちゃんと ページを みた ときだけ ごほうび
    const looked = [...seen.current.values()].filter((s) => s >= 2.5).length;
    if (nodeId || looked >= Math.ceil(pages.length * 0.7)) {
      setReward(completeActivity({ nodeId, stars: 3 }));
    }
  };

  const tapToken = (l: number, t: number) => {
    readToken.current++;
    setPlaying(false);
    setLit({ l, t });
    void speak(lines[l][t].say, { caption: null }).then(() => setLit((cur) => (cur && cur.l === l && cur.t === t ? null : cur)));
  };

  if (!book) return null;

  const longest = Math.max(1, ...lines.map((ln) => ln.reduce((a, t) => a + [...t.t].length + 1, 0)));
  const fontSize = `min(${Math.min(9, 70 / longest).toFixed(2)}vw, ${Math.min(8.5, 150 / Math.max(longest, 10)).toFixed(2)}vh, ${lines.length > 2 ? 6.2 : 8}vh)`;

  return (
    <div className="screen reader-screen">
      <div className="reader-top">
        <Btn round size={72} color="white" aria-label="もどる" onClick={() => { stopReading(); back(); }}>
          <Emoji>⬅️</Emoji>
        </Btn>
        <div className="reader-dots">
          {pages.map((_, i) => (
            <i key={i} className={i < page ? 'done' : i === page ? 'now' : ''} />
          ))}
        </div>
        {page >= 0 && page < pages.length && (
          <div className="reader-modes">
            <button className={`mode-btn ${mode === 'auto' ? 'on' : ''}`} onClick={() => { setMode('auto'); void readPage(true); }} data-testid="mode-auto">
              <Emoji>🔊</Emoji> よんで
            </button>
            <button className={`mode-btn ${mode === 'self' ? 'on' : ''}`} onClick={() => { setMode('self'); stopReading(); }} data-testid="mode-self">
              <Emoji>👆</Emoji> じぶんで
            </button>
          </div>
        )}
      </div>

      {page === -1 && (
        <div className="reader-cover">
          <Scene bg={book.cover.bg} actors={book.cover.actors} className="reader-scene" />
          <div className="cover-panel card">
            <h1 className="cover-title">{title}</h1>
            <div className="cover-buttons">
              <Btn color="orange" onClick={() => start('auto')} data-testid="read-auto">
                <Emoji>🔊</Emoji> よんで!
              </Btn>
              <Btn color="green" onClick={() => start('self')} data-testid="read-self">
                <Emoji>👆</Emoji> じぶんで よむ
              </Btn>
            </div>
          </div>
        </div>
      )}

      {page >= 0 && page < pages.length && (
        <div className={`reader-page turn-${dir}`} key={page}>
          <Scene bg={pages[page].bg} actors={pages[page].actors} className="reader-scene" />
          <div className="reader-text card" style={{ fontSize }} data-testid="page-text">
            {lines.map((ln, l) => (
              <div className="line" key={l}>
                {ln.map((tok, t) => (
                  <button key={t} className={`tok ${lit && lit.l === l && lit.t === t ? 'lit' : ''}`} onClick={() => tapToken(l, t)}>
                    {tok.t}
                  </button>
                ))}
              </div>
            ))}
            <button className="reader-play" onClick={() => (playing ? stopReading() : void readPage(false))} aria-label="よむ">
              <Emoji>{playing ? '⏸️' : '🔊'}</Emoji>
            </button>
          </div>
        </div>
      )}

      {page >= pages.length && (
        <div className="reader-end">
          <div className="end-card card pop-in">
            <div className="end-title">おしまい</div>
            <Mascot kind={profile.buddy} outfit={wear} mood="cheer" size="min(30vh, 240px)" />
            <div className="cover-buttons">
              <Btn color="orange" onClick={() => { setDir('next'); setPage(-1); }}>
                <Emoji>🔁</Emoji> もういちど
              </Btn>
              <Btn color="green" onClick={back}>
                <Emoji>📚</Emoji> ほんだなへ
              </Btn>
            </div>
          </div>
        </div>
      )}

      {page >= 0 && page < pages.length && (
        <>
          <Btn round size={96} color="white" className="page-btn prev" aria-label="まえ" onClick={() => turn(-1)} data-testid="page-prev">
            <Emoji>◀️</Emoji>
          </Btn>
          <Btn round size={96} color="white" className="page-btn next" aria-label="つぎ" onClick={() => turn(1)} data-testid="page-next">
            <Emoji>▶️</Emoji>
          </Btn>
        </>
      )}
      {reward && <RewardModal result={reward} headline="えほん よめたね!" onClose={() => setReward(null)} />}
    </div>
  );
}
