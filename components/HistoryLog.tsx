import React from 'react';
import { ScoreRecord } from '../types';
import { Icons } from './Icons';
import { getScoreCategoryChipClassName, getScoreCategoryLabel } from '../services/familyUtils';

interface HistoryLogProps {
  records: ScoreRecord[];
  showAll: boolean;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ records, showAll }) => {
  // Sort by latest
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);
  
  if (sortedRecords.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-nook-brown/15 rounded-xl bg-nook-cream/50">
        <div className="text-3xl mb-2 opacity-50">📝</div>
        <p className="font-bold text-nook-brown/40">日誌本是空的...</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-nook-brown/5 rounded-xl border border-nook-brown/5 bg-nook-cream/35">
      {sortedRecords.map((record) => (
        <div key={record.id} className="group flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/60">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black ${
              record.pointsChange > 0 ? 'bg-nook-green text-white' : 'bg-nook-red text-white'
          }`}>
             {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2">
                <h4 className="truncate text-sm font-black leading-tight text-nook-brown">{record.itemName}</h4>
                <time className="flex-shrink-0 text-[10px] font-bold text-nook-brown/40">
                    {new Date(record.timestamp).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </time>
             </div>
             
             <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                <span className="flex-shrink-0 text-[11px] font-black text-nook-brown/60">{record.childName}</span>
                {record.scoreCategory && (
                  <span className={`flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black ${getScoreCategoryChipClassName(record.scoreCategory)}`}>
                    {getScoreCategoryLabel(record.scoreCategory)}
                  </span>
                )}
                {record.createdByName && <span className="truncate text-[10px] font-bold text-nook-brown/35">由 {record.createdByName} 記錄</span>}
             </div>
             
             {record.note && (
                <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] font-bold text-nook-brown/50">
                    <Icons.MessageSquare size={11} className="flex-shrink-0 opacity-50" />
                    <span className="truncate">{record.note}</span>
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};
