import { useEffect } from 'react';
import { TopBar } from '../../components/ui';
import { useLetter } from '../../state/letters';
import { useApp } from '../../state/store';
import { setExtraSpeechNames } from '../../lib/speech';
import type { LetterStep } from '../../state/router';
import MessageStep from './MessageStep';
import WriteStep from './WriteStep';
import DecorateStep from './DecorateStep';
import PostStep from './PostStep';
import './letters.css';

/** てがみを つくる 画面 (ぶん → かく → かざる → ポスト) */
export default function LetterScreen({ id, step }: { id: string; step: LetterStep }) {
  const letter = useLetter(id);
  const profileName = useApp((s) => s.profile.name);

  // あて名・なまえは iPad の 声で よむ (まえもって つくれないので)
  useEffect(() => {
    setExtraSpeechNames([letter?.to ?? '', letter?.from ?? '', profileName]);
    return () => setExtraSpeechNames([]);
  }, [letter?.to, letter?.from, profileName]);

  if (!letter) {
    return (
      <div className="screen letter-screen">
        <TopBar nav="back" />
      </div>
    );
  }
  switch (step) {
    case 'msg':
      return <MessageStep letter={letter} />;
    case 'write':
      return <WriteStep letter={letter} />;
    case 'deco':
      return <DecorateStep letter={letter} />;
    case 'post':
      return <PostStep letter={letter} />;
  }
}
