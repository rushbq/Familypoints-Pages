import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  BeyBossAttempt,
  BeyBossState,
  BeyForgeState,
  DiscountCard,
  FamilyGardenState,
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
import { ArenaMark } from './ArenaMark';
import { BeyTop } from './BeyTop';
import { FamilyGarden, getGardenName, STAGE_LABELS } from './FamilyGarden';
import { BeyForge } from './BeyForge';
import { BeyBoss } from './BeyBoss';
import { BeyRulesModal } from './BeyRulesModal';
import { GardenAlbum } from './GardenAlbum';
import {
  getActiveGardenPlant,
  getAvailableGardenWaterings,
  getGardenPointsTowardNextWatering,
  isGardenPlantBloomed,
} from '../services/gardenUtils';
import {
  DEFAULT_SCRAP_PER_DRAW,
  getAvailableBeyDraws,
  getScrapTowardNextDraw,
} from '../services/beyUtils';
import {
  getBossAvailability,
  getBossEntry,
  getBossForWeek,
  getDaysUntilBattle,
  getWeekKey,
} from '../services/beyBossUtils';
import { getBeyBoss } from '../services/beyBossData';
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
  onUpdateRewardItems: (items: RewardItem[]) => void;
  onUpdateGoalRewards: (updater: (items: GoalReward[]) => GoalReward[]) => void;
  onUpdateDiscountCards: (updater: (items: DiscountCard[]) => DiscountCard[]) => void;
  onUpdateRewardCards: (updater: (items: RewardCard[]) => RewardCard[]) => void;
  onUpdateStampCards: (updater: (items: StampCard[]) => StampCard[]) => void;
  onWaterGarden: (childId: string) => void;
  onStartGardenPlant: (speciesId: string) => void;
  onDrawBeyPart: (childId: string) => { partId: string | null; isDuplicate: boolean };
  onAssembleBey: (childId: string, name: string, bladeId: string, ratchetId: string, bitId: string) => void;
  onDisassembleBey: (buildId: string) => void;
  onSetBossLineup: (childId: string, buildId: string | null) => void;
  onChallengeBoss: () => BeyBossAttempt | null;
  cloudEmail: string;
  onCloudLogout: () => void;
}

const BACK_BUTTON_CLASS = 'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-bey-dim transition-colors hover:bg-bey-panel hover:text-bey-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark';

/**
 * garden、album 不在導覽上，是首頁的子頁（首頁 → 花園 → 圖鑑）；
 * 導覽的「首頁」在這三頁時都算作用中。
 */
type Tab = 'overview' | 'bey' | 'log' | 'settings' | 'garden' | 'album';

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  data, 
  onLogout, 
  onAddRecord, 
  onUpdateItems,
  onSendMessage,
  onMarkMessageRead,
  onUpdateRewardItems,
  onUpdateGoalRewards,
  onUpdateDiscountCards,
  onUpdateRewardCards,
  onUpdateStampCards,
  onWaterGarden,
  onStartGardenPlant,
  onDrawBeyPart,
  onAssembleBey,
  onDisassembleBey,
  onSetBossLineup,
  onChallengeBoss,
  cloudEmail,
  onCloudLogout,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isParent = currentUser.role === UserRole.PARENT;
  const isHomeTab = activeTab === 'overview' || activeTab === 'garden' || activeTab === 'album';

  // 切頁時捲回頂端；否則從首頁底部的花園進圖鑑，會停在新頁面的中間
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [activeTab]);

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
  const hasGoalReminders = activeGoalReminders.length > 0 || pendingGoalReminders.length > 0;

  // 隊色輪替。青色是系統主色（作用中、確認、焦點），不拿來當隊色，
  // 否則孩子的識別會和「這是可以按的東西」混在一起。
  const colorThemes: Array<'purple' | 'orange'> = ['purple', 'orange'];

  // --- 狀態：日期篩選器 (預設 7 天) ---
  const [daysFilter, setDaysFilter] = useState(7);

  // --- 狀態：日誌的孩子篩選（'all' 或 childId），只有家長看得到兩個孩子 ---
  const [childFilter, setChildFilter] = useState<string>('all');

  // --- 狀態：控制 ActionLogger (加扣分) 視窗 ---
  const [loggingAction, setIsLoggingAction] = useState<{childId: string, type: 'POSITIVE' | 'NEGATIVE'} | null>(null);

  // --- 狀態：控制 RewardRedeemer (兌換獎勵) 視窗 ---
  const [redeemingReward, setIsRedeemingReward] = useState<{childId: string} | null>(null);

  // --- 狀態：玩法說明；規則很長，放 modal 不佔版面 ---
  const [showBeyRules, setShowBeyRules] = useState(false);

  // --- 狀態：手機版帳號選單（切換角色／雲端帳號）---
  const [showAccountMenu, setShowAccountMenu] = useState(false);

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
            {isParent ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-display text-[10px] font-bold tracking-[0.3em] text-bey-cyan">REFEREE PANEL</p>
                    <h2 className="text-xl md:text-2xl font-black text-bey-ink leading-tight">
                        {new Date().getHours() < 12 ? '早安！' : '你好！'}
                        <span className="text-bey-cyan ml-1">{currentUser.name}</span>
                    </h2>
                    <p className="text-bey-dim font-normal mt-1 text-xs md:text-sm">記錄今天的對戰結果</p>
                </div>
                <div className="bg-bey-panel px-2.5 py-1.5 flex-shrink-0 soft-card clip-notch-sm">
                    <span className="font-display font-bold text-bey-dim text-xs">{new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })}</span>
                </div>
              </div>
            ) : (
              <ChildHomeSummary
                currentUser={currentUser}
                teamColor={colorThemes[Math.max(0, allChildren.findIndex((child) => child.id === currentUser.id)) % colorThemes.length]}
                score={childScores[0]?.score ?? 0}
                rewardItems={data.rewardItems}
                availableDiscountCardCount={getUnusedDiscountCards(data.discountCards, currentUser.id).length}
                onRedeem={() => setIsRedeemingReward({ childId: currentUser.id })}
              />
            )}

            {/* 小孩專屬：目標、卡片、本週進步、積分指南收成一張摘要清單，點開才看明細。
                它們都是「分數怎麼來的」，要排在收集區前面。 */}
            {!isParent && (
              <ChildSummaryList
                currentUser={currentUser}
                records={data.records}
                scoreItems={data.scoreItems}
                goalRewards={activeGoalReminders.filter((goal) => goal.childId === currentUser.id)}
                rewardCards={data.rewardCards}
                stampCards={data.stampCards}
              />
            )}

            {/* 寬螢幕把目標提醒移到右側欄，計分卡才不會被拉成 600px 寬、
                按鈕變成 500px 的長條。 */}
            {isParent && (
              <div className={`grid items-start gap-3 md:gap-4 ${
                hasGoalReminders ? 'xl:grid-cols-[minmax(0,1fr)_21rem]' : ''
              }`}>
              <div className={`grid gap-3 md:gap-4 ${visibleChildren.length === 1 ? 'grid-cols-1 max-w-xl' : 'grid-cols-2'}`}>
                {childScores.map((cs, idx) => (
                  <ScoreCard
                    key={cs.user.id}
                    user={cs.user}
                    score={cs.score}
                    onAddPoints={() => setIsLoggingAction({ childId: cs.user.id, type: 'POSITIVE' })}
                    onDeductPoints={() => setIsLoggingAction({ childId: cs.user.id, type: 'NEGATIVE' })}
                    onRedeem={() => setIsRedeemingReward({ childId: cs.user.id })}
                    canManageScoreActions
                    colorTheme={colorThemes[idx % colorThemes.length]}
                    availableDiscountCardCount={getUnusedDiscountCards(data.discountCards, cs.user.id).length}
                  />
                ))}
              </div>

              <ParentGoalReminderSection
                goals={activeGoalReminders}
                pendingGoals={pendingGoalReminders}
                users={data.users}
                discountCards={data.discountCards}
              />
              </div>
            )}

            {/* 家長專屬：獎勵卡與集點卡。放在收集區前面，家長的東西才連在一起。 */}
            {isParent && (
              <div className={`grid gap-3 md:gap-4 ${visibleChildren.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
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

            {/* 收集區：只放入口卡，內容在各自的頁面；有事可做的那張才亮 */}
            <CollectionTiles
              currentUser={currentUser}
              users={data.users}
              forge={data.beyForge}
              boss={data.beyBoss}
              garden={data.familyGarden}
              onOpenBey={() => setActiveTab('bey')}
              onOpenGarden={() => setActiveTab('garden')}
            />

             {/* 最近紀錄已移至「日誌」頁，首頁不再重複顯示 */}
          </div>
        );
      case 'bey':
        return (
          <div className="space-y-3 animate-pop">
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.3em] text-bey-cyan">BEY WORKSHOP</p>
              <h2 className="text-xl font-black leading-tight text-bey-ink md:text-2xl">陀螺工房</h2>
            </div>
            {/* 魔王戰的前提就是有陀螺，和工房放在同一頁，
                「打輸 → 看哪一項輸 → 下面就是鍛造台」在同一個畫面裡走得完 */}
            <BeyBoss
              currentUser={currentUser}
              users={data.users}
              forge={data.beyForge}
              boss={data.beyBoss}
              onSetLineup={onSetBossLineup}
              onChallenge={onChallengeBoss}
              onShowRules={() => setShowBeyRules(true)}
            />
            <BeyForge
              currentUser={currentUser}
              users={data.users}
              forge={data.beyForge}
              onDrawPart={onDrawBeyPart}
              onAssemble={onAssembleBey}
              onDisassemble={onDisassembleBey}
              onShowRules={() => setShowBeyRules(true)}
            />
          </div>
        );
      case 'garden':
        return (
          <div className="space-y-3 animate-pop">
            <button type="button" onClick={() => setActiveTab('overview')} className={BACK_BUTTON_CLASS}>
              <Icons.ArrowLeft size={18} />
              返回首頁
            </button>
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.3em] text-bey-cyan">GARDEN</p>
              <h2 className="text-xl font-black leading-tight text-bey-ink md:text-2xl">家庭花園</h2>
            </div>
            <FamilyGarden
              currentUser={currentUser}
              users={data.users}
              garden={data.familyGarden}
              onWaterGarden={onWaterGarden}
              onOpenAlbum={() => setActiveTab('album')}
            />
          </div>
        );
      case 'album':
        return (
          <div className="space-y-3 animate-pop">
            <button
              type="button"
              onClick={() => setActiveTab('garden')}
              className={BACK_BUTTON_CLASS}
            >
              <Icons.ArrowLeft size={18} />
              返回花園
            </button>
            <GardenAlbum
              garden={data.familyGarden}
              canStartNextPlant={isGardenPlantBloomed(getActiveGardenPlant(data.familyGarden), data.familyGarden)}
              onStartPlant={(speciesId) => {
                onStartGardenPlant(speciesId);
                setActiveTab('garden');
              }}
            />
          </div>
        );
      case 'log': {
        // 日誌篩選邏輯
        const cutoffTime = Date.now() - (daysFilter * 24 * 60 * 60 * 1000);
        let filteredRecords = data.records.filter(r => r.timestamp >= cutoffTime);
        
        // 小孩只能看到自己的紀錄
        if (!isParent) {
          filteredRecords = filteredRecords.filter(r => r.childId === currentUser.id);
        } else if (childFilter !== 'all') {
          filteredRecords = filteredRecords.filter(r => r.childId === childFilter);
        }

        return (
           <Card variant="paper" className="min-h-[320px]">
             <div className="mb-2.5 border-b border-bey-steel pb-2.5">
                <div className="flex items-center gap-2">
                  <Icons.BookOpen className="text-bey-cyan" size={18} />
                  <div>
                    <h2 className="text-base font-black text-bey-ink md:text-lg">戰績日誌</h2>
                    <p className="text-xs font-normal text-bey-dim">依日期分組，每天一段</p>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {/* 孩子篩選：家長才看得到兩個孩子，需要分開看 */}
                  {isParent && allChildren.length > 1 && (
                    <div className="flex gap-1" role="group" aria-label="篩選孩子">
                      {[{ id: 'all', name: '全部' }, ...allChildren].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setChildFilter(option.id)}
                          aria-pressed={childFilter === option.id}
                          className={`min-h-11 rounded-full border px-3 text-xs font-bold transition-colors ${
                            childFilter === option.id
                              ? 'border-bey-cyan bg-bey-cyan text-bey-void'
                              : 'border-bey-steel bg-bey-paper text-bey-dim hover:text-bey-ink'
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 顯示範圍選擇器 */}
                  <div className="relative ml-auto">
                     <select
                       value={daysFilter}
                       onChange={(e) => setDaysFilter(Number(e.target.value))}
                       aria-label="顯示範圍"
                       className="h-11 appearance-none rounded-xl border border-bey-steel bg-bey-paper pl-3 pr-8 text-xs font-bold text-bey-ink outline-none focus:border-bey-cyan [color-scheme:dark]"
                     >
                       <option value={7}>最近 7 天</option>
                       <option value={14}>最近 14 天</option>
                       <option value={30}>最近 30 天</option>
                       <option value={9999}>全部紀錄</option>
                     </select>
                     <Icons.ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bey-dim" />
                  </div>
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
            onUpdateRewardItems={onUpdateRewardItems}
            onUpdateGoalRewards={onUpdateGoalRewards}
            onUpdateDiscountCards={onUpdateDiscountCards}
            onUpdateRewardCards={onUpdateRewardCards}
            onUpdateStampCards={onUpdateStampCards}
            resolver={currentUser}
          />
        ) : <div className="p-12 md:p-20 text-center font-normal text-bey-dim text-lg md:text-xl">🚧 維修區，Blader 勿進！ 🚧</div>;
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
                usedAt: record.timestamp,
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

    // 時間在外面先取好：updater 等雲端確認時可能被重套，每次都要得到同一個結果
    const redeemedAt = Date.now();
    onUpdateRewardCards((items) =>
      items.map((item) =>
        item.id === card.id
          ? {
              ...item,
              status: RewardCardStatus.REDEEMED,
              redeemedAt,
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
      <aside className="relative z-20 hidden w-20 flex-shrink-0 flex-col border-r border-bey-steel bg-bey-panel lg:flex">

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="flex justify-center p-4"
          aria-label="回到首頁"
          title="BEY ARENA・回到首頁"
        >
           <ArenaMark size={36} />
           <span className="sr-only">BEY ARENA，回到首頁</span>
        </button>
        
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2 no-scrollbar" aria-label="主要導覽">
          <NavItem
            active={isHomeTab}
            onClick={() => setActiveTab('overview')}
            icon={<Icons.Home size={20} />}
            label="首頁"
            bgColor="bg-bey-cyan"
          />
          <NavItem
            active={activeTab === 'bey'}
            onClick={() => setActiveTab('bey')}
            icon={<Icons.Disc3 size={20} />}
            label="陀螺"
            bgColor="bg-bey-cyan"
          />
          <NavItem
            active={activeTab === 'log'} 
            onClick={() => setActiveTab('log')} 
            icon={<Icons.ClipboardList size={20} />}
            label="日誌" 
            bgColor="bg-bey-blue"
          />
          {isParent && (
            <NavItem 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
              icon={<Icons.Settings size={20} />}
              label="設定" 
              bgColor="bg-bey-yellow"
            />
          )}
        </nav>

        <div className="mt-auto border-t border-bey-steel p-2">
          <div className="flex justify-center py-2" title={`${currentUser.name}・${cloudEmail}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-bey-ink/10 bg-bey-paper text-lg">
              {currentUser.avatar}
            </div>
            <span className="sr-only">{currentUser.name}，{cloudEmail}</span>
          </div>
          {/* 側欄只有 80px 寬，兩欄會把每顆鈕擠成 30px；直向排各自佔滿 */}
          <div className="grid grid-cols-1 gap-1">
            {/* 雲端帳號僅家長可見，避免小孩誤按登出 */}
            {isParent && (
              <button
                type="button"
                onClick={onCloudLogout}
                className="flex min-h-11 items-center justify-center rounded-xl text-bey-dim transition-colors hover:bg-bey-paper hover:text-bey-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
                aria-label="切換雲端帳號"
                title="切換雲端帳號"
              >
                <Icons.LogOut size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-11 items-center justify-center rounded-xl text-bey-dim transition-colors hover:bg-bey-paper hover:text-bey-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyanDark"
              aria-label="切換家庭角色"
              title="切換家庭角色"
            >
              <Icons.User size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== 主要內容區域 ===== */}
      <main ref={mainRef} className="flex-1 overflow-y-auto relative no-scrollbar">
        {/* 手機版頂部導覽 */}
        <header className="sticky top-0 bg-bey-deep/95 backdrop-blur z-30 px-4 py-2 flex justify-between items-center lg:hidden border-b border-bey-steel">
            <div className="flex items-center gap-2">
              <ArenaMark size={30} />
              <div>
                <h1 className="font-display text-base font-black italic text-bey-ink leading-none">BEY ARENA</h1>
                <span className="font-display text-[10px] font-bold tracking-[0.22em] text-bey-cyan">FAMILY LEAGUE</span>
              </div>
            </div>
            {/* 帳號選單：切換角色是「動作」，不該和首頁／日誌並排在底部頁簽裡 */}
            <button
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              aria-expanded={showAccountMenu}
              aria-label={`${currentUser.name}・帳號選單`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-bey-steel bg-bey-paper text-base transition-colors hover:border-bey-cyan/40"
            >
              <span aria-hidden="true">{currentUser.avatar}</span>
            </button>
        </header>

        {/* 手機版帳號下拉面板 */}
        {showAccountMenu && (
          <div className="lg:hidden bg-bey-panel border-b border-bey-steel px-4 py-3 animate-pop z-20 relative space-y-3">
            <button
              type="button"
              onClick={() => { setShowAccountMenu(false); onLogout(); }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bey-paper px-3 text-sm font-bold text-bey-ink transition-colors hover:bg-bey-deep"
            >
              <Icons.User size={16} />
              切換家庭角色
            </button>

            {/* 雲端帳號僅家長可見，避免小孩誤按登出 */}
            {isParent && (
              <div className="border-t border-bey-steel pt-3">
                <p className="text-xs font-normal text-bey-dim">☁️ 雲端帳號</p>
                <p className="text-sm font-bold text-bey-ink break-all mb-2">{cloudEmail}</p>
                <button
                  type="button"
                  onClick={onCloudLogout}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bey-red/10 px-3 text-sm font-bold text-bey-red transition-colors hover:bg-bey-red/20"
                >
                  <Icons.LogOut size={16} />
                  登出雲端帳號
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative mx-auto max-w-6xl p-3.5 pb-24 md:p-6 md:pb-24 lg:p-6 lg:pb-6 xl:p-8">
          <div className="relative z-10">{renderContent()}</div>
        </div>
      </main>

      {/* ===== 手機版底部導覽列 ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-bey-deep/95 backdrop-blur border-t border-bey-steel shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        <div className="flex items-stretch justify-around px-2 py-1 safe-bottom">
          <MobileNavItem
            active={isHomeTab}
            onClick={() => setActiveTab('overview')}
            icon={<Icons.Home size={22} />}
            label="首頁"
          />
          <MobileNavItem
            active={activeTab === 'bey'}
            onClick={() => setActiveTab('bey')}
            icon={<Icons.Disc3 size={22} />}
            label="陀螺"
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
        </div>
      </nav>

      <BeyRulesModal isOpen={showBeyRules} onClose={() => setShowBeyRules(false)} />

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
// 實心色塊只給作用中的那一顆：顏色在這個系統裡代表「現在在這裡」，
// 三顆都上色的話 active 就只剩一圈看不見的 ring。
const NavItem = ({ active, onClick, icon, label, bgColor, badge = 0 }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, bgColor: string, badge?: number }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`group relative flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors duration-200 ${
      active ? 'bg-bey-paper' : 'hover:bg-bey-panel'
    }`}
  >
    <div
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
        active
          ? `${bgColor} text-bey-void`
          : 'bg-bey-paper/60 text-bey-dim group-hover:bg-bey-paper group-hover:text-bey-ink'
      }`}
    >
      {icon}
    </div>
    {/* 橫式 iPad 用的就是這條側欄，只有圖示的話孩子找不到陀螺在哪 */}
    <span className={`text-xs font-bold ${active ? 'text-bey-ink' : 'text-bey-dim group-hover:text-bey-ink'}`}>{label}</span>

    {badge > 0 && (
        <div className="absolute right-2 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bey-deep bg-bey-red text-xs font-bold text-bey-void">
            {badge}
        </div>
    )}
  </button>
);

// --- 首頁收集區：陀螺工房／花園的入口卡 ---
// 只顯示一兩行狀態，內容在各自的頁面。有事可做（可鍛造、魔王可開戰、可澆水、
// 開花可選新種子）的那張才用 cyan 邊框加小點；顏色在這裡代表「這裡有事」。
const CollectionTile = ({ onClick, icon, title, lines, alert }: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  lines: React.ReactNode[];
  alert: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex min-h-11 w-full flex-col gap-1 rounded-2xl border bg-bey-paper p-3 text-left transition-colors hover:bg-bey-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyan ${
      alert ? 'border-bey-cyan' : 'border-bey-steel'
    }`}
  >
    {alert && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-bey-cyan" aria-hidden="true" />}
    <span className="flex items-center gap-2 pr-4">
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate text-sm font-bold text-bey-ink">{title}</span>
    </span>
    {lines.map((line, index) => (
      <span key={index} className="truncate text-xs font-normal text-bey-dim">{line}</span>
    ))}
    {alert && <span className="sr-only">（有事可以做）</span>}
  </button>
);

const CollectionTiles = ({ currentUser, users, forge, boss, garden, onOpenBey, onOpenGarden }: {
  currentUser: User;
  users: User[];
  forge: BeyForgeState;
  boss: BeyBossState;
  garden: FamilyGardenState;
  onOpenBey: () => void;
  onOpenGarden: () => void;
}) => {
  const isChild = currentUser.role === UserRole.CHILD;
  const childId = currentUser.id;

  // 花園：兩邊都看得到生長階段；可澆水只對孩子有意義，澆水是孩子的事
  const plant = getActiveGardenPlant(garden);
  const bloomed = isGardenPlantBloomed(plant, garden);
  const stage = Math.min(plant?.waterings.length ?? 0, garden.wateringsToBloom);
  const waterings = isChild ? getAvailableGardenWaterings(garden, childId) : 0;
  const stageLine = bloomed ? '開花了！' : `${STAGE_LABELS[stage]} ${stage}/${garden.wateringsToBloom}`;
  const gardenTile = (
    <CollectionTile
      onClick={onOpenGarden}
      icon={<Icons.Leaf size={18} className="text-bey-cyan" />}
      title={getGardenName(users.filter((user) => user.role === UserRole.CHILD))}
      alert={isChild && (waterings > 0 || bloomed)}
      lines={isChild
        ? [
            bloomed
              ? <span className="font-bold text-bey-cyan">可以選下一顆種子</span>
              : waterings > 0
                ? <span className="font-bold text-bey-cyan">可以澆水 {waterings} 次</span>
                : `陽光 ${getGardenPointsTowardNextWatering(garden, childId)}/${garden.pointsPerWatering}`,
            stageLine,
          ]
        : [stageLine]}
    />
  );

  if (!isChild) {
    // 家長的陀螺工房從導覽進；首頁只留花園入口
    return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{gardenTile}</div>;
  }

  const scrapPerDraw = forge.scrapPerDraw || DEFAULT_SCRAP_PER_DRAW;
  const draws = getAvailableBeyDraws(forge, childId);
  const weekKey = getWeekKey();
  const entry = getBossEntry(boss, weekKey);
  const bossDef = (entry ? getBeyBoss(entry.bossId) : null) ?? getBossForWeek(weekKey);
  const availability = getBossAvailability(entry, forge, new Date());
  const daysUntil = getDaysUntilBattle();
  const bossLine = (() => {
    switch (availability) {
      case 'DEFEATED': return '魔王已擊敗 ✓';
      case 'NOT_BATTLE_DAY': return `魔王 ${daysUntil} 天後開戰`;
      case 'NO_LINEUP': return '魔王：先派出陀螺';
      case 'ALREADY_TODAY': return '魔王：明天再來';
      case 'READY': return <span className="font-bold text-bey-cyan">魔王今天可開戰</span>;
      default: return '';
    }
  })();

  return (
    <div className="grid grid-cols-2 gap-3">
      <CollectionTile
        onClick={onOpenBey}
        icon={<Icons.Disc3 size={18} className="text-bey-cyan" />}
        title="陀螺工房"
        alert={draws > 0 || availability === 'READY'}
        lines={[
          draws > 0
            ? <span className="font-bold text-bey-cyan">可鍛造 {draws} 次</span>
            : `鋼料 ${getScrapTowardNextDraw(forge, childId)}/${scrapPerDraw}`,
          <span className="inline-flex items-center gap-1">
            <BeyTop variant="boss" colorSet={bossDef.color} size={14} speed="idle" className="flex-shrink-0" />
            {bossLine}
          </span>,
        ]}
      />
      {gardenTile}
    </div>
  );
};

// --- 手機版底部導覽按鈕元件 ---
const MobileNavItem = ({ active, onClick, icon, label, isDanger = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDanger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex min-h-12 flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors min-w-[60px] ${
      active 
        ? 'text-bey-cyan bg-bey-cyan/15'
        : isDanger
          ? 'text-bey-dim hover:text-bey-red'
          : 'text-bey-dim hover:text-bey-ink'
    }`}
  >
    {icon}
    <span className={`mt-0.5 text-xs font-bold ${active ? 'text-bey-cyan' : ''}`}>{label}</span>
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

const ChildHomeSummary = ({
  currentUser,
  score,
  rewardItems,
  availableDiscountCardCount,
  teamColor,
  onRedeem,
}: {
  currentUser: User;
  score: number;
  rewardItems: RewardItem[];
  availableDiscountCardCount: number;
  teamColor: 'purple' | 'orange';
  onRedeem: () => void;
}) => {
  // 孩子的首頁用自己的隊色，和計分卡、工房、角色選擇一致。
  const isHome = teamColor === 'purple';
  const accentText = isHome ? 'text-bey-purple' : 'text-bey-orange';
  const accentGlow = isHome ? 'glow-purple' : 'glow-orange';
  const accentFill = isHome ? 'bg-bey-purple' : 'bg-bey-orange';
  const nextReward = rewardItems
    .filter((reward) => reward.points > score)
    .sort((a, b) => a.points - b.points)[0];
  const affordableRewardCount = rewardItems.filter((reward) => reward.points <= score).length;
  const rewardProgress = nextReward ? Math.min(100, (score / nextReward.points) * 100) : 100;
  const nextRewardLabel = nextReward?.label.replace(/\s*[（(]\d+\s*分[）)]\s*$/, '') ?? '';

  return (
    <section aria-label={`${currentUser.name}的今日積分`} className="relative overflow-hidden bg-bey-panel soft-card clip-notch">
      {/* 競技場刻線與速度線，營造場地感 */}
      <div className="pointer-events-none absolute inset-0 arena-rings opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 speed-lines opacity-40" aria-hidden="true" />

      {/* 身分條：名字是說明，不是主角，所以壓在分數上面當標頭 */}
      <div className="relative flex items-center gap-2.5 px-4 pb-1 pt-3.5 md:px-5">
        <div className="flex-shrink-0" aria-hidden="true">
          <BeyTop color={teamColor} size={40} speed="idle" />
        </div>
        <div className="min-w-0 flex-shrink-0">
          <p className={`font-display text-[10px] font-bold tracking-[0.3em] ${accentText}`}>BLADER STATUS</p>
          <h2 className="truncate text-base font-bold leading-tight text-bey-ink">{currentUser.name}</h2>
        </div>
        {/* 鼓勵語放在身分列右側的空白處，不再獨佔分數下面一整列 */}
        <p className="ml-auto min-w-0 text-right text-xs font-normal leading-snug text-bey-dim">{getEncouragement(score)}</p>
      </div>

      {/* 積分：整個畫面最大的東西就該是它，這是一個積分 App */}
      <div className="relative px-4 pb-3 pt-1 text-center md:px-5">
        <div className="flex items-baseline justify-center gap-2">
          <span className={`text-6xl font-bold italic leading-none tabular-nums md:text-7xl ${accentText} ${accentGlow}`}>
            {score}
          </span>
          <span className="font-display text-xs font-bold tracking-widest text-bey-dim">PTS</span>
        </div>
      </div>

      {/* 下一個獎勵的進度 */}
      <div className="relative border-t border-bey-steel px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3 text-xs font-bold">
          <span className="truncate text-bey-ink">
            {nextReward
              ? `下一個：${nextReward.icon || '🎁'} ${nextRewardLabel}`
              : affordableRewardCount > 0
                ? `已有 ${affordableRewardCount} 個獎勵可以兌換`
                : '繼續累積，就能兌換第一個獎勵'}
          </span>
          {nextReward && (
            <span className="flex-shrink-0 tabular-nums text-bey-dim">
              {score} / {nextReward.points}
            </span>
          )}
        </div>
        {/* 軌道做厚一點、邊框留著：0 分時整條進度條不能消失不見 */}
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full border border-bey-steel bg-bey-void"
          role="progressbar"
          aria-label="下一個獎勵的積分進度"
          aria-valuemin={0}
          aria-valuemax={nextReward?.points ?? Math.max(score, 1)}
          aria-valuenow={Math.min(score, nextReward?.points ?? score)}
        >
          <div className={`h-full rounded-full ${accentFill}`} style={{ width: `${rewardProgress}%` }} />
        </div>
        {nextReward && (
          <p className="mt-1.5 text-xs font-normal text-bey-dim">
            還差 <span className="font-bold text-bey-ink">{nextReward.points - score}</span> 分
          </p>
        )}
      </div>

      <div className="relative flex items-center justify-between gap-2 border-t border-bey-steel px-4 py-2.5 md:px-5">
        <span className={`text-xs font-bold ${availableDiscountCardCount > 0 ? 'text-bey-ink' : 'text-bey-dim'}`}>
          🎟️ 5 折卡 {availableDiscountCardCount} 張
        </span>
        <Button size="sm" variant="reward" onClick={onRedeem} icon={<Icons.Gift size={15} />}>
          兌換獎勵
        </Button>
      </div>
    </section>
  );
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
            ? 'bg-bey-red/10'
            : 'bg-bey-deep/45'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-bey-paper text-bey-dim">
            {child?.name ?? '未指定孩子'}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            tone === 'pending' ? 'bg-bey-red/15 text-bey-red' : 'bg-bey-cyan/15 text-bey-cyan'
          }`}>
            {tone === 'pending' ? '待判定' : '進行中'}
          </span>
          {hasIssuedCard && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-bey-lime/20 text-bey-lime">
              已發卡
            </span>
          )}
        </div>
        <p className="font-bold text-sm text-bey-ink leading-snug">{goal.targetText}</p>
        <p className="text-xs font-normal text-bey-dim mt-1">{formatGoalDateRange(goal)}</p>
      </div>
    );
  };

  return (
    <Card className="bg-bey-paper">
      <div className="flex items-center mb-3 gap-2">
        <div className="w-8 h-8 bg-bey-yellow/15 rounded-lg text-bey-yellow flex items-center justify-center"><Icons.Calendar size={17} /></div>
        <h3 className="text-base font-black text-bey-ink">目標提醒</h3>
        <div className="ml-auto flex gap-1.5 text-xs font-bold">
          {pendingGoals.length > 0 && <span className="px-2 py-1 rounded-full bg-bey-red/10 text-bey-red">待判定 {pendingGoals.length}</span>}
          {goals.length > 0 && <span className="px-2 py-1 rounded-full bg-bey-cyan/10 text-bey-cyan">進行中 {goals.length}</span>}
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

// --- 小孩首頁的摘要清單：目標／收藏／本週／積分指南 ---
// 每列只顯示一行摘要，點開才在原地展開明細，一次只開一列，首頁才能一眼看完。
type SummaryKey = 'goals' | 'cards' | 'week' | 'guide';

const SummaryRow = ({ id, open, onToggle, icon, label, summary, children }: {
  id: SummaryKey;
  open: boolean;
  onToggle: (id: SummaryKey) => void;
  icon: string;
  label: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border-b border-bey-steel last:border-b-0">
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-expanded={open}
      aria-controls={`summary-${id}`}
      className="flex min-h-12 w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-bey-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bey-cyan md:px-4"
    >
      <span className="flex-shrink-0 text-base" aria-hidden="true">{icon}</span>
      <span className="w-14 flex-shrink-0 text-sm font-bold text-bey-ink">{label}</span>
      <span className="min-w-0 flex-1 truncate text-xs font-normal text-bey-dim">{summary}</span>
      <Icons.ChevronRight size={18} className={`flex-shrink-0 text-bey-dim transition-transform ${open ? 'rotate-90' : ''}`} />
    </button>
    {open && (
      <div id={`summary-${id}`} className="px-3.5 pb-3.5 animate-pop md:px-4">
        {children}
      </div>
    )}
  </div>
);

const ChildSummaryList = ({ currentUser, records, scoreItems, goalRewards, rewardCards, stampCards }: {
  currentUser: User;
  records: ScoreRecord[];
  scoreItems: ScoreItem[];
  goalRewards: GoalReward[];
  rewardCards: RewardCard[];
  stampCards: StampCard[];
}) => {
  const [openKey, setOpenKey] = useState<SummaryKey | null>(null);
  const toggle = (key: SummaryKey) => setOpenKey((current) => (current === key ? null : key));
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

  const positiveItemsByCategory = groupScoreItemsByCategory(scoreItems, ScoreType.POSITIVE);
  const negativeItemsByCategory = groupScoreItemsByCategory(scoreItems, ScoreType.NEGATIVE);
  const activeRewardCards = getActiveRewardCards(rewardCards, currentUser.id);
  const activeStampCards = getActiveStampCards(stampCards, currentUser.id);
  const hasFamilyCards = activeRewardCards.length > 0 || activeStampCards.length > 0;

  const firstGoal = goalRewards[0];
  const goalSummary = firstGoal
    ? `${firstGoal.targetText}・到 ${firstGoal.endDate.slice(5).replace('-', '/')}${goalRewards.length > 1 ? `（另 ${goalRewards.length - 1} 個）` : ''}`
    : '';

  const cardsSummary = [
    activeRewardCards.length > 0 ? `獎勵卡 ${activeRewardCards.length} 張` : '',
    activeStampCards.length === 1
      ? `集點卡 ${Math.min(activeStampCards[0].stamps, activeStampCards[0].targetStamps)}/${activeStampCards[0].targetStamps}`
      : activeStampCards.length > 1 ? `集點卡 ${activeStampCards.length} 張` : '',
  ].filter(Boolean).join('・');

  return (
    <section aria-label="我的摘要" className="overflow-hidden rounded-2xl border border-bey-steel bg-bey-paper">
      {firstGoal && (
        <SummaryRow id="goals" open={openKey === 'goals'} onToggle={toggle} icon="🎯" label="目標" summary={goalSummary}>
          <div className="space-y-2">
            {goalRewards.map((goal) => (
              <div key={goal.id} className="rounded-xl bg-bey-void/40 p-3">
                <p className="text-sm font-bold leading-snug text-bey-ink">{goal.targetText}</p>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs font-normal text-bey-dim">{formatGoalDateRange(goal)}</p>
                  <p className="text-xs font-bold text-bey-yellow">達成可獲得 5 折卡</p>
                </div>
              </div>
            ))}
          </div>
        </SummaryRow>
      )}

      {hasFamilyCards && (
        <SummaryRow id="cards" open={openKey === 'cards'} onToggle={toggle} icon="🎁" label="收藏" summary={cardsSummary}>
          <FamilyCardsSection
            childId={currentUser.id}
            rewardCards={rewardCards}
            stampCards={stampCards}
            isParent={false}
            bare
          />
        </SummaryRow>
      )}

      <SummaryRow
        id="week"
        open={openKey === 'week'}
        onToggle={toggle}
        icon="📈"
        label="本週"
        summary={
          <>
            淨得分 <span className={`font-bold ${weekNet >= 0 ? 'text-bey-lime' : 'text-bey-red'}`}>{weekNet >= 0 ? '+' : ''}{weekNet}</span>
            （加 {weekPositive.length}・扣 {weekNegative.length}）
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-bey-lime/10 p-2 text-center">
            <div className="text-xl font-black text-bey-lime">{weekPositive.length}</div>
            <div className="text-xs font-normal text-bey-dim">加分</div>
          </div>
          <div className="rounded-xl bg-bey-red/10 p-2 text-center">
            <div className="text-xl font-black text-bey-red">{weekNegative.length}</div>
            <div className="text-xs font-normal text-bey-dim">扣分</div>
          </div>
          <div className={`${weekNet >= 0 ? 'bg-bey-lime/10' : 'bg-bey-red/10'} rounded-xl p-2 text-center`}>
            <div className={`text-xl font-black ${weekNet >= 0 ? 'text-bey-lime' : 'text-bey-red'}`}>
              {weekNet >= 0 ? '+' : ''}{weekNet}
            </div>
            <div className="text-xs font-normal text-bey-dim">淨得分</div>
          </div>
        </div>
      </SummaryRow>

      <SummaryRow id="guide" open={openKey === 'guide'} onToggle={toggle} icon="📖" label="指南" summary="怎麼加分、哪些會扣分">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <ScoreGuidePanel title="可以怎麼加分" itemsByCategory={positiveItemsByCategory} type={ScoreType.POSITIVE} />
          <ScoreGuidePanel title="哪些行為會扣分" itemsByCategory={negativeItemsByCategory} type={ScoreType.NEGATIVE} />
        </div>
      </SummaryRow>
    </section>
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
  bare = false,
}: {
  childId: string;
  childName?: string;
  rewardCards: RewardCard[];
  stampCards: StampCard[];
  isParent: boolean;
  onRedeemRewardCard?: (card: RewardCard) => void;
  /** 只要內容，不要外框與標題；放進孩子首頁摘要清單展開區時用，免得卡片裡又套一張卡片。 */
  bare?: boolean;
}) => {
  const activeRewardCards = getActiveRewardCards(rewardCards, childId);
  const activeStampCards = getActiveStampCards(stampCards, childId);

  if (activeRewardCards.length === 0 && activeStampCards.length === 0) {
    return null;
  }

  const body = (
    <>
      {activeRewardCards.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-bold text-bey-yellow">獎勵卡</p>
          <div className="space-y-1.5">
            {activeRewardCards.map((card) => (
              <div key={card.id} className="bg-bey-void/40 border border-bey-steel rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-bey-paper flex items-center justify-center text-lg flex-shrink-0">
                    {card.rewardIcon || '🎁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-normal text-bey-dim">{card.title}</p>
                    <p className="truncate whitespace-nowrap text-xs font-bold leading-tight text-bey-ink" title={card.rewardLabel}>{card.rewardLabel}</p>
                  </div>
                </div>
                {isParent ? (
                    <button
                      type="button"
                      className="mt-2 min-h-11 w-full rounded-lg bg-bey-yellow px-2 text-xs font-bold text-bey-void hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bey-yellow"
                      onClick={() => onRedeemRewardCard?.(card)}
                    >
                      兌換這份獎勵
                    </button>
                  ) : (
                    <span className="mt-2 flex items-center justify-center gap-1 text-xs font-normal text-bey-dim">
                      <Icons.Lock size={12} aria-hidden="true" />
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
          <p className="mb-2 text-xs font-bold text-bey-yellow">集點卡</p>
          <div className="space-y-1.5">
            {activeStampCards.map((card) => (
              <StampCardRow key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (bare) return <div>{body}</div>;

  return (
    <Card className="bg-bey-paper">
      <div className="flex items-center mb-3 gap-2">
        <div className="w-7 h-7 bg-bey-yellow/20 rounded-lg text-bey-yellow flex items-center justify-center"><Icons.Gift size={15} /></div>
        <h3 className="text-sm md:text-base font-bold text-bey-ink truncate">{childName ? `${childName}的收藏` : '我的卡片'}</h3>
      </div>
      {body}
    </Card>
  );
};

// --- 集點卡進度列 (展示用) ---
const StampCardRow = ({ card }: { card: StampCard }) => {
  const complete = isStampCardComplete(card);
  const filled = Math.min(card.stamps, card.targetStamps);

  return (
    <div className={`rounded-xl p-2.5 ${complete ? 'bg-bey-yellow/20' : 'bg-bey-deep/35'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-bey-ink leading-tight break-words">{card.title}</p>
          <p className="truncate text-xs font-normal text-bey-dim">{card.rewardIcon || '🎁'} {card.rewardLabel}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${complete ? 'bg-bey-yellow text-bey-void' : 'bg-bey-paper text-bey-dim'}`}>
          {filled}/{card.targetStamps}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bey-paper overflow-hidden" aria-label={`已集 ${filled} 點，共 ${card.targetStamps} 點`}>
        <div className="h-full rounded-full bg-bey-yellow" style={{ width: `${Math.min((filled / card.targetStamps) * 100, 100)}%` }} />
      </div>
      {complete && (
        <p className="mt-2 text-xs font-bold text-bey-yellow">集滿了，可以兌換禮物！</p>
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
  <div className="rounded-xl bg-bey-deep/35 p-3">
    <h4 className="font-black text-bey-ink text-sm mb-2.5">{title}</h4>
    <div className="space-y-3">
      {SCORE_CATEGORY_OPTIONS.map((option) => {
        const items = itemsByCategory.get(option.value) ?? [];
        if (!items.length) return null;

        return (
          <div key={option.value} className="space-y-1.5">
            <div className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${getScoreCategoryChipClassName(option.value)}`}>
              {option.label}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 bg-bey-paper rounded-lg px-2.5 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-bey-deep/50 flex items-center justify-center text-sm flex-shrink-0">
                      {item.icon || (type === ScoreType.POSITIVE ? '⭐' : '⚠️')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-bey-ink break-words">{item.label}</p>
                    </div>
                  </div>
                  <div className={`rounded-full px-2 py-0.5 text-xs font-bold ${type === ScoreType.POSITIVE ? 'bg-bey-cyan/20 text-bey-cyan' : 'bg-bey-red/20 text-bey-red'}`}>
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
  colorTheme: 'purple' | 'orange',
  availableDiscountCardCount: number,
}) => {
  // 隊色紫 / 隊色橘：兩個孩子在首頁就是對戰的兩側。
  const isHome = colorTheme === 'purple';
  const accentText = isHome ? 'text-bey-purple' : 'text-bey-orange';
  const accentBorder = isHome ? 'border-t-bey-purple' : 'border-t-bey-orange';
  const accentGlow = isHome ? 'glow-purple' : 'glow-orange';

  return (
    <div className={`relative overflow-hidden bg-bey-panel soft-card clip-notch border-t-[3px] ${accentBorder} p-3 md:p-4`}>
      <div
        className="pointer-events-none absolute inset-0 arena-rings opacity-60"
        style={{ '--rings-x': '80%', '--rings-y': '20%' } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-2.5 mb-2.5">
        <div className="flex-shrink-0" aria-hidden="true">
          <BeyTop color={colorTheme} size={44} speed="idle" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-bold text-bey-ink leading-tight truncate">
            <span aria-hidden="true">{user.avatar}</span> {user.name}
          </h3>
          <span className={`text-xs font-bold ${availableDiscountCardCount > 0 ? 'text-bey-ink' : 'text-bey-dim'}`}>
            🎟️ 5 折卡 {availableDiscountCardCount} 張
          </span>
        </div>
      </div>

      <div className={`relative clip-notch-sm px-3 py-2 mb-2.5 flex items-baseline justify-center gap-1.5 bg-bey-void/50 border border-bey-steel`}>
        <span className={`text-3xl md:text-4xl font-bold italic leading-none tabular-nums ${accentText} ${accentGlow}`}>{score}</span>
        <span className="font-display text-[10px] font-bold tracking-widest text-bey-dim">PTS</span>
      </div>

      {/* 日常操作九成是加分，所以加分獨佔一列當主角；
          扣分降成外框紅字，少用、也不該和加分一樣大聲。 */}
      {/* 兩張卡並排時每張只有約 155px，三顆鈕擠一排會把文字折成三行，
          所以手機直接直向堆疊，md 以上才排成兩欄。 */}
      <div className="relative grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {canManageScoreActions && (
          <Button variant="success" className="md:col-span-2" onClick={onAddPoints}>
            ＋ 加分
          </Button>
        )}
        {canManageScoreActions && (
          <Button
            size="sm"
            variant="outline"
            className="px-2 text-bey-red hover:border-bey-red/50 hover:text-bey-red"
            onClick={onDeductPoints}
          >
            − 扣分
          </Button>
        )}
        <Button
          size="sm"
          variant="reward"
          className={`px-3 text-xs ${canManageScoreActions ? '' : 'md:col-span-2'}`}
          onClick={onRedeem}
          icon={<Icons.Gift size={14} />}
        >
          兌換獎勵
        </Button>
      </div>
    </div>
  );
};
