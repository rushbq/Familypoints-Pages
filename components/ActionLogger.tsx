import React, { useState } from 'react';
import { ScoreItem, ScoreType } from '../types';
import { Icons } from './Icons';
import { Button } from './ui/Button';

interface ActionLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: string, note?: string) => void;
  items: ScoreItem[];
  type: 'POSITIVE' | 'NEGATIVE';
  targetChildName: string;
}

export const ActionLogger: React.FC<ActionLoggerProps> = ({ isOpen, onClose, onSubmit, items, type, targetChildName }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    return type === 'POSITIVE' ? item.type === ScoreType.POSITIVE : item.type === ScoreType.NEGATIVE;
  });

  const handleSubmit = () => {
    if (selectedItemId) {
      onSubmit(selectedItemId, note);
    }
  };

  const isPositive = type === 'POSITIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nook-green/80 backdrop-blur-sm animate-pop">
      {/* Container looks like the Nook Stop Machine screen */}
      <div className="bg-nook-cream rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-[12px] border-white relative">
        
        {/* Header */}
        <div className={`px-8 py-6 flex justify-between items-center ${isPositive ? 'bg-nook-green' : 'bg-nook-red'} text-white`}>
          <div className="flex items-center gap-4">
             <div className="bg-white/20 p-3 rounded-full border-2 border-white/40">
                {isPositive ? <Icons.Smile size={32} /> : <Icons.Frown size={32} />}
             </div>
             <div>
                <h2 className="text-3xl font-black tracking-wide">
                    {isPositive ? '優良事項 (加分)' : '違規記錄 (扣分)'}
                </h2>
                <p className="font-bold opacity-80 text-lg">對象：{targetChildName}</p>
             </div>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors">
            <Icons.X size={32} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-nook-beige/30">
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`relative group flex flex-col items-center justify-between p-4 rounded-[2rem] border-b-8 transition-all duration-150 active:border-b-0 active:translate-y-[8px] h-48 ${
                  selectedItemId === item.id
                    ? isPositive 
                        ? 'bg-white border-nook-green ring-4 ring-nook-green/30' 
                        : 'bg-white border-nook-red ring-4 ring-nook-red/30'
                    : 'bg-white border-nook-brown/10 hover:border-nook-brown/20'
                } shadow-sm`}
              >
                {/* Points Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white font-black text-sm ${isPositive ? 'bg-nook-green' : 'bg-nook-red'}`}>
                    {isPositive ? '+' : '-'}{item.points}
                </div>

                <div className="flex-1 flex items-center justify-center text-5xl mt-2 group-hover:scale-110 transition-transform">
                    {item.icon || (isPositive ? '⭐' : '⚠️')}
                </div>
                
                <span className="font-bold text-nook-brown text-center leading-tight w-full line-clamp-2 mt-2">
                    {item.label}
                </span>

                {selectedItemId === item.id && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-nook-brown text-white text-xs px-3 py-1 rounded-full animate-bounce">
                        已選擇
                    </div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] p-6 border-4 border-nook-brown/5 shadow-sm">
            <label className="block text-nook-brown font-black mb-3 text-lg flex items-center gap-2">
               <Icons.PenTool size={20} />
               <span>備註事項 (選填)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="請輸入詳細內容..."
              className="w-full p-4 bg-white border-b-4 border-nook-brown/20 rounded-xl focus:outline-none focus:border-nook-blue transition-colors text-xl font-bold text-nook-brown placeholder-nook-brown/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-nook-brown/5 flex gap-4 bg-nook-cream relative z-10">
          <Button variant="ghost" className="flex-1 text-xl" onClick={onClose} size="lg">取消</Button>
          <Button 
            variant={isPositive ? 'primary' : 'danger'} 
            className="flex-[2] shadow-xl text-xl" 
            disabled={!selectedItemId}
            onClick={handleSubmit}
            size="lg"
            icon={<Icons.Check size={28} strokeWidth={3} />}
          >
            確認登記
          </Button>
        </div>
      </div>
    </div>
  );
};