/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface Window {
  /** e2e テスト用: よみあげを 一瞬で おわらせる */
  __HIRAGANA_FAST_SPEECH__?: boolean;
  /** e2e テスト用: よみあげた テキストの きろく */
  __HIRAGANA_SPOKEN__?: string[];
  /** e2e テスト用 (テストのときだけ セットされる) */
  __HIRAGANA_TEST__?: boolean;
  __hiragana?: {
    navigate: typeof import('./state/router').navigate;
    resetTo: typeof import('./state/router').resetTo;
    getData: typeof import('./state/store').getData;
    update: typeof import('./state/store').update;
  };
}
