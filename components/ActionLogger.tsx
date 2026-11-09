import React, { useEffect, useState } from 'react';
import { ScoreCategory, ScoreItem, ScoreType } from '../types';
import { Icons } from './Icons';
import { Button } from './ui/Button';
import { SCORE_CATEGORY_OPTIONS, getScoreCategoryChipClassName } from '../services/familyUtils';

interface ActionLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, note?: string, customPoints?: number, category?: ScoreCategory) => void;
  items: ScoreItem[];
  type: 'POSITIVE' | 'NEGATIVE';
  targetChildName: string;
}

const CUSTOM_ITEM_ID = '__custom__';

export const ActionLogger: React.FC<ActionLoggerProps> = ({ isOpen, onClose, onSubmit, items, type, targetChildName }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ScoreCategory>(ScoreCategory.ACADEMIC);

  useEffect(() => {
    setSelectedItemId(null);
  }, [selectedCategory, type]);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedItemId(null);
    setNote('');
    setCustomPoints('');
    setSelectedCategory(ScoreCategory.ACADEMIC);
  }, [isOpen, type]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesType = type === 'POSITIVE' ? item.type === ScoreType.POSITIVE : item.type === ScoreType.NEGATIVE;
    return matchesType && item.category === selectedCategory;
  });

  const isCustom = selectedItemId === CUSTOM_ITEM_ID;
  const customPointsNum = parseInt(customPoints, 10);
  const isCustomValid = isCustom && customPointsNum > 0 && note.trim().length > 0;

  const handleSubmit = () => {
    if (isCustom) {
      if (!isCustomValid) return;
      onSubmit(CUSTOM_ITEM_ID, note, customPointsNum, selectedCategory);
    } else if (selectedItemId) {
      onSubmit(selectedItemId, note, undefined, selectedCategory);
    }
  };

  const canSubmit = isCustom ? isCustomValid : !!selectedItemId;
  const isPositive = type === 'POSITIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-bey-void/80 animate-pop">
      {/* Container looks like the Nook Stop Machine screen */}
      <div className="bg-bey-paper rounded-2xl w-full max-w-3xl soft-card overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Header */}
        <div className={`px-4 py-3 flex justify-between items-center ${isPositive ? 'bg-bey-cyan text-bey-void' : 'bg-bey-red text-white'}`}>
          <div className="flex items-center gap-2.5">
             <div className="bg-bey-paper/20 p-2 rounded-full">
                {isPositive ? <Icons.Smile size={20} /> : <Icons.Frown size={20} />}
             </div>
             <div>
                <h2 className="text-lg font-black">
                    {isPositive ? '優良事項 (加分)' : '違規記錄 (扣分)'}
                </h2>
                <p className="font-bold opacity-80 text-xs">對象：{targetChildName}</p>
             </div>
          </div>
          <button onClick={onClose} className="bg-bey-paper/20 hover:bg-bey-paper/35 p-2 rounded-lg transition-colors">
            <Icons.X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-bey-panel">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Hash size={15} className="text-bey-dim" />
              <span className="text-sm font-bold text-bey-ink">先選分類</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCORE_CATEGORY_OPTIONS.map((option) => {
                const isActive = option.value === selectedCategory;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedCategory(option.value)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                      isActive
                        ? getScoreCategoryChipClassName(option.value)
                        : 'bg-bey-paper text-bey-dim border-bey-steel hover:text-bey-ink hover:border-bey-ink/20'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`relative group flex flex-col items-center justify-between p-2.5 rounded-xl border-b-[3px] transition-all duration-150 active:border-b-0 active:translate-y-[3px] min-h-[7rem] ${
                  selectedItemId === item.id
                    ? isPositive 
                        ? 'bg-bey-paper border-bey-cyan ring-2 ring-bey-cyan/25'
                        : 'bg-bey-paper border-bey-red ring-2 ring-bey-red/25'
                    : 'bg-bey-paper border-bey-ink/10 hover:border-bey-ink/20'
                }`}
              >
                {/* Points Badge */}
                <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${isPositive ? 'bg-bey-cyan text-bey-void' : 'bg-bey-red text-white'}`}>
                    {isPositive ? '+' : '-'}{item.points}
                </div>

                <div className="flex-1 flex items-center justify-center text-3xl mt-1 group-hover:scale-105 transition-transform">
                    {item.icon || (isPositive ? '⭐' : '⚠️')}
                </div>
                
                <span className="text-xs font-bold text-bey-ink text-center leading-tight w-full break-words mt-1">
                    {item.label}
                </span>

                {selectedItemId === item.id && (
                    <div className="absolute bottom-1 left-1 text-bey-cyan text-[10px] font-bold">
                        ✓
                    </div>
                )}
              </button>
            ))}

            {/* 「其它」自訂項目卡片 */}
            <button
              onClick={() => { setSelectedItemId(CUSTOM_ITEM_ID); setCustomPoints(''); }}
              className={`relative group flex flex-col items-center justify-between p-2.5 rounded-xl border-b-[3px] transition-all duration-150 active:border-b-0 active:translate-y-[3px] min-h-[7rem] border-dashed ${
                isCustom
                  ? isPositive
                      ? 'bg-bey-paper border-bey-cyan ring-2 ring-bey-cyan/25'
                      : 'bg-bey-paper border-bey-red ring-2 ring-bey-red/25'
                  : 'bg-bey-paper/60 border-bey-ink/20 hover:border-bey-ink/30'
              }`}
            >
              <div className="flex-1 flex items-center justify-center text-3xl mt-1 group-hover:scale-105 transition-transform">
                  ✏️
              </div>
              <span className="text-xs font-bold text-bey-ink text-center leading-tight w-full mt-1">
                  其它
              </span>
              {isCustom && (
                  <div className="absolute bottom-1 left-1 text-bey-cyan text-[10px] font-bold">
                      ✓
                  </div>
              )}
            </button>
          </div>

          {filteredItems.length === 0 && (
            <div className="mb-4 text-center py-5 rounded-xl border border-dashed border-bey-ink/15 bg-bey-paper/60 text-bey-dim text-sm font-bold">
              這個分類目前還沒有可選項目，可以改選其他分類或使用「其它」。
            </div>
          )}

          {/* 「其它」自訂分數輸入 */}
          {isCustom && (
            <div className="bg-bey-paper rounded-xl p-3 mb-3">
              <label className="block text-bey-ink font-bold mb-2 text-sm flex items-center gap-2">
                 <Icons.Hash size={20} />
                 <span>自訂分數 <span className="text-bey-red text-sm">*必填</span></span>
              </label>
              <input
                type="number"
                min="1"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                placeholder="請輸入分數（正整數）"
                className="w-full p-3 bg-bey-panel border-b-2 border-bey-ink/20 rounded-lg focus:outline-none focus:border-bey-blue transition-colors text-base font-bold text-bey-ink placeholder-bey-ink/45"
              />
            </div>
          )}

          <div className="bg-bey-paper rounded-xl p-3">
            <label className="block text-bey-ink font-bold mb-2 text-sm flex items-center gap-2">
               <Icons.PenTool size={20} />
               <span>{isCustom ? '原因' : '備註事項'} {isCustom ? <span className="text-bey-red text-sm">*必填</span> : '(選填)'}</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isCustom ? '請輸入原因（必填）...' : '請輸入詳細內容...'}
              className="w-full p-3 bg-bey-panel border-b-2 border-bey-ink/20 rounded-lg focus:outline-none focus:border-bey-blue transition-colors text-base font-bold text-bey-ink placeholder-bey-ink/45"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-bey-ink/5 flex gap-2 bg-bey-paper relative z-10">
          <Button variant="ghost" className="flex-1" onClick={onClose}>取消</Button>
          <Button 
            variant={isPositive ? 'primary' : 'danger'} 
            className="flex-[2]"
            disabled={!canSubmit}
            onClick={handleSubmit}
            icon={<Icons.Check size={18} strokeWidth={3} />}
          >
            確認登記
          </Button>
        </div>
      </div>
    </div>
  );
};
