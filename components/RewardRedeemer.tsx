import React, { useEffect, useState } from 'react';
import { DiscountCard, RewardItem } from '../types';
import { Icons } from './Icons';
import { Button } from './ui/Button';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { getDiscountedRewardCost } from '../services/familyUtils';

interface RewardRedeemerProps {
  isOpen: boolean;                  // 是否開啟視窗
  onClose: () => void;              // 關閉視窗函式
  onSubmit: (itemId: string, useDiscountCard: boolean) => void; // 確認兌換函式
  items: RewardItem[];              // 獎勵項目列表
  currentScore: number;             // 目前該使用者的分數
  targetChildName: string;          // 目標使用者名稱
  availableDiscountCards: DiscountCard[];
}

/**
 * 獎勵兌換視窗元件
 * 類似動森的「哩數兌換」介面
 */
export const RewardRedeemer: React.FC<RewardRedeemerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  currentScore,
  targetChildName,
  availableDiscountCards,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [useDiscountCard, setUseDiscountCard] = useState(false);
  const hasDiscountCards = availableDiscountCards.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    setSelectedItemId(null);
    setShowConfirm(false);
    setUseDiscountCard(false);
  }, [isOpen, targetChildName]);

  useEffect(() => {
    if (!selectedItemId) return;

    const selected = items.find((item) => item.id === selectedItemId);
    if (!selected) {
      setSelectedItemId(null);
      return;
    }

    const cost = useDiscountCard && hasDiscountCards ? getDiscountedRewardCost(selected.points) : selected.points;
    if (currentScore < cost) {
      setSelectedItemId(null);
    }
  }, [currentScore, hasDiscountCards, items, selectedItemId, useDiscountCard]);

  if (!isOpen) return null;

  const handleRedeemClick = () => {
    if (selectedItemId) {
      setShowConfirm(true);
    }
  };

  const handleConfirmRedeem = () => {
    if (selectedItemId) {
      onSubmit(selectedItemId, useDiscountCard && hasDiscountCards);
      setShowConfirm(false);
    }
  };

  const selectedItem = items.find(i => i.id === selectedItemId);
  const selectedCost = selectedItem
    ? (useDiscountCard && hasDiscountCards ? getDiscountedRewardCost(selectedItem.points) : selectedItem.points)
    : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-bey-void/80 animate-pop">
        {/* 視窗容器 - 使用紫色調代表商店/兌換 */}
        <div className="bg-bey-paper rounded-2xl w-full max-w-3xl soft-card overflow-hidden flex flex-col max-h-[94vh] relative">
          
          {/* 標題區塊 */}
          <div className="px-4 py-3 flex justify-between items-center bg-bey-orange text-bey-void">
            <div className="flex items-center gap-2.5">
              <div className="bg-bey-paper/20 p-2 rounded-full">
                  <Icons.Gift size={20} />
              </div>
              <div>
                  <h2 className="text-lg font-black">
                      獎勵兌換中心
                  </h2>
                  <p className="font-bold opacity-85 text-xs">
                      {targetChildName}｜<span className="text-bey-yellow">{currentScore} 分</span>｜5 折卡 {availableDiscountCards.length} 張
                  </p>
              </div>
            </div>
            <button onClick={onClose} className="bg-bey-paper/20 hover:bg-bey-paper/35 p-2 rounded-lg transition-colors">
              <Icons.X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* 獎勵列表內容區 */}
          <div className="p-4 overflow-y-auto flex-1 bg-bey-panel">
            <div className="mb-3 p-3 rounded-xl bg-bey-paper">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-bey-ink text-sm">5 折卡</p>
                  <p className="text-[10px] font-normal text-bey-dim">
                    本次兌換半價，奇數無條件進位
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!hasDiscountCards}
                  onClick={() => hasDiscountCards && setUseDiscountCard((prev) => !prev)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    useDiscountCard && hasDiscountCards
                      ? 'bg-bey-orange text-bey-void border-bey-orangeDark'
                      : hasDiscountCards
                        ? 'bg-bey-paper text-bey-ink border-bey-steel hover:border-bey-ink/30'
                        : 'bg-bey-ink/5 text-bey-ink/30 border-transparent cursor-not-allowed'
                  }`}
                >
                  {hasDiscountCards ? (useDiscountCard ? '已套用 5 折' : '使用 5 折卡') : '沒有 5 折卡'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              {items.map(item => {
                const finalCost = useDiscountCard && hasDiscountCards ? getDiscountedRewardCost(item.points) : item.points;
                const canAfford = currentScore >= finalCost;

                return (
                  <button
                    key={item.id}
                    onClick={() => canAfford && setSelectedItemId(item.id)}
                    disabled={!canAfford}
                    className={`relative group flex flex-col items-center justify-between p-2.5 rounded-xl border-b-[3px] transition-all duration-150 min-h-[8rem]
                      ${!canAfford ? 'opacity-50 cursor-not-allowed bg-bey-void/40 border-bey-steel grayscale' : ''}
                      ${
                        selectedItemId === item.id
                          ? 'bg-bey-paper border-bey-orange ring-2 ring-bey-orange/40'
                          : canAfford ? 'bg-bey-paper border-bey-steel hover:border-bey-ink/20 active:border-b-0 active:translate-y-[3px]' : ''
                      }`}
                  >
                    {/* 價格標籤 */}
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-white font-bold text-[10px] bg-bey-orange">
                        {finalCost} pt
                    </div>

                    {/* 圖示 */}
                    <div className="flex-1 flex items-center justify-center text-3xl mt-1 group-hover:scale-105 transition-transform duration-200">
                        {item.icon || '🎁'}
                    </div>
                    
                    {/* 名稱 */}
                    <div className="w-full mt-1">
                      <span className="font-bold text-bey-ink text-center leading-tight w-full break-words text-xs block">
                          {item.label}
                      </span>
                      {useDiscountCard && hasDiscountCards && (
                        <span className="text-[10px] font-normal text-bey-dim mt-0.5 block text-center">
                          原價 {item.points} pt
                        </span>
                      )}
                    </div>

                    {/* 選中標記 */}
                    {selectedItemId === item.id && (
                        <div className="absolute bottom-1 left-1 text-bey-orange text-[10px] font-bold">
                            ✓
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {items.length === 0 && (
              <div className="text-center text-bey-dim text-sm font-bold py-6">
                  目前沒有可兌換的獎勵喔！請家長新增。
              </div>
            )}
          </div>

          {/* 底部按鈕區 */}
          <div className="p-3 border-t border-bey-ink/5 flex gap-2 bg-bey-paper relative z-10">
            <Button variant="ghost" className="flex-1" onClick={onClose}>再存一點</Button>
            <Button 
              type="button" // 明確指定 type 防止 form submit 行為
              variant="primary" 
              className="flex-[2] bg-bey-orange text-bey-void border-bey-orangeDark hover:brightness-110"
              disabled={!selectedItemId}
              onClick={handleRedeemClick}
              icon={<Icons.Gift size={18} strokeWidth={3} />}
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
        message={`確定要兌換「${selectedItem?.label}」嗎？\n原價：${selectedItem?.points ?? 0} 分\n實付：${selectedCost} 分${useDiscountCard && hasDiscountCards ? '\n本次會消耗 1 張 5 折卡。' : ''}`}
        confirmText="沒問題！"
        cancelText="再想想"
      />
    </>
  );
};
