/**
 * 測試模式的時光機（僅開發預覽使用）。
 *
 * 魔王只在週末開、目標有起訖日、每週輪一隻魔王——這些都由「今天」決定，
 * 平日根本測不到。這裡把全域 Date 換成會加上偏移量的版本，
 * 讓 new Date() 與 Date.now() 回傳「假的現在」，正式程式碼一行都不用改。
 *
 * 只由 PreviewHarness 呼叫；正式 build 不會走到 PreviewHarness，這個檔案也不會被打包。
 */

const RealDate = Date;
const DAY_MS = 24 * 60 * 60 * 1000;
let offsetMs = 0;
let installed = false;

class ShiftedDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) {
      super(RealDate.now() + offsetMs);
    } else {
      // 有帶參數的 new Date(...) 是在算某個指定日期，照原樣處理
      super(...(args as [number]));
    }
  }

  static now(): number {
    return RealDate.now() + offsetMs;
  }
}

const install = () => {
  if (installed) return;
  globalThis.Date = ShiftedDate as DateConstructor;
  installed = true;
};

/** 目前偏移了幾天（可為負）。 */
export const getDevDayOffset = (): number => Math.round(offsetMs / DAY_MS);

export const setDevDayOffset = (days: number) => {
  install();
  offsetMs = days * DAY_MS;
};

/** 從真正的今天算，下一個（或今天就是的）週六要偏移幾天。 */
export const daysUntilRealSaturday = (): number => {
  const day = new RealDate().getDay();
  return (6 - day + 7) % 7;
};
