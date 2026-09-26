import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 共通の スタイルを さきに よみこむ (画面ごとの CSS で うわがき できるように)
import './styles/global.css';
import App from './App';
import { initSpeech } from './lib/speech';
import { resumeAudio } from './lib/sound';
import { requestPersist, getData, update } from './state/store';
import { navigate, resetTo } from './state/router';

if (window.__HIRAGANA_TEST__) window.__hiragana = { navigate, resetTo, getData, update };

initSpeech();
requestPersist();

// ピンチで ズームしない (iPad Safari)
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
// とまっていた 音を タッチで うごかす
document.addEventListener('pointerdown', resumeAudio, { passive: true });

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
