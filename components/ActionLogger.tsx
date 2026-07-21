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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-nook-brown/60 animate-pop">
      {/* Container looks like the Nook Stop Machine screen */}
      <div className="bg-white rounded-2xl w-full max-w-3xl soft-card overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Header */}
        <div className={`px-4 py-3 flex justify-between items-center ${isPositive ? 'bg-nook-green' : 'bg-nook-red'} text-white`}>
          <div className="flex items-center gap-2.5">
             <div className="bg-white/20 p-2 rounded-full">
                {isPositive ? <Icons.Smile size={20} /> : <Icons.Frown size={20} />}
             </div>
             <div>
                <h2 className="text-lg font-black">
                    {isPositive ? '優良事項 (加分)' : '違規記錄 (扣分)'}
                </h2>
                <p className="font-bold opacity-80 text-xs">對象：{targetChildName}</p>
             </div>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/35 p-2 rounded-lg transition-colors">
            <Icons.X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-nook-cream">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Hash size={15} className="text-nook-brown/60" />
              <span className="text-sm font-black text-nook-brown">先選分類</span>
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
                        : 'bg-white text-nook-brown/60 border-white hover:text-nook-brown hover:border-nook-brown/20'
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
                        ? 'bg-white border-nook-green ring-2 ring-nook-green/25'
                        : 'bg-white border-nook-red ring-2 ring-nook-red/25'
                    : 'bg-white border-nook-brown/10 hover:border-nook-brown/20'
                }`}
              >
                {/* Points Badge */}
                <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-white font-black text-[10px] ${isPositive ? 'bg-nook-green' : 'bg-nook-red'}`}>
                    {isPositive ? '+' : '-'}{item.points}
                </div>

                <div className="flex-1 flex items-center justify-center text-3xl mt-1 group-hover:scale-105 transition-transform">
                    {item.icon || (isPositive ? '⭐' : '⚠️')}
                </div>
                
                <span className="text-xs font-bold text-nook-brown text-center leading-tight w-full break-words mt-1">
                    {item.label}
                </span>

                {selectedItemId === item.id && (
                    <div className="absolute bottom-1 left-1 text-nook-greenDark text-[9px] font-black">
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
                      ? 'bg-white border-nook-green ring-2 ring-nook-green/25'
                      : 'bg-white border-nook-red ring-2 ring-nook-red/25'
                  : 'bg-white/60 border-nook-brown/20 hover:border-nook-brown/30'
              }`}
            >
              <div className="flex-1 flex items-center justify-center text-3xl mt-1 group-hover:scale-105 transition-transform">
                  ✏️
              </div>
              <span className="text-xs font-bold text-nook-brown text-center leading-tight w-full mt-1">
                  其它
              </span>
              {isCustom && (
                  <div className="absolute bottom-1 left-1 text-nook-greenDark text-[9px] font-black">
                      ✓
                  </div>
              )}
            </button>
          </div>

          {filteredItems.length === 0 && (
            <div className="mb-4 text-center py-5 rounded-xl border border-dashed border-nook-brown/15 bg-white/60 text-nook-brown/50 text-sm font-bold">
              這個分類目前還沒有可選項目，可以改選其他分類或使用「其它」。
            </div>
          )}

          {/* 「其它」自訂分數輸入 */}
          {isCustom && (
            <div className="bg-white rounded-xl p-3 mb-3">
              <label className="block text-nook-brown font-black mb-2 text-sm flex items-center gap-2">
                 <Icons.Hash size={20} />
                 <span>自訂分數 <span className="text-nook-red text-sm">*必填</span></span>
              </label>
              <input
                type="number"
                min="1"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                placeholder="請輸入分數（正整數）"
                className="w-full p-3 bg-nook-cream border-b-2 border-nook-brown/20 rounded-lg focus:outline-none focus:border-nook-blue transition-colors text-base font-bold text-nook-brown placeholder-nook-brown/45"
              />
            </div>
          )}

          <div className="bg-white rounded-xl p-3">
            <label className="block text-nook-brown font-black mb-2 text-sm flex items-center gap-2">
               <Icons.PenTool size={20} />
               <span>{isCustom ? '原因' : '備註事項'} {isCustom ? <span className="text-nook-red text-sm">*必填</span> : '(選填)'}</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isCustom ? '請輸入原因（必填）...' : '請輸入詳細內容...'}
              className="w-full p-3 bg-nook-cream border-b-2 border-nook-brown/20 rounded-lg focus:outline-none focus:border-nook-blue transition-colors text-base font-bold text-nook-brown placeholder-nook-brown/45"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-nook-brown/5 flex gap-2 bg-white relative z-10">
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
