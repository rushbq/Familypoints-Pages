import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';

/**
 * 測試模式的控制面板（僅開發預覽 ?preview=… 時出現）。
 * 只負責畫面，所有資料操作由 PreviewHarness 提供，正式的 App.tsx 完全不知道它存在。
 */

export type BattleOutcome = 'random' | 'win' | 'lose';

interface DevTestPanelProps {
  users: User[];
  viewAsId: string;
  onViewAs: (userId: string) => void;
  /** 目前的假日期，例如「11/14（六）」 */
  dateLabel: string;
  dayOffset: number;
  onShiftDays: (days: number) => void;
  onJumpToSaturday: () => void;
  onResetClock: () => void;
  onAddPoints: (childId: string, points: number) => void;
  battleOutcome: BattleOutcome;
  onBattleOutcome: (outcome: BattleOutcome) => void;
  onLineupBoth: () => void;
  onResetBossWeek: () => void;
  onResetAll: () => void;
}

const chip = (active: boolean) =>
  `min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors ${
    active
      ? 'border-bey-cyan bg-bey-cyan text-bey-void'
      : 'border-bey-steel bg-bey-paper text-bey-ink hover:border-bey-cyan/50'
  }`;

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="border-t border-bey-steel pt-3">
    <p className="text-sm font-bold text-bey-ink">{title}</p>
    {hint && <p className="mb-2 text-xs font-normal text-bey-dim">{hint}</p>}
    <div className={`flex flex-wrap gap-1.5 ${hint ? '' : 'mt-2'}`}>{children}</div>
  </div>
);

export const DevTestPanel: React.FC<DevTestPanelProps> = ({
  users,
  viewAsId,
  onViewAs,
  dateLabel,
  dayOffset,
  onShiftDays,
  onJumpToSaturday,
  onResetClock,
  onAddPoints,
  battleOutcome,
  onBattleOutcome,
  onLineupBoth,
  onResetBossWeek,
  onResetAll,
}) => {
  const [open, setOpen] = useState(false);
  const children = users.filter((user) => user.role === UserRole.CHILD);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      {/* 放在左下、底部導覽上方，不擋住主要操作 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-3 z-40 flex h-11 items-center gap-1.5 rounded-full border border-bey-yellow bg-bey-void/90 px-3 text-xs font-bold text-bey-yellow shadow-lg lg:bottom-4 lg:left-24"
        aria-label="開啟測試模式"
      >
        <span aria-hidden="true">🧪</span> 測試
        {dayOffset !== 0 && <span className="font-normal text-bey-dim">{dateLabel}</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="測試模式"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-bey-void/70 p-3 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-bey-yellow/60 bg-bey-panel p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-[10px] font-bold tracking-[0.3em] text-bey-yellow">TEST MODE</p>
                <h2 className="text-base font-black text-bey-ink">測試模式</h2>
                <p className="text-xs font-normal text-bey-dim">只在本機預覽出現；資料存在記憶體，重新整理就回到初始狀態。</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-bey-dim hover:text-bey-ink"
                aria-label="關閉測試模式"
              >
                ✕
              </button>
            </div>

            <Section title="以誰的身分看">
              {users.map((user) => (
                <button key={user.id} type="button" className={chip(user.id === viewAsId)} onClick={() => onViewAs(user.id)}>
                  {user.avatar} {user.name}
                </button>
              ))}
            </Section>

            <Section title={`時光機・現在是 ${dateLabel}`} hint="魔王只在週六、週日開；目標與每週魔王也跟著日期走。">
              <button type="button" className={chip(false)} onClick={() => onShiftDays(-1)}>－1 天</button>
              <button type="button" className={chip(false)} onClick={() => onShiftDays(1)}>＋1 天</button>
              <button type="button" className={chip(false)} onClick={() => onShiftDays(7)}>下一週</button>
              <button type="button" className={chip(false)} onClick={onJumpToSaturday}>跳到週六</button>
              <button type="button" className={chip(dayOffset === 0)} onClick={onResetClock}>回到今天</button>
            </Section>

            <Section title="加分" hint="走正常的加分流程，會同時累積花園陽光與陀螺鋼料（20 分可澆水、25 分可鍛造）。">
              {children.map((child) => (
                <div key={child.id} className="flex w-full items-center gap-1.5">
                  <span className="w-16 flex-shrink-0 truncate text-xs font-bold text-bey-ink">{child.name}</span>
                  {[10, 25, 100].map((points) => (
                    <button key={points} type="button" className={chip(false)} onClick={() => onAddPoints(child.id, points)}>
                      ＋{points}
                    </button>
                  ))}
                  <button type="button" className={`${chip(false)} text-bey-red`} onClick={() => onAddPoints(child.id, -10)}>
                    －10
                  </button>
                </div>
              ))}
            </Section>

            <Section title="魔王戰結果" hint="必勝／必敗會依雙方數值安排爆冷，讓結果一定成立。">
              {([['random', '隨機'], ['win', '必勝'], ['lose', '必敗']] as const).map(([value, label]) => (
                <button key={value} type="button" className={chip(battleOutcome === value)} onClick={() => onBattleOutcome(value)}>
                  {label}
                </button>
              ))}
            </Section>

            <Section title="魔王戰準備">
              <button type="button" className={chip(false)} onClick={onLineupBoth}>兩人都派出陀螺</button>
              <button type="button" className={chip(false)} onClick={onResetBossWeek}>重置本週魔王</button>
            </Section>

            <Section title="全部重來">
              <button type="button" className={`${chip(false)} text-bey-red`} onClick={onResetAll}>重置所有資料</button>
            </Section>
          </div>
        </div>
      )}
    </>
  );
};
