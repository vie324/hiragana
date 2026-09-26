/** アプリを ひらいている あいだだけの じょうたい */
import { isSpeaking, onSpeakingChange, speak, type SpeakOptions } from './speech';

/** いまの よみあげが おわってから よむ (さいだい maxWait ミリ秒 まつ) */
export function speakAfterCurrent(text: string, opts?: SpeakOptions, maxWait = 6000): Promise<boolean> {
  if (!isSpeaking()) return speak(text, opts);
  return new Promise((resolve) => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      off();
      clearTimeout(t);
      void speak(text, opts).then(resolve);
    };
    const off = onSpeakingChange((s) => {
      if (!s) setTimeout(go, 150);
    });
    const t = setTimeout(go, maxWait);
  });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 10) return 'おはよう';
  if (h < 17) return 'こんにちは';
  return 'こんばんは';
}
