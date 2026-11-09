import React from 'react';
import { ScoreRecord } from '../types';
import { Icons } from './Icons';
import { getScoreCategoryChipClassName, getScoreCategoryLabel } from '../services/familyUtils';

interface HistoryLogProps {
  records: ScoreRecord[];
  showAll: boolean;
}

/** 把時間戳換成當天的 key，用來分組 */
const getDayKey = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** 分隔列的標題：今天／昨天／11月9日（週一） */
const getDayLabel = (timestamp: number) => {
  const today = new Date();
  const d = new Date(timestamp);
  const dayKey = getDayKey(timestamp);
  if (dayKey === getDayKey(today.getTime())) return '今天';
  if (dayKey === getDayKey(today.getTime() - 24 * 60 * 60 * 1000)) return '昨天';
  return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' });
};

export const HistoryLog: React.FC<HistoryLogProps> = ({ records, showAll }) => {
  // Sort by latest
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  // 依日期分組：一條長長的時間清單很難回答「今天發生了什麼」。
  const groups: { label: string; dayKey: string; items: ScoreRecord[] }[] = [];
  for (const record of sortedRecords) {
    const dayKey = getDayKey(record.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) last.items.push(record);
    else groups.push({ dayKey, label: getDayLabel(record.timestamp), items: [record] });
  }
  
  if (sortedRecords.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-bey-ink/15 rounded-xl bg-bey-panel/50">
        <div className="text-3xl mb-2 opacity-50">📝</div>
        <p className="font-normal text-bey-dim">日誌本是空的...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.dayKey}>
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <h3 className="text-xs font-bold text-bey-ink">{group.label}</h3>
            <span className="text-xs font-normal text-bey-dim">{group.items.length} 筆</span>
            <span className="h-px flex-1 bg-bey-steel" aria-hidden="true" />
            <span className="text-xs font-bold tabular-nums text-bey-dim">
              {(() => {
                const net = group.items.reduce((sum, r) => sum + r.pointsChange, 0);
                return `${net >= 0 ? '+' : ''}${net}`;
              })()}
            </span>
          </div>
          <div className="divide-y divide-bey-steel rounded-xl border border-bey-steel bg-bey-panel/35">
      {group.items.map((record) => (
        <div key={record.id} className="group flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-bey-paper/60">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
              record.pointsChange > 0 ? 'bg-bey-lime text-bey-void' : 'bg-bey-red text-bey-void'
          }`}>
             {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2">
                <h4 className="truncate text-sm font-bold leading-tight text-bey-ink">{record.itemName}</h4>
                <time className="flex-shrink-0 text-xs font-normal text-bey-dim">
                    {new Date(record.timestamp).toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'})}
                </time>
             </div>
             
             <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                <span className="flex-shrink-0 text-xs font-bold text-bey-dim">{record.childName}</span>
                {record.scoreCategory && (
                  <span className={`flex-shrink-0 rounded-full border px-1.5 py-0.5 text-xs font-bold ${getScoreCategoryChipClassName(record.scoreCategory)}`}>
                    {getScoreCategoryLabel(record.scoreCategory)}
                  </span>
                )}
                {record.createdByName && <span className="truncate text-xs font-normal text-bey-dim">由 {record.createdByName} 記錄</span>}
             </div>
             
             {record.note && (
                <div className="mt-1 flex min-w-0 items-center gap-1 text-xs font-normal text-bey-dim">
                    <Icons.MessageSquare size={11} className="flex-shrink-0 opacity-50" />
                    <span className="min-w-0 break-words">{record.note}</span>
                </div>
             )}
          </div>
        </div>
      ))}
          </div>
        </section>
      ))}
    </div>
  );
};
