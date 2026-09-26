import { useEffect } from 'react';
import { Emoji, TopBar } from '../components/ui';
import Scene from '../components/Scene';
import { BOOK_ORDER, readability } from '../data/bookInfo';
import { KATA_BOOKS, fillTitle } from '../data/books';
import { useApp, callName, useScript } from '../state/store';
import { navigate } from '../state/router';
import { isKnown } from '../lib/srs';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './books.css';

export default function BookShelf() {
  const kana = useApp((s) => s.kana);
  const books = useApp((s) => s.books);
  const profile = useApp((s) => s.profile);
  const vars = { name: callName(profile), buddy: profile.buddyName };
  const script = useScript();
  const showKata = useApp((s) => s.settings.kata);
  const isKata = (id: string) => KATA_BOOKS.some((b) => b.id === id);
  // カタカナを えらんでいる ときは カタカナの えほんを さきに
  const order = BOOK_ORDER.filter((b) => showKata || !isKata(b.id)).sort(
    (a, b) => (script === 'kata' ? Number(isKata(b.id)) - Number(isKata(a.id)) : Number(isKata(a.id)) - Number(isKata(b.id))),
  );

  useEffect(() => {
    void speak('どの えほんを よむ?');
  }, []);

  return (
    <div className="screen shelf-screen">
      <TopBar
        nav="home"
        title={
          <>
            <Emoji>📚</Emoji> えほん
          </>
        }
      />
      <div className="shelf-scroll">
        <div className="shelf-grid">
          {order.map((b) => {
            const r = readability(b, (k) => isKnown(kana[k]));
            const title = fillTitle(b.title, vars);
            const reads = books[b.id]?.reads ?? 0;
            return (
              <button
                key={b.id}
                className="book-card"
                onClick={() => {
                  sfx.open();
                  void speak(title);
                  navigate({ name: 'book', id: b.id });
                }}
                data-testid={`book-${b.id}`}
              >
                <div className="book-cover">
                  <Scene bg={b.cover.bg} actors={b.cover.actors} className="cover-scene" />
                  {r >= 1 && <span className="book-ribbon">よめる!</span>}
                  {isKata(b.id) && <span className="book-kata">カタカナ</span>}
                  {reads > 0 && (
                    <span className="book-reads">
                      <Emoji>✅</Emoji>
                      {reads > 1 ? reads : ''}
                    </span>
                  )}
                </div>
                <div className="book-title">{title}</div>
                <div className="book-meta">
                  <span className="book-level" aria-label={`レベル ${b.level}`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <i key={i} className={i < b.level ? 'on' : ''} />
                    ))}
                  </span>
                  <span className="book-meter" aria-label="よめる もじ">
                    <b style={{ width: `${Math.round(r * 100)}%` }} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
