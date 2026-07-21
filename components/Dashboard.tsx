import React, { useState } from 'react';
import {
  AppState,
  DiscountCard,
  GoalReward,
  RewardCard,
  RewardCardStatus,
  RewardItem,
  ScoreCategory,
  ScoreItem,
  ScoreRecord,
  ScoreType,
  SecretMessage,
  StampCard,
  User,
  UserRole,
} from '../types';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { calculateScore } from '../services/storageService';
import { Card } from './ui/Card';

// Sub-components
import { HistoryLog } from './HistoryLog';
import { ActionLogger } from './ActionLogger';
import { SettingsPanel } from './SettingsPanel';
import { RewardRedeemer } from './RewardRedeemer';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { PikminFlower } from './PikminFlower';
import {
  formatGoalDateRange,
  getActiveRewardCards,
  getActiveStampCards,
  getDiscountedRewardCost,
  getScoreCategoryChipClassName,
  getScoreCategoryLabel,
  getTodayDateKey,
  getUnusedDiscountCards,
  groupScoreItemsByCategory,
  isGoalPendingDecision,
  isGoalWithinActiveWindow,
  isStampCardComplete,
  SCORE_CATEGORY_OPTIONS,
} from '../services/familyUtils';

interface DashboardProps {
  currentUser: User;
  data: AppState;
  onLogout: () => void;
  onAddRecord: (record: Omit<ScoreRecord, 'id' | 'timestamp'>) => ScoreRecord | null;
  onUpdateItems: (items: ScoreItem[]) => void;
  onSendMessage: (msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) => void;
  onMarkMessageRead: (id: string) => void;
  onUpdateUsers: (users: User[]) => void;
  onImportData: (state: AppState) => void;
  onUpdateRewardItems: (items: RewardItem[]) => void;
  onUpdateGoalRewards: (updater: (items: GoalReward[]) => GoalReward[]) => void;
  onUpdateDiscountCards: (updater: (items: DiscountCard[]) => DiscountCard[]) => void;
  onUpdateRewardCards: (updater: (items: RewardCard[]) => RewardCard[]) => void;
  onUpdateStampCards: (updater: (items: StampCard[]) => StampCard[]) => void;
  cloudEmail: string;
  onCloudLogout: () => void;
}

type Tab = 'overview' | 'log' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  data, 
  onLogout, 
  onAddRecord, 
  onUpdateItems,
  onSendMessage,
  onMarkMessageRead,
  onUpdateUsers,
  onImportData,
  onUpdateRewardItems,
  onUpdateGoalRewards,
  onUpdateDiscountCards,
  onUpdateRewardCards,
  onUpdateStampCards,
  cloudEmail,
  onCloudLogout,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isParent = currentUser.role === UserRole.PARENT;

  // --- 動態取得要顯示的 children ---
  const allChildren = data.users.filter(u => u.role === UserRole.CHILD);
  // 家長可看全部小孩，小孩只能看自己
  const visibleChildren = isParent
    ? allChildren
    : allChildren.filter(c => c.id === currentUser.id);

  // 計算每位可見小孩的分數
  const childScores = visibleChildren.map(child => ({
    user: child,
    score: calculateScore(child.id, data.records),
  }));
  const today = getTodayDateKey();
  const visibleChildIds = new Set(visibleChildren.map((child) => child.id));
  const visibleGoals = data.goalRewards.filter((goal) => visibleChildIds.has(goal.childId));
  const activeGoalReminders = visibleGoals.filter((goal) => isGoalWithinActiveWindow(goal, today));
  const pendingGoalReminders = visibleGoals.filter((goal) => isGoalPendingDecision(goal, today));

  // 色彩主題輪替
  const colorThemes: Array<'blue' | 'green'> = ['blue', 'green'];

  // --- 狀態：日期篩選器 (預設 7 天) ---
  const [daysFilter, setDaysFilter] = useState(7);

  // --- 狀態：控制 ActionLogger (加扣分) 視窗 ---
  const [loggingAction, setIsLoggingAction] = useState<{childId: string, type: 'POSITIVE' | 'NEGATIVE'} | null>(null);

  // --- 狀態：控制 RewardRedeemer (兌換獎勵) 視窗 ---
  const [redeemingReward, setIsRedeemingReward] = useState<{childId: string} | null>(null);

  // --- 狀態：手機版雲端帳號展開 ---
  const [showCloudInfo, setShowCloudInfo] = useState(false);

  // --- 狀態：獎勵卡兌換確認 ---
  const [rewardCardToRedeem, setRewardCardToRedeem] = useState<RewardCard | null>(null);

  /**
   * 渲染主要內容區域
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-5 animate-pop">
            {/* 歡迎標題區塊 */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-nook-brown leading-tight">
                        {new Date().getHours() < 12 ? '早安！' : '你好！'} 
                        <span className="text-nook-greenDark ml-1">{currentUser.name}</span>
                    </h2>
                    <p className="text-nook-brown/55 font-bold mt-1 text-xs md:text-sm">把今天的小進步種進家庭花園</p>
                </div>
                <div className="bg-white px-2.5 py-1.5 rounded-xl flex-shrink-0 soft-card">
                    <span className="font-bold text-nook-brown/60 text-xs">{new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })}</span>
                </div>
            </div>

            {isParent && (
              <ParentGoalReminderSection
                goals={activeGoalReminders}
                pendingGoals={pendingGoalReminders}
                users={data.users}
                discountCards={data.discountCards}
              />
            )}

            {/* 成員積分卡片區塊 - 動態渲染 */}
            <div className={`grid gap-3 md:gap-4 ${visibleChildren.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-2'}`}>
              {childScores.map((cs, idx) => (
                <ScoreCard 
                  key={cs.user.id}
                  user={cs.user} 
                  score={cs.score} 
                  onAddPoints={() => isParent && setIsLoggingAction({ childId: cs.user.id, type: 'POSITIVE' })}
                  onDeductPoints={() => isParent && setIsLoggingAction({ childId: cs.user.id, type: 'NEGATIVE' })}
                  onRedeem={() => setIsRedeemingReward({ childId: cs.user.id })}
                  canManageScoreActions={isParent}
                  colorTheme={colorThemes[idx % colorThemes.length]}
                  availableDiscountCardCount={getUnusedDiscountCards(data.discountCards, cs.user.id).length}
                />
              ))}
            </div>

             {/* 家長專屬：獎勵卡與集點卡 */}
             {isParent && (
               <div className={`grid gap-3 md:gap-4 ${visibleChildren.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-2'}`}>
                 {childScores.map((cs) => (
                   <FamilyCardsSection
                     key={cs.user.id}
                     childId={cs.user.id}
                     childName={cs.user.name}
                     rewardCards={data.rewardCards}
                     stampCards={data.stampCards}
                     isParent={isParent}
                     onRedeemRewardCard={handleRedeemRewardCard}
                   />
                 ))}
               </div>
             )}

             {/* 最近紀錄已移至「日誌」頁，首頁不再重複顯示 */}

             {/* 小孩專屬區塊 */}
             {!isParent && (
                <ChildOverviewSection
                  currentUser={currentUser}
                  records={data.records}
                  score={childScores[0]?.score ?? 0}
                  rewardItems={data.rewardItems}
                  scoreItems={data.scoreItems}
                  goalRewards={activeGoalReminders.filter((goal) => goal.childId === currentUser.id)}
                  availableDiscountCardCount={getUnusedDiscountCards(data.discountCards, currentUser.id).length}
                  rewardCards={data.rewardCards}
                  stampCards={data.stampCards}
                />
             )}
          </div>
        );
      case 'log': {
        // 日誌篩選邏輯
        const cutoffTime = Date.now() - (daysFilter * 24 * 60 * 60 * 1000);
        let filteredRecords = data.records.filter(r => r.timestamp >= cutoffTime);
        
        // 小孩只能看到自己的紀錄
        if (!isParent) {
          filteredRecords = filteredRecords.filter(r => r.childId === currentUser.id);
        }

        return (
           <Card variant="paper" className="min-h-[320px] bg-white">
             <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-nook-brown/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icons.BookOpen className="text-nook-greenDark" size={18} />
                  <div>
                    <h2 className="text-base font-black text-nook-brown md:text-lg">積分日誌</h2>
                    <p className="text-[10px] font-bold text-nook-brown/45">每筆加扣分依時間排列</p>
                  </div>
                </div>
                
                {/* 顯示範圍選擇器 */}
                <div className="relative rounded-xl bg-nook-beige/70 p-1">
                   <select 
                     value={daysFilter} 
                     onChange={(e) => setDaysFilter(Number(e.target.value))}
                     className="appearance-none rounded-lg border border-nook-brown/10 bg-white py-1.5 pl-2.5 pr-8 text-xs font-bold text-nook-brown outline-none focus:border-nook-green"
                   >
                     <option value={7}>最近 7 天</option>
                     <option value={14}>最近 14 天</option>
                     <option value={30}>最近 30 天</option>
                     <option value={9999}>全部紀錄</option>
                   </select>
                   <Icons.ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nook-brown/40" />
                </div>
             </div>

             <HistoryLog records={filteredRecords} showAll={true} />
           </Card>
        );
      }
      case 'settings':
        return isParent ? (
          <SettingsPanel 
            appData={data}
            onUpdateItems={onUpdateItems} 
            onUpdateUsers={onUpdateUsers}
            onImportData={onImportData}
            onUpdateRewardItems={onUpdateRewardItems}
            onUpdateGoalRewards={onUpdateGoalRewards}
            onUpdateDiscountCards={onUpdateDiscountCards}
            onUpdateRewardCards={onUpdateRewardCards}
            onUpdateStampCards={onUpdateStampCards}
            resolver={currentUser}
          />
        ) : <div className="p-12 md:p-20 text-center font-bold text-nook-brown/50 text-lg md:text-xl">🚧 施工中，閒人勿進！ 🚧</div>;
      default:
        return null;
    }
  };

  /**
   * 處理加/扣分提交
   */
  const handleActionSubmit = (itemId: string, note?: string, customPoints?: number, category?: ScoreCategory) => {
    if (!isParent || !loggingAction) return;
    const child = data.users.find(u => u.id === loggingAction.childId);

    // 「其它」自訂分數
    if (itemId === '__custom__' && customPoints) {
      onAddRecord({
        childId: loggingAction.childId,
        childName: child?.name || 'Unknown',
        itemId: '__custom__',
        itemName: '其它',
        pointsChange: loggingAction.type === 'POSITIVE' ? customPoints : -customPoints,
        scoreCategory: category ?? ScoreCategory.DAILY,
        note,
        createdById: currentUser.id,
        createdByName: currentUser.name
      });
      setIsLoggingAction(null);
      return;
    }

    const item = data.scoreItems.find(i => i.id === itemId);
    if (!item) return;

    onAddRecord({
      childId: loggingAction.childId,
      childName: child?.name || 'Unknown',
      itemId: item.id,
      itemName: item.label,
      pointsChange: item.type === 'POSITIVE' ? item.points : -item.points,
      scoreCategory: item.category,
      note,
      createdById: currentUser.id,
      createdByName: currentUser.name
    });
    setIsLoggingAction(null);
  };

  /**
   * 處理獎勵兌換提交
   */
  const handleRedeemSubmit = (itemId: string, useDiscountCard: boolean) => {
    if (!redeemingReward) return;
    const reward = data.rewardItems.find(r => r.id === itemId);
    if (!reward) return;

    const child = data.users.find(u => u.id === redeemingReward.childId);
    const availableCards = getUnusedDiscountCards(data.discountCards, redeemingReward.childId);
    const cardToUse = useDiscountCard ? availableCards[0] : undefined;
    const finalCost = cardToUse ? getDiscountedRewardCost(reward.points) : reward.points;

    const record = onAddRecord({
        childId: redeemingReward.childId,
        childName: child?.name || 'Unknown',
        itemId: reward.id,
        itemName: `兌換：${reward.label}`,
        pointsChange: -finalCost,
        scoreCategory: null,
        note: `獎勵兌換｜原價 ${reward.points} 分｜實付 ${finalCost} 分｜${cardToUse ? '使用 5 折卡' : '未使用 5 折卡'}`,
        createdById: currentUser.id,
        createdByName: currentUser.name
    });

    if (record && cardToUse) {
      onUpdateDiscountCards((items) =>
        items.map((item) =>
          item.id === cardToUse.id
            ? {
                ...item,
                usedAt: Date.now(),
                usedById: currentUser.id,
                usedByName: currentUser.name,
                usedOnRecordId: record.id,
              }
            : item,
        ),
      );
    }
    setIsRedeemingReward(null);
  };

  /**
   * 兌換獎勵卡（不扣分）：寫入一筆 0 分紀錄方便日誌追蹤，並標記卡片為已兌換
   */
  const executeRedeemRewardCard = (card: RewardCard) => {
    if (card.status !== RewardCardStatus.ACTIVE) return;

    const record = onAddRecord({
      childId: card.childId,
      childName: data.users.find((u) => u.id === card.childId)?.name || 'Unknown',
      itemId: `rewardcard_${card.id}`,
      itemName: `獎勵卡：${card.rewardLabel}`,
      pointsChange: 0,
      scoreCategory: null,
      note: `獎勵卡兌換｜${card.title}｜免扣分`,
      createdById: currentUser.id,
      createdByName: currentUser.name,
    });

    onUpdateRewardCards((items) =>
      items.map((item) =>
        item.id === card.id
          ? {
              ...item,
              status: RewardCardStatus.REDEEMED,
              redeemedAt: Date.now(),
              redeemedById: currentUser.id,
              redeemedByName: currentUser.name,
              redeemedRecordId: record?.id ?? null,
            }
          : item,
      ),
    );
  };

  // 開啟獎勵卡兌換確認視窗
  const handleRedeemRewardCard = (card: RewardCard) => {
    if (card.status !== RewardCardStatus.ACTIVE) return;
    setRewardCardToRedeem(card);
  };

  // 計算兌換時的目前分數
  const getRedeemScore = (childId: string) => {
    return calculateScore(childId, data.records);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden app-bg">
      {/* ===== 桌面版側邊導覽列 (lg 以上；手機與 iPad 直式改用底部導覽) ===== */}
      <aside className="hidden lg:flex w-64 bg-nook-cream border-r border-nook-greenDark/10 flex-col flex-shrink-0 z-20 relative">

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="p-5 flex items-center justify-start text-left"
        >
           <div className="w-10 h-10 bg-nook-green/15 rounded-full flex items-center justify-center">
             <PikminFlower size={27} />
           </div>
           <div className="ml-3">
             <h1 className="font-black text-lg text-nook-brown leading-none">Sweet Home</h1>
             <span className="text-nook-greenDark font-bold text-[10px] tracking-[0.14em]">FAMILY GARDEN</span>
           </div>
        </button>
        
        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto no-scrollbar">
          <NavItem 
            active={activeTab === 'log'} 
            onClick={() => setActiveTab('log')} 
            icon={<Icons.ClipboardList size={24} />} 
            label="日誌" 
            bgColor="bg-nook-blue"
          />
          {isParent && (
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Icons.Settings size={24} />} 
              label="設定" 
              bgColor="bg-nook-brown"
            />
          )}
        </nav>

        <div className="p-3 mt-auto space-y-2">
           {/* 使用者簡介卡片 */}
           <div className="bg-nook-yellow/15 p-3 rounded-xl">
               <div className="flex items-center">
                 <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg border border-nook-brown/10 flex-shrink-0">
                   {currentUser.avatar}
                 </div>
                 <div className="overflow-hidden ml-2">
                   <p className="text-sm font-black text-nook-brown truncate">{currentUser.name}</p>
                   <p className="text-xs text-nook-brown/60 font-bold">{isParent ? '管理員' : '成員'}</p>
                 </div>
               </div>
           </div>

           {/* 雲端帳號資訊 (整合進側欄) */}
           <div className="bg-white/80 p-3 rounded-xl">
               <div className="hidden lg:flex items-center gap-2 mb-2">
                 <span className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</span>
               </div>
               <p className="text-xs font-bold text-nook-brown/70 truncate hidden lg:block mb-2">{cloudEmail}</p>
               <button
                 type="button"
                 onClick={onCloudLogout}
                 className="w-full px-3 py-1.5 rounded-xl bg-nook-brown/5 text-nook-brown/60 text-xs font-bold hover:bg-nook-brown/10 transition-colors text-center"
               >
                 <span className="hidden lg:inline">切換雲端帳號</span>
                 <span className="lg:hidden">☁️</span>
               </button>
           </div>

          <button 
            onClick={onLogout}
            className="w-full group flex items-center justify-center lg:justify-start p-3 rounded-2xl text-nook-brown/50 hover:text-nook-greenDark hover:bg-nook-green/10 transition-colors font-bold"
          >
            <Icons.User size={22} className="lg:mr-2" />
            <span className="hidden lg:inline">切換角色</span>
          </button>
        </div>
      </aside>

      {/* ===== 主要內容區域 ===== */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {/* 手機版頂部導覽 */}
        <header className="sticky top-0 bg-white/95 z-30 px-4 py-2 flex justify-between items-center lg:hidden border-b border-nook-greenDark/10">
            <div className="flex items-center gap-2">
              <PikminFlower size={24} className="animate-sway" />
              <div>
                <h1 className="text-base font-black text-nook-brown leading-none">Sweet Home</h1>
                <span className="text-[9px] font-black tracking-[0.12em] text-nook-greenDark">FAMILY GARDEN</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 雲端帳號按鈕 */}
              <button
                type="button"
                onClick={() => setShowCloudInfo(!showCloudInfo)}
                className="w-8 h-8 bg-nook-blue/15 rounded-full flex items-center justify-center text-sm"
                title="雲端帳號"
              >
                ☁️
              </button>
              <div className="w-8 h-8 bg-nook-beige rounded-full flex items-center justify-center border border-nook-brown/10 text-base">{currentUser.avatar}</div>
            </div>
        </header>

        {/* 手機版雲端帳號下拉面板 */}
        {showCloudInfo && (
          <div className="lg:hidden bg-white border-b border-nook-brown/5 px-4 py-2.5 animate-pop z-20 relative">
            <p className="text-[10px] font-black text-nook-brown/40 tracking-wider">☁️ 雲端帳號</p>
            <p className="text-sm font-bold text-nook-brown break-all mb-3">{cloudEmail}</p>
            <button
              type="button"
              onClick={onCloudLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-nook-red/10 text-nook-red text-sm font-black hover:bg-nook-red/20 transition-colors"
            >
              <Icons.LogOut size={16} />
              登出雲端帳號
            </button>
          </div>
        )}

        <div className="relative p-3.5 md:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">
          <div className="relative z-10">{renderContent()}</div>
        </div>
      </main>

      {/* ===== 手機版底部導覽列 ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-nook-greenDark/10 shadow-[0_-2px_8px_rgba(44,122,75,0.08)]">
        <div className="flex items-stretch justify-around px-2 py-1 safe-bottom">
          <MobileNavItem
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Icons.Home size={22} />}
            label="首頁"
          />
          <MobileNavItem
            active={activeTab === 'log'}
            onClick={() => setActiveTab('log')}
            icon={<Icons.ClipboardList size={22} />}
            label="日誌"
          />
          {isParent && (
            <MobileNavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Icons.Settings size={22} />}
              label="設定"
            />
          )}
          <MobileNavItem
            active={false}
            onClick={onLogout}
            icon={<Icons.User size={22} />}
            label="切換角色"
          />
        </div>
      </nav>

      {/* 加扣分操作視窗 (Modal) */}
      {isParent && loggingAction && (
        <ActionLogger 
          isOpen={true}
          onClose={() => setIsLoggingAction(null)}
          onSubmit={handleActionSubmit}
          items={data.scoreItems}
          type={loggingAction.type}
          targetChildName={data.users.find(u => u.id === loggingAction.childId)?.name || ''}
        />
      )}

      {/* 獎勵兌換視窗 (Modal) */}
      {redeemingReward && (
          <RewardRedeemer 
            isOpen={true}
            onClose={() => setIsRedeemingReward(null)}
            onSubmit={handleRedeemSubmit}
            items={data.rewardItems}
            currentScore={getRedeemScore(redeemingReward.childId)}
            targetChildName={data.users.find(u => u.id === redeemingReward.childId)?.name || ''}
            availableDiscountCards={getUnusedDiscountCards(data.discountCards, redeemingReward.childId)}
          />
      )}

      {/* 獎勵卡兌換確認 */}
      <ConfirmationModal
        isOpen={rewardCardToRedeem !== null}
        onClose={() => setRewardCardToRedeem(null)}
        onConfirm={() => {
          if (rewardCardToRedeem) executeRedeemRewardCard(rewardCardToRedeem);
          setRewardCardToRedeem(null);
        }}
        title="兌換獎勵卡"
        message={rewardCardToRedeem
          ? `確定要兌換「${rewardCardToRedeem.rewardLabel}」嗎？\n這張獎勵卡免扣分，兌換後即標記為已使用。`
          : ''}
        confirmText="沒問題！"
        cancelText="再想想"
      />
    </div>
  );
};

// --- 桌面版側欄按鈕元件 ---
const NavItem = ({ active, onClick, icon, label, bgColor, badge = 0 }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, bgColor: string, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-2.5 rounded-xl transition-colors duration-200 group relative ${
      active 
        ? 'bg-white text-nook-brown'
        : 'text-nook-brown/60 hover:bg-white/60'
    }`}
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${bgColor}`}>
      {icon}
    </div>
    <span className="ml-3 font-black text-sm">{label}</span>
    
    {badge > 0 && (
        <div className="absolute top-1 right-2 w-5 h-5 bg-nook-red border-2 border-white rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
        </div>
    )}
  </button>
);

// --- 手機版底部導覽按鈕元件 ---
const MobileNavItem = ({ active, onClick, icon, label, isDanger = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDanger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex min-h-12 flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors min-w-[60px] ${
      active 
        ? 'text-nook-greenDark bg-nook-green/10' 
        : isDanger 
          ? 'text-nook-brown/40 hover:text-nook-red' 
          : 'text-nook-brown/40 hover:text-nook-brown/70'
    }`}
  >
    {icon}
    <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-nook-greenDark' : ''}`}>{label}</span>
  </button>
);

// --- 小孩專屬概覽區塊 ---
const ENCOURAGEMENTS = [
  { min: 0, messages: [
    '加油！每一步都是進步 🌱', '新的一天，新的開始！💪', '繼續努力，你可以的！🌟',
    '相信自己，你比想像中更強大 💫', '今天也要元氣滿滿喔！☀️', '慢慢來，比較快 🐢',
    '每個小進步都值得慶祝 🥳', '失敗是成功的媽媽，不要怕！🦸', '你的潛力是無限的！🚀',
    '做最好的自己就夠了 🌻', '勇敢踏出第一步吧！👣', '今天的努力是明天的禮物 🎁',
    '不要放棄，奇蹟就在前方 ✨', '你已經很棒了，再多一點點！🌈',
  ]},
  { min: 20, messages: [
    '表現不錯喔！繼續保持 🎯', '你正在進步中！👏', '離獎勵又近了一步！🏃',
    '看得出來你很認真呢！📈', '你的付出正在開花結果 🌸', '穩定進步中，太好了！🐾',
    '每天都比昨天更好一點 🌤️', '堅持就是勝利，你做到了！🏅', '這個節奏很棒，繼續前進！🎶',
    '你的好表現大家都看在眼裡 👀', '積少成多，積分在成長！💰', '紀律讓你更強大 💎',
    '爸爸媽媽以你為榮 🥰', '好習慣正在養成中！🌿',
  ]},
  { min: 50, messages: [
    '哇！你好棒！🌈', '太厲害了，繼續加油！🔥', '你是家裡的小天使！😇',
    '五十分大關突破了！🎊', '你簡直是超級英雄！🦸‍♂️', '這份堅持令人佩服 👏👏',
    '你的光芒閃耀全家！✨', '好棒好棒，要飛起來了！🦅', '你是最努力的小勇士！⚔️',
    '夢想正在一步步實現 🌠', '你讓全家都好開心！💕', '積分高手就是你！🎮',
    '這麼棒的表現值得掌聲！👏🎉', '你已經是閃亮的星星了 ⭐',
  ]},
  { min: 100, messages: [
    '超級厲害！你是最棒的！🏆', '積分王者就是你！👑', '你的努力大家都看到了！🎉',
    '一百分！傳說中的小達人 🐉', '你的毅力比鑽石還堅強 💎', '全家的驕傲就是你！🏠💖',
    '你已經是大師級了！🥋', '太不可思議了，繼續創紀錄！📊', '你的名字會寫在榮譽榜上 📜',
    '這就是傳說中的自律大神！🧘', '你為自己贏得了最大的獎勵——成長！🌳', '無敵是多麼寂寞 😎',
    '爸爸媽媽最愛你，真的太棒了！❤️', '你就是家裡的 MVP！🌟🏆',
  ]},
];

const getEncouragement = (score: number): string => {
  const tier = [...ENCOURAGEMENTS].reverse().find(t => score >= t.min) || ENCOURAGEMENTS[0];
  const msgs = tier.messages;
  // 用日期當 seed，每天換一句
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % msgs.length;
  return msgs[dayIndex];
};

const ParentGoalReminderSection = ({
  goals,
  pendingGoals,
  users,
  discountCards,
}: {
  goals: GoalReward[];
  pendingGoals: GoalReward[];
  users: User[];
  discountCards: DiscountCard[];
}) => {
  if (goals.length === 0 && pendingGoals.length === 0) {
    return null;
  }

  const renderGoalCard = (goal: GoalReward, tone: 'active' | 'pending') => {
    const child = users.find((user) => user.id === goal.childId);
    const hasIssuedCard = discountCards.some((card) => card.goalId === goal.id);

    return (
      <div
        key={goal.id}
        className={`px-3 py-2.5 rounded-xl ${
          tone === 'pending'
            ? 'bg-nook-red/10'
            : 'bg-nook-beige/45'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-nook-blue/10 text-nook-blueDark">
            {child?.name ?? '未指定孩子'}
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-nook-yellow/25 text-nook-orangeDark">
            {tone === 'pending' ? '待判定' : '進行中'}
          </span>
          {hasIssuedCard && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#6D46C2]">
              已發卡
            </span>
          )}
        </div>
        <p className="font-bold text-sm text-nook-brown leading-snug">{goal.targetText}</p>
        <p className="text-[10px] font-bold text-nook-brown/45 mt-1">{formatGoalDateRange(goal)}</p>
      </div>
    );
  };

  return (
    <Card className="bg-white">
      <div className="flex items-center mb-3 gap-2">
        <div className="w-8 h-8 bg-nook-orange/15 rounded-lg text-nook-orangeDark flex items-center justify-center"><Icons.Calendar size={17} /></div>
        <h3 className="text-base font-black text-nook-brown">目標提醒</h3>
        <div className="ml-auto flex gap-1.5 text-[10px] font-black">
          {pendingGoals.length > 0 && <span className="px-2 py-1 rounded-full bg-nook-red/10 text-nook-red">待判定 {pendingGoals.length}</span>}
          {goals.length > 0 && <span className="px-2 py-1 rounded-full bg-nook-green/10 text-nook-greenDark">進行中 {goals.length}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {pendingGoals.length > 0 && (
          <div className="space-y-2">
            {pendingGoals.map((goal) => renderGoalCard(goal, 'pending'))}
          </div>
        )}
        {goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => renderGoalCard(goal, 'active'))}
          </div>
        )}
      </div>
    </Card>
  );
};

const ParentRecentRecordsGrid = ({
  childScores,
  records,
  colorThemes,
}: {
  childScores: Array<{ user: User; score: number }>;
  records: ScoreRecord[];
  colorThemes: Array<'blue' | 'green'>;
}) => (
  <div className={`grid gap-6 md:gap-8 ${childScores.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
    {childScores.map((childScore, idx) => {
      const recentRecords = records
        .filter((record) => record.childId === childScore.user.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      const isBlue = colorThemes[idx % colorThemes.length] === 'blue';

      return (
        <Card
          key={childScore.user.id}
          className={`border-4 bg-white/60 ${isBlue ? 'border-nook-blue/30' : 'border-nook-green/30'}`}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-nook-brown/10 flex items-center justify-center text-2xl">
                {childScore.user.avatar}
              </div>
              <div>
                <h3 className="font-black text-xl text-nook-brown">{childScore.user.name}</h3>
                <p className="text-sm font-bold text-nook-brown/50">最近 5 筆紀錄</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-xs font-black ${isBlue ? 'bg-nook-blue' : 'bg-nook-green'}`}>
              目前 {childScore.score} 分
            </div>
          </div>

          {recentRecords.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-nook-brown/10 bg-white/70 px-4 py-8 text-center text-nook-brown/40 font-bold">
              還沒有任何紀錄
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div key={record.id} className="rounded-[1.5rem] bg-white px-4 py-3 border-2 border-nook-brown/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-nook-brown truncate">{record.itemName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-nook-brown/40">
                          {new Date(record.timestamp).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {record.scoreCategory && (
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${getScoreCategoryChipClassName(record.scoreCategory)}`}>
                            {getScoreCategoryLabel(record.scoreCategory)}
                          </span>
                        )}
                      </div>
                      {record.note && (
                        <p className="text-xs font-bold text-nook-brown/55 mt-2 break-words">{record.note}</p>
                      )}
                    </div>
                    <div className={`text-lg font-black flex-shrink-0 ${record.pointsChange > 0 ? 'text-nook-greenDark' : 'text-nook-red'}`}>
                      {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      );
    })}
  </div>
);

const ChildOverviewSection = ({ currentUser, records, score, rewardItems, scoreItems, goalRewards, availableDiscountCardCount, rewardCards, stampCards }: {
  currentUser: User;
  records: ScoreRecord[];
  score: number;
  rewardItems: { id: string; label: string; points: number; icon?: string }[];
  scoreItems: ScoreItem[];
  goalRewards: GoalReward[];
  availableDiscountCardCount: number;
  rewardCards: RewardCard[];
  stampCards: StampCard[];
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const myRecords = records.filter(r => r.childId === currentUser.id);

  // 本週統計
  const now = Date.now();
  const weekStart = now - (new Date().getDay() * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(weekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekRecords = myRecords.filter(r => r.timestamp >= startOfWeek.getTime());
  const weekPositive = weekRecords.filter(r => r.pointsChange > 0);
  const weekNegative = weekRecords.filter(r => r.pointsChange < 0);
  const weekNet = weekRecords.reduce((sum, r) => sum + r.pointsChange, 0);

  // 最近可兌換的獎勵（分數最接近且買得起的）
  const affordableRewards = rewardItems.filter(r => r.points <= score).sort((a, b) => b.points - a.points);
  const nextReward = rewardItems.filter(r => r.points > score).sort((a, b) => a.points - b.points)[0];
  const positiveItemsByCategory = groupScoreItemsByCategory(scoreItems, ScoreType.POSITIVE);
  const negativeItemsByCategory = groupScoreItemsByCategory(scoreItems, ScoreType.NEGATIVE);

  return (
    <div className="space-y-3 md:space-y-4">
      {goalRewards.length > 0 && (
        <Card className="bg-nook-orange/10">
          <div className="flex items-center mb-2.5 gap-2">
            <div className="w-7 h-7 bg-nook-orange/20 rounded-lg text-nook-orangeDark flex items-center justify-center"><Icons.Calendar size={15} /></div>
            <h3 className="text-sm md:text-base font-black text-nook-brown">這段時間的努力目標</h3>
          </div>
          <div className="space-y-2">
            {goalRewards.map((goal) => (
              <div key={goal.id} className="bg-white/85 rounded-xl p-3">
                <p className="text-sm font-black text-nook-brown leading-snug">{goal.targetText}</p>
                <div className="flex flex-wrap items-center justify-between gap-1 mt-1.5">
                  <p className="text-[10px] font-bold text-nook-brown/45">{formatGoalDateRange(goal)}</p>
                  <p className="text-[10px] font-bold text-nook-orangeDark">達成可獲得 5 折卡</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 鼓勵語句 */}
      <Card className="bg-nook-yellow/10">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {score >= 100 ? '👑' : score >= 50 ? '🌟' : score >= 20 ? '🌱' : '💪'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm md:text-base font-black text-nook-brown">{getEncouragement(score)}</p>
            {nextReward && (
              <p className="text-xs text-nook-brown/60 font-bold mt-1 leading-snug">
                再努力 <span className="text-nook-orangeDark">{nextReward.points - score}</span> 分就可以兌換「{nextReward.icon || '🎁'} {nextReward.label}」！
              </p>
            )}
            {!nextReward && affordableRewards.length > 0 && (
              <p className="text-xs text-nook-greenDark font-bold mt-1">
                你有足夠的分數兌換獎勵了！快去看看吧 🎉
              </p>
            )}
            <p className="text-[10px] text-[#6D46C2] font-bold mt-1.5">
              目前有 {availableDiscountCardCount} 張 5 折卡
            </p>
          </div>
        </div>
      </Card>

      {/* 獎勵卡與集點卡 */}
      <FamilyCardsSection
        childId={currentUser.id}
        childName={currentUser.name}
        rewardCards={rewardCards}
        stampCards={stampCards}
        isParent={false}
      />

      <Card className="bg-white">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="w-full flex items-center gap-2"
          aria-expanded={showGuide}
        >
          <div className="w-7 h-7 bg-nook-green/15 rounded-lg text-nook-greenDark flex items-center justify-center"><Icons.BookOpen size={15} /></div>
          <h3 className="text-sm md:text-base font-black text-nook-brown">積分項目指南</h3>
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-nook-brown/50">
            {showGuide ? '收合' : '展開'}
            <Icons.ChevronRight size={18} className={`transition-transform ${showGuide ? 'rotate-90' : ''}`} />
          </span>
        </button>
        {showGuide && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3 animate-pop">
            <ScoreGuidePanel title="可以怎麼加分" itemsByCategory={positiveItemsByCategory} type={ScoreType.POSITIVE} />
            <ScoreGuidePanel title="哪些行為會扣分" itemsByCategory={negativeItemsByCategory} type={ScoreType.NEGATIVE} />
          </div>
        )}
      </Card>

      {/* 本週表現統計 */}
      <Card className="bg-white">
        <div className="flex items-center mb-2.5 gap-2">
          <div className="w-7 h-7 bg-nook-blue/15 rounded-lg text-nook-blueDark flex items-center justify-center"><Icons.Calendar size={15} /></div>
          <h3 className="text-sm md:text-base font-black text-nook-brown">本週表現</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-nook-green/10 rounded-xl p-2 text-center">
            <div className="text-xl font-black text-nook-greenDark">{weekPositive.length}</div>
            <div className="text-[10px] font-bold text-nook-brown/60">加分</div>
          </div>
          <div className="bg-nook-red/10 rounded-xl p-2 text-center">
            <div className="text-xl font-black text-nook-red">{weekNegative.length}</div>
            <div className="text-[10px] font-bold text-nook-brown/60">扣分</div>
          </div>
          <div className={`${weekNet >= 0 ? 'bg-nook-blue/10' : 'bg-nook-orange/10'} rounded-xl p-2 text-center`}>
            <div className={`text-xl font-black ${weekNet >= 0 ? 'text-nook-blueDark' : 'text-nook-orangeDark'}`}>
              {weekNet >= 0 ? '+' : ''}{weekNet}
            </div>
            <div className="text-[10px] font-bold text-nook-brown/60">淨得分</div>
          </div>
        </div>
      </Card>
      {/* 最近動態已移至「日誌」頁，首頁不再重複顯示 */}
    </div>
  );
};

// --- 獎勵卡與集點卡展示區 ---
const FamilyCardsSection = ({
  childId,
  childName,
  rewardCards,
  stampCards,
  isParent,
  onRedeemRewardCard,
}: {
  childId: string;
  childName?: string;
  rewardCards: RewardCard[];
  stampCards: StampCard[];
  isParent: boolean;
  onRedeemRewardCard?: (card: RewardCard) => void;
}) => {
  const activeRewardCards = getActiveRewardCards(rewardCards, childId);
  const activeStampCards = getActiveStampCards(stampCards, childId);

  if (activeRewardCards.length === 0 && activeStampCards.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white">
      <div className="flex items-center mb-3 gap-2">
        <div className="w-7 h-7 bg-[#F6A0B8]/20 rounded-lg text-[#C85078] flex items-center justify-center"><Icons.Gift size={15} /></div>
        <h3 className="text-sm md:text-base font-black text-nook-brown truncate">{childName ? `${childName}的收藏` : '我的卡片'}</h3>
      </div>

      {activeRewardCards.length > 0 && (
        <div className="mb-3">
          <p className="font-black text-[#C85078] text-[11px] mb-1.5">獎勵卡</p>
          <div className="space-y-1.5">
            {activeRewardCards.map((card) => (
              <div key={card.id} className="bg-[#FDF2F8] rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg flex-shrink-0">
                    {card.rewardIcon || '🎁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-nook-brown/45 truncate">{card.title}</p>
                    <p className="truncate whitespace-nowrap text-[11px] font-black leading-tight text-nook-brown" title={card.rewardLabel}>{card.rewardLabel}</p>
                  </div>
                </div>
                {isParent ? (
                    <button
                      type="button"
                      className="mt-2 min-h-8 w-full rounded-lg bg-[#D85A82] px-2 text-[11px] font-black text-white hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B94168]"
                      onClick={() => onRedeemRewardCard?.(card)}
                    >
                      兌換這份獎勵
                    </button>
                  ) : (
                    <span className="mt-2 block rounded-lg bg-white px-2 py-1.5 text-center text-[10px] font-black text-[#B94168]">
                      請爸媽協助兌換
                    </span>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStampCards.length > 0 && (
        <div>
          <p className="font-black text-nook-orangeDark text-[11px] mb-1.5">集點卡</p>
          <div className="space-y-1.5">
            {activeStampCards.map((card) => (
              <StampCardRow key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// --- 集點卡進度列 (展示用) ---
const StampCardRow = ({ card }: { card: StampCard }) => {
  const complete = isStampCardComplete(card);
  const filled = Math.min(card.stamps, card.targetStamps);

  return (
    <div className={`rounded-xl p-2.5 ${complete ? 'bg-nook-yellow/20' : 'bg-nook-beige/35'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-nook-brown leading-tight break-words">{card.title}</p>
          <p className="text-[9px] font-bold text-nook-brown/50 truncate">{card.rewardIcon || '🎁'} {card.rewardLabel}</p>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${complete ? 'bg-nook-orange text-white' : 'bg-white text-nook-brown/60'}`}>
          {filled}/{card.targetStamps}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white overflow-hidden" aria-label={`已集 ${filled} 點，共 ${card.targetStamps} 點`}>
        <div className="h-full rounded-full bg-nook-orange" style={{ width: `${Math.min((filled / card.targetStamps) * 100, 100)}%` }} />
      </div>
      {complete && (
        <p className="text-[10px] font-black text-nook-orangeDark mt-1.5">集滿了，可以兌換禮物！</p>
      )}
    </div>
  );
};

const ScoreGuidePanel = ({
  title,
  itemsByCategory,
  type,
}: {
  title: string;
  itemsByCategory: Map<ScoreCategory, ScoreItem[]>;
  type: ScoreType;
}) => (
  <div className="rounded-xl bg-nook-beige/35 p-3">
    <h4 className="font-black text-nook-brown text-sm mb-2.5">{title}</h4>
    <div className="space-y-3">
      {SCORE_CATEGORY_OPTIONS.map((option) => {
        const items = itemsByCategory.get(option.value) ?? [];
        if (!items.length) return null;

        return (
          <div key={option.value} className="space-y-1.5">
            <div className={`px-2 py-1 rounded-full border text-[10px] font-black inline-flex ${getScoreCategoryChipClassName(option.value)}`}>
              {option.label}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-nook-beige/50 flex items-center justify-center text-sm flex-shrink-0">
                      {item.icon || (type === ScoreType.POSITIVE ? '⭐' : '⚠️')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nook-brown break-words">{item.label}</p>
                    </div>
                  </div>
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${type === ScoreType.POSITIVE ? 'bg-nook-green/20 text-nook-greenDark' : 'bg-nook-red/20 text-nook-red'}`}>
                    {type === ScoreType.POSITIVE ? '+' : '-'}{item.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// --- 積分卡片元件 (包含操作按鈕) ---
const ScoreCard = ({ user, score, onAddPoints, onDeductPoints, onRedeem, canManageScoreActions, colorTheme, availableDiscountCardCount }: { 
  user: User, 
  score: number, 
  onAddPoints: () => void,
  onDeductPoints: () => void,
  onRedeem: () => void,
  canManageScoreActions: boolean,
  colorTheme: 'blue' | 'green',
  availableDiscountCardCount: number,
}) => {
  const isBlue = colorTheme === 'blue';

  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl soft-card border-t-[3px] p-3 md:p-4 ${isBlue ? 'border-nook-blue' : 'border-nook-green'}`}>
      <div className="absolute right-1.5 top-1 opacity-70 animate-sway">
        <PikminFlower size={30} center={isBlue ? '#3282A5' : '#2C7A4B'} />
      </div>

      <div className="relative flex items-center gap-2 pr-5 mb-2.5">
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xl md:text-2xl flex-shrink-0 ${isBlue ? 'bg-nook-blue/15' : 'bg-nook-green/15'}`}>
          {user.avatar}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-black text-nook-brown leading-tight truncate">{user.name}</h3>
          <span className="text-[9px] md:text-[10px] font-black text-[#6D46C2]">
            5 折卡 {availableDiscountCardCount} 張
          </span>
        </div>
      </div>

      <div className={`rounded-xl px-3 py-2 mb-2.5 flex items-baseline justify-center gap-1 ${isBlue ? 'bg-nook-blue/10' : 'bg-nook-green/10'}`}>
        <span className={`text-3xl md:text-4xl font-black leading-none ${isBlue ? 'text-nook-blueDark' : 'text-nook-greenDark'}`}>{score}</span>
        <span className="text-nook-brown/45 font-bold text-xs">分</span>
      </div>

      <div className={`grid gap-1.5 ${canManageScoreActions ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {canManageScoreActions && (
          <>
            <Button size="sm" className="col-span-1 px-2" variant={isBlue ? 'secondary' : 'success'} onClick={onAddPoints}>
              ＋ 加分
            </Button>
            <Button size="sm" className="col-span-1 px-2" variant="danger" onClick={onDeductPoints}>
              − 扣分
            </Button>
          </>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRedeem();
          }}
          className={`${canManageScoreActions ? 'col-span-2' : 'col-span-1'} min-h-8 px-3 py-1 rounded-lg font-bold text-white bg-[#9377D8] border-b-[3px] border-[#7556BA] active:border-b-0 active:translate-y-[3px] flex items-center justify-center transition-all hover:brightness-105 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7556BA] focus-visible:ring-offset-2`}
        >
          <Icons.Gift size={14} className="mr-1.5" />
          兌換獎勵
        </button>
      </div>
    </div>
  );
};
