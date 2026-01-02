import React, { useState } from 'react';
import { RewardItem } from '../types';
import { Icons } from './Icons';
import { Button } from './ui/Button';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface RewardRedeemerProps {
  isOpen: boolean;                  // 是否開啟視窗
  onClose: () => void;              // 關閉視窗函式
  onSubmit: (itemId: string) => void; // 確認兌換函式
  items: RewardItem[];              // 獎勵項目列表
  currentScore: number;             // 目前該使用者的分數
  targetChildName: string;          // 目標使用者名稱
}

/**
 * 獎勵兌換視窗元件
 * 類似動森的「哩數兌換」介面
 */
export const RewardRedeemer: React.FC<RewardRedeemerProps> = ({ isOpen, onClose, onSubmit, items, currentScore, targetChildName }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // 新增：控制確認對話框的狀態
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleRedeemClick = () => {
    if (selectedItemId) {
      setShowConfirm(true);
    }
  };

  const handleConfirmRedeem = () => {
    if (selectedItemId) {
      onSubmit(selectedItemId);
      setShowConfirm(false);
    }
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nook-brown/80 backdrop-blur-sm animate-pop">
        {/* 視窗容器 - 使用紫色調代表商店/兌換 */}
        <div className="bg-nook-cream rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-[12px] border-white relative">
          
          {/* 標題區塊 */}
          <div className="px-8 py-6 flex justify-between items-center bg-[#A88BFA] text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full border-2 border-white/40">
                  <Icons.Gift size={32} />
              </div>
              <div>
                  <h2 className="text-3xl font-black tracking-wide">
                      獎勵兌換中心
                  </h2>
                  <p className="font-bold opacity-80 text-lg">
                      {targetChildName} 目前持有：<span className="text-yellow-300 text-xl">{currentScore}</span> 分
                  </p>
              </div>
            </div>
            <button onClick={onClose} className="bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors">
              <Icons.X size={32} strokeWidth={3} />
            </button>
          </div>

          {/* 獎勵列表內容區 */}
          <div className="p-8 overflow-y-auto flex-1 bg-nook-beige/30">
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {items.map(item => {
                // 檢查分數是否足夠
                const canAfford = currentScore >= item.points;

                return (
                  <button
                    key={item.id}
                    onClick={() => canAfford && setSelectedItemId(item.id)}
                    disabled={!canAfford}
                    className={`relative group flex flex-col items-center justify-between p-4 rounded-[2rem] border-b-8 transition-all duration-150 h-56
                      ${!canAfford ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 grayscale' : ''}
                      ${
                        selectedItemId === item.id
                          ? 'bg-white border-[#A88BFA] ring-4 ring-[#A88BFA]/30'
                          : canAfford ? 'bg-white border-nook-brown/10 hover:border-nook-brown/20 active:border-b-0 active:translate-y-[8px]' : ''
                      } shadow-sm`}
                  >
                    {/* 價格標籤 */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-white font-black text-sm bg-nook-orange shadow-sm`}>
                        {item.points} pt
                    </div>

                    {/* 圖示 */}
                    <div className="flex-1 flex items-center justify-center text-6xl mt-2 group-hover:scale-110 transition-transform duration-300">
                        {item.icon || '🎁'}
                    </div>
                    
                    {/* 名稱 */}
                    <span className="font-bold text-nook-brown text-center leading-tight w-full line-clamp-2 mt-2 text-lg">
                        {item.label}
                    </span>

                    {/* 選中標記 */}
                    {selectedItemId === item.id && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#A88BFA] text-white text-xs px-3 py-1 rounded-full animate-bounce">
                            要這個！
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {items.length === 0 && (
              <div className="text-center text-nook-brown/40 font-bold py-10">
                  目前沒有可兌換的獎勵喔！請家長新增。
              </div>
            )}
          </div>

          {/* 底部按鈕區 */}
          <div className="p-6 border-t-4 border-nook-brown/5 flex gap-4 bg-nook-cream relative z-10">
            <Button variant="ghost" className="flex-1 text-xl" onClick={onClose} size="lg">算了，再存一點</Button>
            <Button 
              type="button" // 明確指定 type 防止 form submit 行為
              variant="primary" 
              className="flex-[2] shadow-xl text-xl bg-[#A88BFA] border-[#8B5CF6] hover:brightness-110" 
              disabled={!selectedItemId}
              onClick={handleRedeemClick}
              size="lg"
              icon={<Icons.Gift size={28} strokeWidth={3} />}
            >
              確認兌換
            </Button>
          </div>
        </div>
      </div>

      {/* 確認對話框 */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmRedeem}
        title="兌換確認"
        message={`確定要花費 ${selectedItem?.points} 積分來兌換「${selectedItem?.label}」嗎？`}
        confirmText="沒問題！"
        cancelText="再想想"
      />
    </>
  );
};