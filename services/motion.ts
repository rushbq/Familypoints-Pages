/**
 * 動畫相關的共用判斷。
 * 花園、鍛造、魔王戰都要在使用者關閉動畫時直接跳到結果，
 * 所以這個判斷抽出來共用。
 */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
