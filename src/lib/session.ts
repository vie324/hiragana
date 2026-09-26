/** アプリを ひらいている あいだだけの じょうたい */
import { isSpeaking, onSpeakingChange, speak, type SpeakOptions } from './speech';

/**
 * いまの よみあげが おわってから よむ (さいだい maxWait ミリ秒 まつ)。
 * shouldSpeak が false を かえしたら (画面を はなれた など) よまない。
 */
export function speakAfterCurrent(
  text: string,
  opts?: SpeakOptions,
  maxWait = 6000,
  shouldSpeak: () => boolean = () => true,
): Promise<boolean> {
  if (!isSpeaking()) return shouldSpeak() ? speak(text, opts) : Promise.resolve(false);
  return new Promise((resolve) => {
    let done = false;
    const go = (force: boolean) => {
      if (done) return;
      // まだ だれかが しゃべっていたら もうすこし まつ
      if (!force && isSpeaking()) return;
      done = true;
      off();
      clearTimeout(t);
      if (!shouldSpeak()) {
        resolve(false);
        return;
      }
      void speak(text, opts).then(resolve);
    };
    const off = onSpeakingChange((s) => {
      if (!s) setTimeout(() => go(false), 150);
    });
    const t = setTimeout(() => go(true), maxWait);
  });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 10) return 'おはよう';
  if (h < 17) return 'こんにちは';
  return 'こんばんは';
}
