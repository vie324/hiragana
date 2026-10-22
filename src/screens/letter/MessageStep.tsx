import { useEffect, useState } from 'react';
import { Btn, Emoji, TopBar } from '../../components/ui';
import LetterPaper from '../../components/letter/LetterPaper';
import KanaKeyboard from '../../components/letter/KanaKeyboard';
import { MAX_LINE_CHARS, MAX_LINES, PHRASES, type Phrase } from '../../data/letters';
import { letterSlots } from '../../lib/letterLayout';
import { pruneInk, updateLetter, type Letter } from '../../state/letters';
import { back, navigate } from '../../state/router';
import { useApp } from '../../state/store';
import { speak } from '../../lib/speech';
import { sfx } from '../../lib/sound';
import './letters.css';

const PHRASE_TEXT = new Set(PHRASES.map((p) => p.text));

/** なんて かく? (ぶんを えらぶ・つくる) */
export default function MessageStep({ letter }: { letter: Letter }) {
  const profileName = useApp((s) => s.profile.name);
  const [keyboard, setKeyboard] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const count = letterSlots(letter).length;
  const custom = letter.lines.filter((l) => !PHRASE_TEXT.has(l));

  useEffect(() => {
    void speak('なんて かこうか? えらんでね。');
  }, []);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(null), 600);
    return () => clearTimeout(t);
  }, [shake]);

  const setLines = (lines: string[]) =>
    updateLetter(letter.id, (l) => {
      l.lines = lines;
      pruneInk(l);
    });

  const full = () => letter.lines.length >= MAX_LINES;

  const toggle = (p: Phrase) => {
    const i = letter.lines.indexOf(p.text);
    if (i >= 0) {
      sfx.whoosh();
      setLines(letter.lines.filter((_, j) => j !== i));
      return;
    }
    if (full()) {
      sfx.locked();
      setShake(p.id);
      void speak('4つ までだよ。');
      return;
    }
    sfx.pop();
    void speak(p.text);
    setLines([...letter.lines, p.text]);
  };

  const next = () => {
    if (!letter.lines.length) {
      sfx.locked();
      void speak('なんて かくか えらんでね。');
      return;
    }
    void speak('おおきく かいた もじが、てがみに なるよ!');
    navigate({ name: 'letter', id: letter.id, step: 'write' });
  };

  return (
    <div className="screen letter-screen letter-msg">
      <TopBar
        nav="back"
        title={
          <>
            <Emoji>💬</Emoji> なんて かく?
          </>
        }
        right={
          <Btn
            color="green"
            className={letter.lines.length ? 'pulse' : ''}
            onClick={next}
            disabled={!letter.lines.length}
            data-testid="msg-next"
          >
            かこう <Emoji>✏️</Emoji>
          </Btn>
        }
      />
      <div className="lm-body">
        <div className="lm-preview">
          <div className="lm-paper paper-frame">
            <LetterPaper letter={letter} mode="write" />
          </div>
          <div className="lm-count" data-testid="msg-count">
            <Emoji>✏️</Emoji> {count}もじ
          </div>
        </div>
        <div className="lm-side">
          <div className="lm-heads">
            <button
              className="lm-to"
              onClick={() => {
                sfx.tap();
                back();
              }}
            >
              <Emoji>💌</Emoji> {letter.to ? `${letter.to}へ` : 'あてなし'}
            </button>
            {profileName && (
              <button
                className={`lm-to from ${letter.from ? 'on' : ''}`}
                onClick={() => {
                  sfx.tap();
                  updateLetter(letter.id, (l) => {
                    l.from = l.from ? '' : profileName;
                    pruneInk(l);
                  });
                }}
                data-testid="msg-from"
              >
                <Emoji>{letter.from ? '📛' : '➕'}</Emoji> {profileName}より
              </button>
            )}
          </div>
          <div className="lm-phrases">
            {PHRASES.map((p) => {
              const order = letter.lines.indexOf(p.text);
              return (
                <button
                  key={p.id}
                  className={`lm-phrase ${order >= 0 ? 'on' : ''} ${shake === p.id ? 'wiggle' : ''}`}
                  onClick={() => toggle(p)}
                  data-testid={`phrase-${p.id}`}
                >
                  <Emoji className="lm-emoji">{p.emoji}</Emoji>
                  <span className="lm-text">{p.text}</span>
                  {order >= 0 && <span className="lm-order">{order + 1}</span>}
                </button>
              );
            })}
            {custom.map((text) => (
              <button
                key={text}
                className="lm-phrase on custom"
                onClick={() => {
                  sfx.whoosh();
                  setLines(letter.lines.filter((l) => l !== text));
                }}
              >
                <Emoji className="lm-emoji">✏️</Emoji>
                <span className="lm-text">{text}</span>
                <span className="lm-order">{letter.lines.indexOf(text) + 1}</span>
              </button>
            ))}
            <button
              className="lm-phrase add"
              onClick={() => {
                if (full()) {
                  sfx.locked();
                  void speak('4つ までだよ。');
                  return;
                }
                sfx.tap();
                setKeyboard(true);
              }}
              data-testid="phrase-custom"
            >
              <Emoji className="lm-emoji">⌨️</Emoji>
              <span className="lm-text">じぶんで つくる</span>
            </button>
          </div>
        </div>
      </div>
      {keyboard && (
        <KanaKeyboard
          title="もじを えらんで ことばを つくろう!"
          max={MAX_LINE_CHARS}
          onCancel={() => setKeyboard(false)}
          onDone={(text) => {
            setKeyboard(false);
            if (letter.lines.includes(text)) return;
            sfx.pop();
            setLines([...letter.lines, text]);
          }}
        />
      )}
    </div>
  );
}
