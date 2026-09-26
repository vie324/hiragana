import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 共通の スタイルを さきに よみこむ (画面ごとの CSS で うわがき できるように)
import './styles/global.css';
import App from './App';
import { initSpeech, onSpeakingChange, setSpeechNames, unlockSpeech } from './lib/speech';
import { duckBgm, resumeAudio } from './lib/sound';
import { requestPersist, getData, update, subscribe, callName } from './state/store';
import { navigate, resetTo } from './state/router';
import { currentVoice } from './voice/bank';

if (window.__HIRAGANA_TEST__) window.__hiragana = { navigate, resetTo, getData, update, voice: currentVoice };

initSpeech();
onSpeakingChange(duckBgm);
requestPersist();

// よみあげで iPad の 声に する なまえ (データが かわったら すぐ つたえる)
const syncNames = () => {
  const p = getData().profile;
  setSpeechNames([callName(p), p.buddyName]);
};
syncNames();
subscribe(syncNames);

// ピンチで ズームしない (iPad Safari)
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
// とまっていた 音を タッチで うごかす
document.addEventListener('pointerdown', resumeAudio, { passive: true });
// さいしょの タップで iPad の よみあげも つかえるように する (click で ないと ゆるされない)
document.addEventListener('click', unlockSpeech, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
