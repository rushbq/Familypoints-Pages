import React from 'react';
import { ScoreRecord } from '../types';
import { Icons } from './Icons';

interface HistoryLogProps {
  records: ScoreRecord[];
  showAll: boolean;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ records, showAll }) => {
  // Sort by latest
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);
  
  if (sortedRecords.length === 0) {
    return (
      <div className="text-center py-12 border-4 border-dashed border-nook-brown/10 rounded-3xl bg-nook-cream/50">
        <div className="text-4xl mb-4 opacity-50">📝</div>
        <p className="font-bold text-nook-brown/40">日誌本是空的...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedRecords.map((record) => (
        <div key={record.id} className="group relative bg-white p-4 rounded-2xl border-b-4 border-nook-brown/5 shadow-sm hover:translate-x-1 transition-transform flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          
          {/* 手機版頂部：分數徽章 + 時間戳 */}
          <div className="flex items-center justify-between sm:hidden">
            <div className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center border-4 border-white shadow-sm font-black text-lg ${
                record.pointsChange > 0 ? 'bg-nook-green text-white' : 'bg-nook-red text-white'
            }`}>
               {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
            </div>
            <span className="text-xs font-bold text-nook-brown/40 bg-nook-beige px-2 py-1 rounded-md">
                {new Date(record.timestamp).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>

          {/* 桌面版：左側分數徽章 */}
          <div className={`hidden sm:flex w-12 h-12 rounded-full flex-shrink-0 items-center justify-center border-4 border-white shadow-sm font-black text-lg ${
              record.pointsChange > 0 ? 'bg-nook-green text-white' : 'bg-nook-red text-white'
          }`}>
             {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <h4 className="font-bold text-nook-brown text-base sm:text-lg">{record.itemName}</h4>
                <span className="hidden sm:block text-xs font-bold text-nook-brown/40 bg-nook-beige px-2 py-1 rounded-md flex-shrink-0">
                    {new Date(record.timestamp).toLocaleString('zh-TW', {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </span>
             </div>
             
             <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${record.pointsChange > 0 ? 'bg-nook-green/60' : 'bg-nook-red/60'}`}>
                    {record.childName}
                </span>
                <span className="text-xs font-bold text-nook-brown/40">by {record.createdByName}</span>
             </div>
             
             {record.note && (
                <div className="mt-2 bg-nook-yellow/20 p-2 rounded-xl text-sm font-medium text-nook-brown/80 flex gap-2 items-start">
                    <Icons.MessageSquare size={14} className="mt-1 opacity-50 flex-shrink-0" />
                    <span className="break-words">{record.note}</span>
                </div>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};