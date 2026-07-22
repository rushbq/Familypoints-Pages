import React, { useState, useRef, useEffect } from 'react';
import {
  AppState,
  DiscountCard,
  GoalReward,
  GoalRewardStatus,
  RewardCard,
  RewardCardStatus,
  RewardItem,
  ScoreCategory,
  ScoreItem,
  ScoreType,
  StampCard,
  StampCardStatus,
  User,
  UserRole,
} from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { getStorageInfo, cleanupOldRecords } from '../services/storageService';
import {
  formatGoalDateRange,
  getGoalDisplayGroup,
  getGoalRewardStatusLabel,
  getScoreCategoryChipClassName,
  getScoreCategoryLabel,
  getTodayDateKey,
  groupScoreItemsByCategory,
  isStampCardComplete,
  SCORE_CATEGORY_OPTIONS,
} from '../services/familyUtils';

interface SettingsPanelProps {
  appData: AppState;
  onUpdateItems: (items: ScoreItem[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onImportData: (state: AppState) => void;
  onUpdateRewardItems: (items: RewardItem[]) => void; // 新增：更新獎勵函式
  onUpdateGoalRewards: (updater: (items: GoalReward[]) => GoalReward[]) => void;
  onUpdateDiscountCards: (updater: (items: DiscountCard[]) => DiscountCard[]) => void;
  onUpdateRewardCards: (updater: (items: RewardCard[]) => RewardCard[]) => void;
  onUpdateStampCards: (updater: (items: StampCard[]) => StampCard[]) => void;
  resolver: User;
}

/**
 * 儲存空間資訊介面
 */
interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  usedFormatted: string;
  quotaFormatted: string;
}

type SettingsTabKey = 'goals' | 'scoreItems' | 'rewards' | 'rewardCards' | 'stampCards' | 'data' | 'members';
type SettingsGroupKey = 'cards' | 'scoring' | 'system';

const SCORE_ICON_OPTIONS = [
  { icon: '⭐', label: '通用' },
  { icon: '📚', label: '學習' },
  { icon: '🧹', label: '家事' },
  { icon: '🤝', label: '合作' },
  { icon: '🏃', label: '活動' },
  { icon: '🌱', label: '習慣' },
  { icon: '🎨', label: '才藝' },
  { icon: '⏰', label: '作息' },
] as const;

const REWARD_ICON_OPTIONS = [
  { icon: '🎁', label: '通用' },
  { icon: '🎮', label: '遊戲' },
  { icon: '🍦', label: '點心' },
  { icon: '🎬', label: '影音' },
  { icon: '🛍️', label: '購物' },
  { icon: '🏖️', label: '出遊' },
  { icon: '🎵', label: '音樂' },
  { icon: '⚽', label: '運動' },
] as const;

const STAMP_ICON_OPTIONS = [
  { icon: '🎁', label: '通用' },
  { icon: '📚', label: '書籍' },
  { icon: '🧸', label: '玩具' },
  { icon: '🚲', label: '戶外' },
  { icon: '🎨', label: '創作' },
  { icon: '🍰', label: '點心' },
  { icon: '🎮', label: '遊戲' },
  { icon: '⚽', label: '運動' },
] as const;

/**
 * 設定頁分組：把原本散落的頁籤收斂成三大群組，群組內再用次頁籤切換。
 */
const SETTINGS_GROUPS: {
  key: SettingsGroupKey;
  label: string;
  description: string;
  tabs: { key: SettingsTabKey; label: string; Icon: React.FC<{ size?: number }> }[];
}[] = [
  {
    key: 'cards',
    label: '目標與卡片',
    description: '安排階段目標，並管理孩子獲得的收藏卡。',
    tabs: [
      { key: 'goals', label: '目標', Icon: Icons.Calendar },
      { key: 'rewardCards', label: '獎勵卡', Icon: Icons.Award },
      { key: 'stampCards', label: '集點卡', Icon: Icons.Stamp },
    ],
  },
  {
    key: 'scoring',
    label: '積分與兌換',
    description: '設定加扣分規則，以及孩子可兌換的獎勵。',
    tabs: [
      { key: 'scoreItems', label: '評分項目', Icon: Icons.ClipboardList },
      { key: 'rewards', label: '獎勵管理', Icon: Icons.Gift },
    ],
  },
  {
    key: 'system',
    label: '家庭與資料',
    description: '調整家庭成員資料，以及備份或整理應用程式資料。',
    tabs: [
      { key: 'members', label: '家庭成員', Icon: Icons.User },
      { key: 'data', label: '資料管理', Icon: Icons.Download },
    ],
  },
];

const getDefaultGoalDateRange = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + offsetToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    startDate: getTodayDateKey(monday),
    endDate: getTodayDateKey(friday),
  };
};

/**
 * 設定面板元件
 * 提供家長管理評分項目、獎勵項目、使用者資料及資料備份
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  appData,
  onUpdateItems,
  onUpdateUsers,
  onImportData,
  onUpdateRewardItems,
  onUpdateGoalRewards,
  onUpdateDiscountCards,
  onUpdateRewardCards,
  onUpdateStampCards,
  resolver,
}) => {
  // --- 新增評分項目的暫存狀態 ---
  const [newItem, setNewItem] = useState<Partial<ScoreItem>>({
    label: '',
    points: 5,
    type: ScoreType.POSITIVE,
    category: ScoreCategory.DAILY,
    icon: '⭐'
  });

  // --- 新增獎勵項目的暫存狀態 (New) ---
  const [newReward, setNewReward] = useState<Partial<RewardItem>>({
    label: '',
    points: 30,
    icon: '🎁'
  });

  const childUsers = appData.users.filter((user) => user.role === UserRole.CHILD);
  const childUserIdsKey = childUsers.map((user) => user.id).join('|');
  const defaultGoalDateRange = getDefaultGoalDateRange();

  const [newGoal, setNewGoal] = useState({
    childId: childUsers[0]?.id ?? '',
    startDate: defaultGoalDateRange.startDate,
    endDate: defaultGoalDateRange.endDate,
    targetText: '',
  });

  // --- 新增獎勵卡的暫存狀態 ---
  const [newRewardCard, setNewRewardCard] = useState<{
    childId: string;
    title: string;
    rewardType: 'ITEM' | 'CUSTOM';
    rewardItemId: string;
    customLabel: string;
    customIcon: string;
  }>({
    childId: childUsers[0]?.id ?? '',
    title: '',
    rewardType: 'ITEM',
    rewardItemId: appData.rewardItems[0]?.id ?? '',
    customLabel: '',
    customIcon: '🎁',
  });

  // --- 新增集點卡的暫存狀態 ---
  const [newStampCard, setNewStampCard] = useState<{
    childId: string;
    title: string;
    targetStamps: number;
    rewardLabel: string;
    rewardIcon: string;
  }>({
    childId: childUsers[0]?.id ?? '',
    title: '',
    targetStamps: 5,
    rewardLabel: '',
    rewardIcon: '🎁',
  });

  const [activeTab, setActiveTab] = useState<SettingsTabKey>('goals');

  // --- 儲存空間資訊 ---
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // --- Modal 狀態管理 ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isAlert?: boolean;
    variant?: 'primary' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入儲存空間資訊
  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await getStorageInfo();
      setStorageInfo(info);
    };
    loadStorageInfo();
  }, [appData]); // 當資料更新時重新載入

  useEffect(() => {
    if (!childUsers.length) return;

    const resolveChildId = (id: string) =>
      childUsers.some((user) => user.id === id) ? id : childUsers[0].id;

    setNewGoal((prev) => {
      const nextChildId = resolveChildId(prev.childId);
      return nextChildId === prev.childId ? prev : { ...prev, childId: nextChildId };
    });
    setNewRewardCard((prev) => {
      const nextChildId = resolveChildId(prev.childId);
      return nextChildId === prev.childId ? prev : { ...prev, childId: nextChildId };
    });
    setNewStampCard((prev) => {
      const nextChildId = resolveChildId(prev.childId);
      return nextChildId === prev.childId ? prev : { ...prev, childId: nextChildId };
    });
  }, [childUserIdsKey]);

  // === 評分項目邏輯 ===
  
  const handleDeleteScoreItem = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除確認',
      message: '確定要刪除這個評分項目嗎？刪除後無法復原。',
      variant: 'danger',
      onConfirm: () => {
        onUpdateItems(appData.scoreItems.filter(i => i.id !== id));
      }
    });
  };

  const handleAddScoreItem = () => {
    if (!newItem.label || !newItem.points) return;
    
    const item: ScoreItem = {
      id: Date.now().toString(),
      label: newItem.label,
      points: Number(newItem.points),
      type: newItem.type || ScoreType.POSITIVE,
      category: newItem.category || ScoreCategory.DAILY,
      icon: newItem.icon
    };

    onUpdateItems([...appData.scoreItems, item]);
    setNewItem((prev) => ({
      label: '',
      points: 5,
      type: prev.type ?? ScoreType.POSITIVE,
      category: prev.category ?? ScoreCategory.DAILY,
      icon: prev.icon ?? '⭐',
    }));
  };

  // === 獎勵項目邏輯 (New) ===

  const handleDeleteRewardItem = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除確認',
      message: '確定要刪除這個獎勵項目嗎？',
      variant: 'danger',
      onConfirm: () => {
        onUpdateRewardItems(appData.rewardItems.filter(i => i.id !== id));
      }
    });
  };

  const handleAddRewardItem = () => {
    if (!newReward.label || !newReward.points) return;

    const item: RewardItem = {
        id: Date.now().toString(),
        label: newReward.label,
        points: Number(newReward.points),
        icon: newReward.icon
    };

    onUpdateRewardItems([...appData.rewardItems, item]);
    setNewReward({ label: '', points: 30, icon: '🎁' });
  };

  const handleAddGoalReward = () => {
    if (!newGoal.childId || !newGoal.targetText.trim() || !newGoal.startDate || !newGoal.endDate) {
      return;
    }

    if (newGoal.startDate > newGoal.endDate) {
      setModalConfig({
        isOpen: true,
        title: '日期設定錯誤',
        message: '起始日期不能晚於結束日期。',
        isAlert: true,
        variant: 'danger',
      });
      return;
    }

    const goal: GoalReward = {
      id: Date.now().toString(),
      childId: newGoal.childId,
      targetText: newGoal.targetText.trim(),
      startDate: newGoal.startDate,
      endDate: newGoal.endDate,
      status: GoalRewardStatus.ACTIVE,
      createdAt: Date.now(),
    };

    onUpdateGoalRewards((items) => [...items, goal]);
    setNewGoal({
      childId: newGoal.childId,
      startDate: getDefaultGoalDateRange().startDate,
      endDate: getDefaultGoalDateRange().endDate,
      targetText: '',
    });
  };

  const handleResolveGoalReward = (goal: GoalReward, status: GoalRewardStatus.ACHIEVED | GoalRewardStatus.NOT_ACHIEVED) => {
    const title = status === GoalRewardStatus.ACHIEVED ? '確認達成目標' : '確認未達成';
    const message = status === GoalRewardStatus.ACHIEVED
      ? '確認後會立即發放一張 5 折卡，且同一個目標只會發一次。'
      : '確認後此目標會標記為未達成，不會發放 5 折卡。';

    setModalConfig({
      isOpen: true,
      title,
      message,
      variant: status === GoalRewardStatus.ACHIEVED ? 'primary' : 'danger',
      onConfirm: () => {
        const resolvedAt = Date.now();
        onUpdateGoalRewards((items) =>
          items.map((item) =>
            item.id === goal.id
              ? {
                  ...item,
                  status,
                  resolvedAt,
                  resolvedById: resolver.id,
                  resolvedByName: resolver.name,
                }
              : item,
          ),
        );

        if (status === GoalRewardStatus.ACHIEVED) {
          onUpdateDiscountCards((items) => {
            if (items.some((card) => card.goalId === goal.id)) {
              return items;
            }

            return [
              ...items,
              {
                id: `card_${goal.id}`,
                childId: goal.childId,
                goalId: goal.id,
                issuedAt: resolvedAt,
                usedAt: null,
                usedById: null,
                usedByName: null,
                usedOnRecordId: null,
              },
            ];
          });
        }
      },
    });
  };

  const handleDeleteGoalReward = (goalId: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除目標',
      message: '確定要刪除這個未判定目標嗎？刪除後無法復原。',
      variant: 'danger',
      onConfirm: () => {
        onUpdateGoalRewards((items) => items.filter((item) => item.id !== goalId));
      },
    });
  };

  // === 獎勵卡邏輯 ===

  const handleIssueRewardCard = () => {
    if (!newRewardCard.childId || !newRewardCard.title.trim()) return;

    let rewardLabel = '';
    let rewardIcon: string | undefined;
    let rewardItemId: string | null = null;

    if (newRewardCard.rewardType === 'ITEM') {
      const reward = appData.rewardItems.find((item) => item.id === newRewardCard.rewardItemId);
      if (!reward) {
        setModalConfig({
          isOpen: true,
          title: '請先選擇獎勵',
          message: '找不到選定的獎勵項目，請重新選擇或改用自訂內容。',
          isAlert: true,
          variant: 'danger',
        });
        return;
      }
      rewardLabel = reward.label;
      rewardIcon = reward.icon;
      rewardItemId = reward.id;
    } else {
      if (!newRewardCard.customLabel.trim()) return;
      rewardLabel = newRewardCard.customLabel.trim();
      rewardIcon = newRewardCard.customIcon;
    }

    const card: RewardCard = {
      id: Date.now().toString(),
      childId: newRewardCard.childId,
      title: newRewardCard.title.trim(),
      rewardType: newRewardCard.rewardType,
      rewardItemId,
      rewardLabel,
      rewardIcon,
      status: RewardCardStatus.ACTIVE,
      issuedAt: Date.now(),
      issuedById: resolver.id,
      issuedByName: resolver.name,
    };

    onUpdateRewardCards((items) => [...items, card]);
    setNewRewardCard((prev) => ({ ...prev, title: '', customLabel: '', customIcon: '🎁' }));
  };

  const handleDeleteRewardCard = (cardId: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除獎勵卡',
      message: '確定要刪除這張獎勵卡嗎？刪除後無法復原。',
      variant: 'danger',
      onConfirm: () => {
        onUpdateRewardCards((items) => items.filter((item) => item.id !== cardId));
      },
    });
  };

  // === 集點卡邏輯 ===

  const handleAddStampCard = () => {
    if (!newStampCard.childId || !newStampCard.title.trim() || !newStampCard.rewardLabel.trim()) return;
    if (!newStampCard.targetStamps || newStampCard.targetStamps < 1) return;

    const card: StampCard = {
      id: Date.now().toString(),
      childId: newStampCard.childId,
      title: newStampCard.title.trim(),
      targetStamps: Number(newStampCard.targetStamps),
      stamps: 0,
      rewardLabel: newStampCard.rewardLabel.trim(),
      rewardIcon: newStampCard.rewardIcon,
      status: StampCardStatus.ACTIVE,
      createdAt: Date.now(),
    };

    onUpdateStampCards((items) => [...items, card]);
    setNewStampCard((prev) => ({ ...prev, title: '', rewardLabel: '', rewardIcon: '🎁' }));
  };

  const handleAdjustStamp = (card: StampCard, delta: number) => {
    onUpdateStampCards((items) =>
      items.map((item) =>
        item.id === card.id
          ? { ...item, stamps: Math.max(0, Math.min(item.targetStamps, item.stamps + delta)) }
          : item,
      ),
    );
  };

  const handleRedeemStampCard = (card: StampCard) => {
    setModalConfig({
      isOpen: true,
      title: '兌換集點卡',
      message: `確定要兌換「${card.title}」的禮物「${card.rewardLabel}」嗎？兌換後卡片會標記為已兌換並保留紀錄。`,
      variant: 'primary',
      onConfirm: () => {
        onUpdateStampCards((items) =>
          items.map((item) =>
            item.id === card.id
              ? {
                  ...item,
                  status: StampCardStatus.REDEEMED,
                  redeemedAt: Date.now(),
                  redeemedById: resolver.id,
                  redeemedByName: resolver.name,
                }
              : item,
          ),
        );
      },
    });
  };

  const handleDeleteStampCard = (cardId: string) => {
    setModalConfig({
      isOpen: true,
      title: '刪除集點卡',
      message: '確定要刪除這張集點卡嗎？刪除後無法復原。',
      variant: 'danger',
      onConfirm: () => {
        onUpdateStampCards((items) => items.filter((item) => item.id !== cardId));
      },
    });
  };

  // === 使用者編輯邏輯 ===
  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const updatedUsers = appData.users.map(u => u.id === id ? { ...u, ...updates } : u);
    onUpdateUsers(updatedUsers);
  };

  // === 資料備份與還原邏輯 ===
  const handleExport = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `family_points_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // === 清理舊紀錄邏輯 ===
  const handleCleanupOldRecords = (days: number) => {
    setModalConfig({
      isOpen: true,
      title: '清理確認',
      message: `確定要刪除超過 ${days} 天的紀錄嗎？此操作無法復原。建議先備份資料！`,
      variant: 'danger',
      onConfirm: async () => {
        setIsCleaningUp(true);
        try {
          const deletedCount = await cleanupOldRecords(days);
          // 重新載入儲存空間資訊
          const info = await getStorageInfo();
          setStorageInfo(info);
          
          setModalConfig({
            isOpen: true,
            title: '清理完成',
            message: `已清理 ${deletedCount} 筆舊紀錄`,
            isAlert: true,
            variant: 'primary'
          });
          
          // 觸發重新載入資料
          window.location.reload();
        } catch (err) {
          setModalConfig({
            isOpen: true,
            title: '錯誤',
            message: '清理失敗，請重試',
            isAlert: true,
            variant: 'danger'
          });
        } finally {
          setIsCleaningUp(false);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.users && json.records) {
            // 使用自定義 Modal 取代 window.confirm
            setModalConfig({
              isOpen: true,
              title: '還原資料警告',
              message: '警告：還原資料將會「完全覆蓋」目前的紀錄，確定要繼續嗎？',
              variant: 'danger',
              onConfirm: () => {
                onImportData(json);
                // 成功後顯示 Alert
                setTimeout(() => {
                    setModalConfig({
                        isOpen: true,
                        title: '通知',
                        message: '資料還原成功！',
                        isAlert: true,
                        variant: 'primary'
                    });
                }, 300);
              }
            });
        } else {
            setModalConfig({
                isOpen: true,
                title: '錯誤',
                message: '無效的備份檔案格式',
                isAlert: true,
                variant: 'danger'
            });
        }
      } catch (err) {
        console.error(err);
        setModalConfig({
            isOpen: true,
            title: '錯誤',
            message: '讀取檔案失敗',
            isAlert: true,
            variant: 'danger'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  // 篩選出加分與扣分項目以便分組顯示
  const scoreType = newItem.type ?? ScoreType.POSITIVE;
  const visibleItemsByCategory = groupScoreItemsByCategory(appData.scoreItems, scoreType);
  const visibleScoreItemCount = appData.scoreItems.filter((item) => item.type === scoreType).length;
  const today = getTodayDateKey();
  const goalRewards = [...appData.goalRewards].sort((a, b) => b.createdAt - a.createdAt);
  const activeGoals = goalRewards.filter((goal) => getGoalDisplayGroup(goal, today) === 'active');
  const pendingGoals = goalRewards.filter((goal) => getGoalDisplayGroup(goal, today) === 'pending');
  const achievedGoals = goalRewards
    .filter((goal) => getGoalDisplayGroup(goal, today) === 'achieved')
    .slice(0, 5);
  const notAchievedGoals = goalRewards
    .filter((goal) => getGoalDisplayGroup(goal, today) === 'notAchieved')
    .slice(0, 5);

  const childNameById = (id: string) => appData.users.find((user) => user.id === id)?.name ?? '未指定孩子';

  const sortedRewardCards = [...appData.rewardCards].sort((a, b) => b.issuedAt - a.issuedAt);
  const activeRewardCards = sortedRewardCards.filter((card) => card.status === RewardCardStatus.ACTIVE);
  const redeemedRewardCards = sortedRewardCards
    .filter((card) => card.status === RewardCardStatus.REDEEMED)
    .slice(0, 8);

  const sortedStampCards = [...appData.stampCards].sort((a, b) => b.createdAt - a.createdAt);
  const activeStampCards = sortedStampCards.filter((card) => card.status === StampCardStatus.ACTIVE);
  const redeemedStampCards = sortedStampCards
    .filter((card) => card.status === StampCardStatus.REDEEMED)
    .slice(0, 8);
  const currentSettingsGroup = SETTINGS_GROUPS.find((group) => group.tabs.some((tab) => tab.key === activeTab))
    ?? SETTINGS_GROUPS[0];
  const currentSettingsTab = currentSettingsGroup.tabs.find((tab) => tab.key === activeTab)
    ?? currentSettingsGroup.tabs[0];
  const CurrentSettingsIcon = currentSettingsTab.Icon;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="sticky top-4 hidden rounded-2xl bg-white p-3 soft-card lg:block">
        <div className="flex items-center gap-2 border-b border-nook-greenDark/10 px-2 pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-nook-green/15 text-nook-greenDark"><Icons.Settings size={18} /></span>
          <div>
            <h2 className="text-base font-black text-nook-brown">設定中心</h2>
            <p className="text-xs font-bold text-nook-brown/75">依功能分類管理</p>
          </div>
        </div>
        <nav className="mt-3 space-y-4" aria-label="設定項目">
          {SETTINGS_GROUPS.map((group) => (
            <section key={group.key} aria-labelledby={`settings-group-${group.key}`}>
              <h3 id={`settings-group-${group.key}`} className="mb-1 px-2 text-xs font-black text-nook-brown/75">{group.label}</h3>
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const TabIcon = tab.Icon;
                  const selected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      aria-current={selected ? 'page' : undefined}
                      className={`flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold transition-colors ${selected ? 'bg-nook-green/15 text-nook-greenDark' : 'text-nook-brown/75 hover:bg-nook-beige hover:text-nook-brown'}`}
                    >
                      <TabIcon size={17} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="sticky top-14 z-20 rounded-2xl bg-white p-2 soft-card lg:hidden">
          <div className="flex gap-1 overflow-x-auto no-scrollbar" aria-label="設定項目">
            {SETTINGS_GROUPS.flatMap((group) => group.tabs).map((tab) => {
              const TabIcon = tab.Icon;
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={selected ? 'page' : undefined}
                  className={`inline-flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors ${selected ? 'bg-nook-green text-white' : 'text-nook-brown/75 hover:bg-nook-beige'}`}
                >
                  <TabIcon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <header className="flex items-start gap-3 px-1">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-nook-green/15 text-nook-greenDark"><CurrentSettingsIcon size={20} /></span>
          <div>
            <h2 className="text-lg font-black text-nook-brown">{currentSettingsTab.label}</h2>
            <p className="mt-0.5 text-sm font-bold text-nook-brown/75">{currentSettingsGroup.description}</p>
          </div>
        </header>

      {activeTab === 'goals' && (
        <Card title="🎯 目標獎勵管理" className="bg-[#FFF7D7] border-nook-yellow/40">
            <div className="space-y-4 mb-4">
              <ChildRadioGroup
                name="goal-child"
                label="這個目標屬於誰？"
                value={newGoal.childId}
                childrenUsers={childUsers}
                onChange={(childId) => setNewGoal({ ...newGoal, childId })}
                accent="yellow"
              />
              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div className="min-w-0">
                  <label className="mb-1 ml-1 block text-xs font-black text-nook-brown">開始日期</label>
                  <input
                    type="date"
                    value={newGoal.startDate}
                    onChange={(e) => setNewGoal({ ...newGoal, startDate: e.target.value })}
                    className="compact-date-input block min-h-10 min-w-0 w-full max-w-full rounded-xl border border-nook-brown/10 bg-white px-2 py-2 text-sm font-bold text-nook-brown outline-none focus:border-nook-orange focus:ring-2 focus:ring-nook-yellow/30"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1 ml-1 block text-xs font-black text-nook-brown">結束日期</label>
                  <input
                    type="date"
                    value={newGoal.endDate}
                    onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                    className="compact-date-input block min-h-10 min-w-0 w-full max-w-full rounded-xl border border-nook-brown/10 bg-white px-2 py-2 text-sm font-bold text-nook-brown outline-none focus:border-nook-orange focus:ring-2 focus:ring-nook-yellow/30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">目標內容</label>
                  <input
                    type="text"
                    value={newGoal.targetText}
                    onChange={(e) => setNewGoal({ ...newGoal, targetText: e.target.value })}
                    className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-nook-yellow/30 focus:border-nook-orange outline-none bg-white text-nook-brown font-bold"
                    placeholder="例如：這週每天主動整理書包"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddGoalReward} className="bg-nook-orange text-white border-nook-orangeDark hover:bg-nook-orange/90 min-w-[11rem]" icon={<Icons.Plus size={20} />}>
                      新增目標
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
              <GoalSection
                title="進行中"
                goals={activeGoals}
                users={appData.users}
                appData={appData}
                emptyText="目前沒有進行中的目標"
                actionRenderer={(goal) => (
                  <>
                    <Button size="sm" variant="primary" onClick={() => handleResolveGoalReward(goal, GoalRewardStatus.ACHIEVED)}>
                      標記達成
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleResolveGoalReward(goal, GoalRewardStatus.NOT_ACHIEVED)}>
                      標記未達成
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteGoalReward(goal.id)}>
                      刪除
                    </Button>
                  </>
                )}
              />
              <GoalSection
                title="已截止待判定"
                goals={pendingGoals}
                users={appData.users}
                appData={appData}
                emptyText="目前沒有待判定目標"
                actionRenderer={(goal) => (
                  <>
                    <Button size="sm" variant="primary" onClick={() => handleResolveGoalReward(goal, GoalRewardStatus.ACHIEVED)}>
                      標記達成
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleResolveGoalReward(goal, GoalRewardStatus.NOT_ACHIEVED)}>
                      標記未達成
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteGoalReward(goal.id)}>
                      刪除
                    </Button>
                  </>
                )}
              />
              <GoalSection
                title="已達成（最近 5 筆）"
                goals={achievedGoals}
                users={appData.users}
                appData={appData}
                emptyText="目前沒有已達成目標"
              />
              <GoalSection
                title="未達成（最近 5 筆）"
                goals={notAchievedGoals}
                users={appData.users}
                appData={appData}
                emptyText="目前沒有未達成目標"
              />
            </div>
        </Card>
      )}

      {activeTab === 'scoreItems' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 rounded-2xl border border-nook-brown/10 bg-white p-1.5 shadow-sm" role="tablist" aria-label="評分類型">
            {[
              { type: ScoreType.POSITIVE, label: '加分', hint: '鼓勵好表現', Icon: Icons.PlusCircle },
              { type: ScoreType.NEGATIVE, label: '扣分', hint: '提醒需改善', Icon: Icons.MinusCircle },
            ].map(({ type, label, hint, Icon }) => {
              const active = scoreType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setNewItem((prev) => ({ ...prev, type }))}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-2 transition-colors ${
                    active
                      ? type === ScoreType.POSITIVE
                        ? 'bg-nook-green text-white shadow-sm'
                        : 'bg-nook-red text-white shadow-sm'
                      : 'text-nook-brown/50 hover:bg-nook-beige'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-left leading-tight">
                    <span className="block text-sm font-black">{label}</span>
                    <span className={`block text-xs font-bold ${active ? 'text-white' : 'text-nook-brown/75'}`}>{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Card
            title={`${scoreType === ScoreType.POSITIVE ? '🌱 新增加分項目' : '🪨 新增扣分項目'}`}
            className={scoreType === ScoreType.POSITIVE ? 'bg-[#F0FBF5] border-nook-green/30' : 'bg-[#FFF4F1] border-nook-red/25'}
          >
            <p className="mb-3 text-xs font-bold leading-relaxed text-nook-brown/55">
              {scoreType === ScoreType.POSITIVE
                ? '把常見的好行為設成快捷項目，記錄時一點就能加分。'
                : '只保留清楚、可改善的行為，避免孩子看不懂扣分原因。'}
            </p>
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
              <div>
                <label className="mb-1.5 ml-1 block text-xs font-black text-nook-brown">項目名稱</label>
                <input
                  type="text"
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  className="w-full rounded-xl border border-nook-brown/10 bg-white px-3 py-2.5 font-bold text-nook-brown outline-none focus:border-nook-green focus:ring-2 focus:ring-nook-green/20"
                  placeholder={scoreType === ScoreType.POSITIVE ? '例如：主動整理房間' : '例如：超過約定時間'}
                />
              </div>
              <div>
                <label className="mb-1.5 ml-1 block text-xs font-black text-nook-brown">點數</label>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={newItem.points}
                  onChange={(e) => setNewItem({ ...newItem, points: Number(e.target.value) })}
                  className="w-full rounded-xl border border-nook-brown/10 bg-white px-3 py-2.5 text-center font-black text-nook-brown outline-none focus:border-nook-green focus:ring-2 focus:ring-nook-green/20"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 ml-1 block text-xs font-black text-nook-brown">分類</label>
              <div className="relative">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: Number(e.target.value) as ScoreCategory })}
                  className="w-full appearance-none rounded-xl border border-nook-brown/10 bg-white py-2.5 pl-3 pr-10 font-bold text-nook-brown outline-none focus:border-nook-blue focus:ring-2 focus:ring-nook-blue/20"
                >
                  {SCORE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Icons.ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nook-brown/40" />
              </div>
            </div>

            <IconChoiceGrid
              label="代表圖示"
              hint="8 種大方向，之後辨識更快"
              options={SCORE_ICON_OPTIONS}
              value={newItem.icon ?? '⭐'}
              onChange={(icon) => setNewItem({ ...newItem, icon })}
              tone={scoreType === ScoreType.POSITIVE ? 'green' : 'red'}
            />

            <Button
              onClick={handleAddScoreItem}
              className={`mt-3 w-full text-white ${scoreType === ScoreType.POSITIVE ? 'bg-nook-green border-nook-greenDark' : 'bg-nook-red border-red-700'}`}
              icon={<Icons.Plus size={18} />}
            >
              新增{scoreType === ScoreType.POSITIVE ? '加分' : '扣分'}項目
            </Button>
          </Card>

          <section className="space-y-2" aria-label={`${scoreType === ScoreType.POSITIVE ? '加分' : '扣分'}項目清單`}>
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-nook-brown">目前的{scoreType === ScoreType.POSITIVE ? '加分' : '扣分'}項目</h3>
                <p className="text-xs font-bold text-nook-brown/75">清單會跟著上方頁籤切換，不需左右或區塊內捲動。</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-nook-brown/50">{visibleScoreItemCount} 項</span>
            </div>

            {visibleScoreItemCount === 0 ? (
              <div className="rounded-2xl border border-dashed border-nook-brown/15 bg-white/60 py-7 text-center text-sm font-bold text-nook-brown/40">
                尚未建立{scoreType === ScoreType.POSITIVE ? '加分' : '扣分'}項目
              </div>
            ) : (
              <div className="space-y-3">
                {SCORE_CATEGORY_OPTIONS.map((option) => {
                  const items = visibleItemsByCategory.get(option.value) ?? [];
                  if (!items.length) return null;
                  return (
                    <div key={option.value} className="space-y-1.5">
                      <div className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${getScoreCategoryChipClassName(option.value)}`}>
                        {option.label} · {items.length}
                      </div>
                      {items.map((item) => (
                        <ItemRow
                          key={item.id}
                          label={item.label}
                          points={item.points}
                          icon={item.icon}
                          type={item.type}
                          category={item.category}
                          onDelete={() => handleDeleteScoreItem(item.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Card title="🎁 獎勵兌換項目管理" className="bg-[#F3E8FF] border-[#D8B4FE]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end mb-4">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">獎勵名稱</label>
                <input 
                type="text" 
                value={newReward.label}
                onChange={e => setNewReward({...newReward, label: e.target.value})}
                className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-[#A88BFA]/20 focus:border-[#A88BFA] outline-none text-nook-brown font-bold bg-white"
                placeholder="例如：玩 Switch 30分鐘"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">兌換點數 (成本)</label>
                <input 
                type="number" 
                value={newReward.points}
                onChange={e => setNewReward({...newReward, points: Number(e.target.value)})}
                className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-[#A88BFA]/20 focus:border-[#A88BFA] outline-none text-nook-brown font-bold bg-white"
                />
            </div>
            <div className="flex items-end">
                <Button onClick={handleAddRewardItem} className="w-full bg-[#A88BFA] text-white border-[#8B5CF6] hover:bg-[#A88BFA]/90" icon={<Icons.Plus size={20} />}>
                    新增獎勵
                </Button>
            </div>
          </div>

          <IconChoiceGrid
            label="代表圖示"
            hint="依獎勵的大方向選一個即可"
            options={REWARD_ICON_OPTIONS}
            value={newReward.icon ?? '🎁'}
            onChange={(icon) => setNewReward({ ...newReward, icon })}
            tone="purple"
          />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
             {appData.rewardItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#D8B4FE] shadow-sm">
                   <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-[#F3E8FF] rounded-xl flex items-center justify-center text-2xl">
                           {item.icon || '🎁'}
                       </div>
                       <div>
                           <div className="font-black text-nook-brown text-sm md:text-base">{item.label}</div>
                           <div className="text-xs font-black px-2 py-0.5 rounded-full inline-block bg-[#A88BFA] text-white">
                               {item.points} pt
                           </div>
                       </div>
                   </div>
                   <button 
                     type="button"
                     onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRewardItem(item.id);
                     }} 
                     className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-3 rounded-xl transition-colors"
                   >
                     <Icons.Trash2 size={20} />
                   </button>
                </div>
             ))}
             {appData.rewardItems.length === 0 && (
                 <div className="col-span-full text-center text-nook-brown/40 py-4 font-bold">沒有獎勵項目</div>
             )}
          </div>
        </Card>
      )}

      {activeTab === 'rewardCards' && (
        <Card title="🎫 獎勵卡管理" className="bg-[#FDF2F8] border-[#FBCFE8]">
          <p className="text-sm font-bold text-nook-brown/60 mb-3">
            孩子有特殊表現（例如比賽獲獎）時頒發。頒發時就綁定兌換內容，兌換時<span className="text-[#DB2777]">不扣分</span>。
          </p>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <ChildRadioGroup
                name="reward-card-child"
                label="這張卡要頒給誰？"
                value={newRewardCard.childId}
                childrenUsers={childUsers}
                onChange={(childId) => setNewRewardCard({ ...newRewardCard, childId })}
                accent="pink"
              />
              <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">頒發原因</label>
                <input
                  type="text"
                  value={newRewardCard.title}
                  onChange={(e) => setNewRewardCard({ ...newRewardCard, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] outline-none bg-white text-nook-brown font-bold"
                  placeholder="例如：美術比賽獲獎"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">兌換內容</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setNewRewardCard({ ...newRewardCard, rewardType: 'ITEM' })}
                  className={`px-4 py-2 rounded-full font-black border transition-all ${newRewardCard.rewardType === 'ITEM' ? 'bg-[#EC4899] text-white border-[#DB2777]' : 'bg-white text-nook-brown/60 border-nook-brown/10 hover:border-nook-brown/30'}`}
                >
                  現有獎勵（免扣分）
                </button>
                <button
                  type="button"
                  onClick={() => setNewRewardCard({ ...newRewardCard, rewardType: 'CUSTOM' })}
                  className={`px-4 py-2 rounded-full font-black border transition-all ${newRewardCard.rewardType === 'CUSTOM' ? 'bg-[#EC4899] text-white border-[#DB2777]' : 'bg-white text-nook-brown/60 border-nook-brown/10 hover:border-nook-brown/30'}`}
                >
                  自訂內容
                </button>
              </div>

              {newRewardCard.rewardType === 'ITEM' ? (
                appData.rewardItems.length > 0 ? (
                  <div className="relative">
                    <select
                      value={newRewardCard.rewardItemId}
                      onChange={(e) => setNewRewardCard({ ...newRewardCard, rewardItemId: e.target.value })}
                      className="w-full appearance-none rounded-xl border border-nook-brown/10 bg-white py-2.5 pl-3 pr-10 font-bold text-nook-brown outline-none focus:border-[#EC4899] focus:ring-2 focus:ring-[#EC4899]/20"
                    >
                      {appData.rewardItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.icon || '🎁'} {item.label}</option>
                      ))}
                    </select>
                    <Icons.ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nook-brown/40" />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-nook-red bg-white rounded-xl p-3 border border-nook-red/20">
                    目前沒有獎勵項目，請先到「獎勵管理」新增，或改用自訂內容。
                  </p>
                )
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newRewardCard.customLabel}
                    onChange={(e) => setNewRewardCard({ ...newRewardCard, customLabel: e.target.value })}
                    className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-[#EC4899]/20 focus:border-[#EC4899] outline-none bg-white text-nook-brown font-bold"
                    placeholder="例如：週末去看電影"
                  />
                  <IconChoiceGrid
                    label="代表圖示"
                    hint="用大方向圖示維持卡片一致"
                    options={REWARD_ICON_OPTIONS}
                    value={newRewardCard.customIcon}
                    onChange={(customIcon) => setNewRewardCard({ ...newRewardCard, customIcon })}
                    tone="pink"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleIssueRewardCard} className="bg-[#EC4899] text-white border-[#DB2777] hover:brightness-105 min-w-[11rem]" icon={<Icons.Award size={20} />}>
                頒發獎勵卡
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            <CardListColumn title="待兌換" count={activeRewardCards.length} emptyText="目前沒有待兌換的獎勵卡">
              {activeRewardCards.map((card) => (
                <div key={card.id} className="p-3 bg-white rounded-xl border border-[#FBCFE8] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] flex items-center justify-center text-2xl flex-shrink-0">
                      {card.rewardIcon || '🎁'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-black px-3 py-0.5 rounded-full bg-nook-blue/10 text-nook-blueDark">{childNameById(card.childId)}</span>
                      <p className="font-black text-nook-brown mt-1 break-words">{card.rewardLabel}</p>
                      <p className="text-xs font-bold text-nook-brown/50 break-words">🏅 {card.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRewardCard(card.id)}
                      className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-2.5 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Icons.Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </CardListColumn>
            <CardListColumn title="已兌換（最近 8 筆）" count={redeemedRewardCards.length} emptyText="目前沒有已兌換的獎勵卡">
              {redeemedRewardCards.map((card) => (
                <div key={card.id} className="p-3 bg-white/60 rounded-xl border border-nook-brown/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-nook-beige/50 flex items-center justify-center text-xl flex-shrink-0 grayscale">
                      {card.rewardIcon || '🎁'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-nook-brown/70 break-words">{childNameById(card.childId)}｜{card.rewardLabel}</p>
                      <p className="text-xs font-bold text-nook-brown/40 break-words">🏅 {card.title}</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-nook-green/20 text-nook-greenDark flex-shrink-0">已兌換</span>
                  </div>
                </div>
              ))}
            </CardListColumn>
          </div>
        </Card>
      )}

      {activeTab === 'stampCards' && (
        <Card title="🏅 集點卡管理" className="bg-[#FFF7D7] border-nook-yellow/40">
          <p className="text-sm font-bold text-nook-brown/60 mb-3">
            由家長手動蓋章的集點卡，<span className="text-nook-orangeDark">獨立於積分</span>（不加分、不扣分）。集滿即可兌換家長指定的實體禮物。
          </p>

          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <ChildRadioGroup
                name="stamp-card-child"
                label="這張集點卡屬於誰？"
                value={newStampCard.childId}
                childrenUsers={childUsers}
                onChange={(childId) => setNewStampCard({ ...newStampCard, childId })}
                accent="orange"
              />
              <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">集點卡名稱</label>
                <input
                  type="text"
                  value={newStampCard.title}
                  onChange={(e) => setNewStampCard({ ...newStampCard, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-nook-yellow/30 focus:border-nook-orange outline-none bg-white text-nook-brown font-bold"
                  placeholder="例如：暑假閱讀集點"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">目標章數</label>
                <div className="flex gap-2 items-center">
                  {[5, 10].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setNewStampCard({ ...newStampCard, targetStamps: n })}
                      className={`px-5 py-3 rounded-xl font-black border transition-all ${newStampCard.targetStamps === n ? 'bg-nook-orange text-white border-nook-orangeDark' : 'bg-white text-nook-brown/60 border-nook-brown/10 hover:border-nook-brown/30'}`}
                    >
                      {n} 點
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    value={newStampCard.targetStamps}
                    onChange={(e) => setNewStampCard({ ...newStampCard, targetStamps: Number(e.target.value) })}
                    className="w-24 p-3 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-nook-yellow/30 focus:border-nook-orange outline-none bg-white text-nook-brown font-bold text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-nook-brown mb-2 ml-1">集滿禮物</label>
                <input
                  type="text"
                  value={newStampCard.rewardLabel}
                  onChange={(e) => setNewStampCard({ ...newStampCard, rewardLabel: e.target.value })}
                  className="w-full px-3 py-2.5 border border-nook-brown/10 rounded-xl focus:ring-2 focus:ring-nook-yellow/30 focus:border-nook-orange outline-none bg-white text-nook-brown font-bold"
                  placeholder="例如：一本新的故事書"
                />
              </div>
            </div>

            <IconChoiceGrid
              label="禮物圖示"
              hint="選擇最接近的禮物類型"
              options={STAMP_ICON_OPTIONS}
              value={newStampCard.rewardIcon}
              onChange={(rewardIcon) => setNewStampCard({ ...newStampCard, rewardIcon })}
              tone="orange"
            />

            <div className="flex justify-end">
              <Button onClick={handleAddStampCard} className="bg-nook-orange text-white border-nook-orangeDark hover:brightness-105 min-w-[11rem]" icon={<Icons.Plus size={20} />}>
                建立集點卡
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            <CardListColumn title="集點中" count={activeStampCards.length} emptyText="目前沒有集點中的卡片">
              {activeStampCards.map((card) => {
                const complete = isStampCardComplete(card);
                const filled = Math.min(card.stamps, card.targetStamps);
                return (
                  <div key={card.id} className={`p-3 rounded-xl border shadow-sm ${complete ? 'bg-nook-yellow/20 border-nook-orange/40' : 'bg-white border-nook-brown/5'}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-black px-3 py-0.5 rounded-full bg-nook-blue/10 text-nook-blueDark">{childNameById(card.childId)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStampCard(card.id)}
                        className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-2 rounded-xl transition-colors"
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>
                    <p className="font-black text-nook-brown leading-tight">{card.title}</p>
                    <p className="text-xs font-bold text-nook-brown/50 mb-3">禮物：{card.rewardIcon || '🎁'} {card.rewardLabel}</p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Array.from({ length: card.targetStamps }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border ${idx < filled ? 'bg-nook-orange text-white border-nook-orangeDark' : 'bg-white text-nook-brown/20 border-nook-brown/10'}`}
                        >
                          {idx < filled ? '★' : '☆'}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black px-3 py-1.5 rounded-full bg-nook-beige text-nook-brown/60">{filled}/{card.targetStamps}</span>
                      <Button size="sm" variant="outline" onClick={() => handleAdjustStamp(card, -1)} disabled={card.stamps <= 0}>
                        −1
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAdjustStamp(card, 1)} disabled={card.stamps >= card.targetStamps}>
                        蓋章 +1
                      </Button>
                      {complete && (
                        <Button size="sm" className="bg-nook-orange text-white border-nook-orangeDark hover:brightness-105" onClick={() => handleRedeemStampCard(card)} icon={<Icons.Gift size={16} />}>
                          兌換禮物
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardListColumn>
            <CardListColumn title="已兌換（最近 8 筆）" count={redeemedStampCards.length} emptyText="目前沒有已兌換的集點卡">
              {redeemedStampCards.map((card) => (
                <div key={card.id} className="p-3 bg-white/60 rounded-xl border border-nook-brown/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-nook-beige/50 flex items-center justify-center text-xl flex-shrink-0 grayscale">
                      {card.rewardIcon || '🎁'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-nook-brown/70 break-words">{childNameById(card.childId)}｜{card.title}</p>
                      <p className="text-xs font-bold text-nook-brown/40 break-words">禮物：{card.rewardLabel}</p>
                    </div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-nook-green/20 text-nook-greenDark flex-shrink-0">已兌換</span>
                  </div>
                </div>
              ))}
            </CardListColumn>
          </div>
        </Card>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <Card title="💾 資料管理" className="bg-white border-nook-blue/30">
              {storageInfo && (
                <div className="mb-3 p-3 bg-nook-beige/30 rounded-xl border border-nook-brown/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-nook-brown text-sm">瀏覽器快取使用量</span>
                    <span className="text-xs font-bold text-nook-brown/60">
                      {storageInfo.usedFormatted} / {storageInfo.quotaFormatted}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-nook-brown/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        storageInfo.percentage > 80 
                          ? 'bg-nook-red' 
                          : storageInfo.percentage > 50 
                            ? 'bg-nook-orange' 
                            : 'bg-nook-green'
                      }`}
                      style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-nook-brown/50">
                      目前有 {appData.records.length} 筆紀錄
                    </span>
                    <span className="text-xs font-bold text-nook-brown/60">
                      {storageInfo.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
                  <div className="flex-1">
                      <p className="text-nook-brown font-bold mb-2">主資料已同步到 Firebase，這裡仍可下載 JSON 備份</p>
                      <p className="text-nook-brown/60 text-sm">如果你要換帳號、重設資料，或只是想留一份保險備份，建議偶爾下載一次。</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                      <Button onClick={handleExport} variant="secondary" icon={<Icons.Download size={20} />}>
                          備份資料
                      </Button>
                      <Button onClick={handleImportClick} variant="outline" icon={<Icons.Upload size={20} />}>
                          還原資料
                      </Button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                  </div>
              </div>

              <div className="mt-3 pt-3 border-t-2 border-nook-brown/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-nook-brown">🧹 清理舊紀錄</p>
                    <p className="text-nook-brown/60 text-sm">刪除過舊的紀錄以釋放儲存空間</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCleanupOldRecords(365)}
                      disabled={isCleaningUp}
                    >
                      保留一年
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCleanupOldRecords(180)}
                      disabled={isCleaningUp}
                    >
                      保留半年
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCleanupOldRecords(90)}
                      disabled={isCleaningUp}
                    >
                      保留三個月
                    </Button>
                  </div>
                </div>
              </div>
          </Card>

          <Card title="⚠️ 重要提醒" className="bg-nook-yellow/20 border-nook-orange/30">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                  <span className="text-xl">☁️</span>
                  <div>
                    <p className="font-bold text-nook-brown">資料會同步到 Firebase 雲端</p>
                    <p className="text-sm text-nook-brown/60">只要不同裝置登入同一組 Firebase 帳號，就會看到同一份家庭資料。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="font-bold text-nook-brown">這裡顯示的是瀏覽器快取</p>
                    <p className="text-sm text-nook-brown/60">就算本機快取被清掉，只要雲端資料還在，重新登入後仍可同步回來。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                  <span className="text-xl">🗑️</span>
                  <div>
                    <p className="font-bold text-nook-brown">仍然建議定期備份</p>
                    <p className="text-sm text-nook-brown/60">雲端同步可以降低遺失風險，但重要資料仍建議偶爾下載 JSON 備份。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-bold text-nook-brown">無痕/私密模式仍不建議</p>
                    <p className="text-sm text-nook-brown/60">雖然主資料在雲端，但無痕模式會讓登入狀態與本機快取更不穩定。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-nook-green/20 rounded-xl border border-nook-green/30">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="font-bold text-nook-greenDark">建議：定期備份！</p>
                    <p className="text-sm text-nook-brown/60">請養成定期下載備份檔案的習慣，避免意外遺失珍貴的積分紀錄。</p>
                  </div>
                </div>
              </div>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <Card title="👥 成員設定" className="bg-white border-nook-orange/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {appData.users.map(user => (
                    <div key={user.id} className="p-3 rounded-xl bg-nook-beige/30 border border-nook-brown/10 flex flex-col items-center">
                        <div className="text-4xl mb-2">{user.avatar}</div>
                        <div className="w-full space-y-2">
                            <div>
                                <label className="text-xs font-bold text-nook-brown/50">顯示名稱</label>
                                <input 
                                  type="text" 
                                  value={user.name} 
                                  onChange={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                                  className="w-full bg-white border border-nook-brown/20 rounded-lg px-2 py-1 text-nook-brown font-bold text-center"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-nook-brown/50">頭像 (Emoji)</label>
                                <input 
                                  type="text" 
                                  value={user.avatar} 
                                  onChange={(e) => handleUpdateUser(user.id, { avatar: e.target.value })}
                                  className="w-full bg-white border border-nook-brown/20 rounded-lg px-2 py-1 text-nook-brown font-bold text-center"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      )}

      </div>

      {/* 共用確認視窗 */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isAlert={modalConfig.isAlert}
        variant={modalConfig.variant}
      />

    </div>
  );
};

const ChildRadioGroup: React.FC<{
  name: string;
  label: string;
  value: string;
  childrenUsers: User[];
  onChange: (childId: string) => void;
  accent: 'yellow' | 'pink' | 'orange';
}> = ({ name, label, value, childrenUsers, onChange, accent }) => {
  const selectedClass = {
    yellow: 'border-nook-orange bg-nook-yellow/35 text-nook-brown',
    pink: 'border-[#EC4899] bg-[#FDF2F8] text-nook-brown',
    orange: 'border-nook-orange bg-[#FFF7D7] text-nook-brown',
  }[accent];

  return (
    <fieldset>
      <legend className="mb-1.5 ml-1 text-xs font-black text-nook-brown">{label}</legend>
      <div className={`grid gap-2 ${childrenUsers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {childrenUsers.map((child) => {
          const selected = child.id === value;
          return (
            <label
              key={child.id}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                selected ? selectedClass : 'border-nook-brown/10 bg-white text-nook-brown/55 hover:border-nook-brown/25'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={child.id}
                checked={selected}
                onChange={() => onChange(child.id)}
                className="sr-only"
              />
              <span className="text-xl" aria-hidden="true">{child.avatar}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-black">{child.name}</span>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-current' : 'border-nook-brown/20'}`}>
                {selected && <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

const IconChoiceGrid: React.FC<{
  label: string;
  hint: string;
  options: readonly { readonly icon: string; readonly label: string }[];
  value: string;
  onChange: (icon: string) => void;
  tone: 'green' | 'red' | 'purple' | 'pink' | 'orange';
}> = ({ label, hint, options, value, onChange, tone }) => {
  const selectedClass = {
    green: 'border-nook-green bg-nook-green/15 text-nook-greenDark',
    red: 'border-nook-red bg-nook-red/10 text-nook-red',
    purple: 'border-[#A88BFA] bg-[#F3E8FF] text-[#6D4ACC]',
    pink: 'border-[#EC4899] bg-[#FDF2F8] text-[#DB2777]',
    orange: 'border-nook-orange bg-nook-yellow/25 text-nook-orangeDark',
  }[tone];

  return (
    <fieldset className="mt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
        <legend className="text-xs font-black text-nook-brown">{label}</legend>
        <span className="text-xs font-bold text-nook-brown/75">{hint}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {options.map((option) => {
          const selected = value === option.icon;
          return (
            <button
              type="button"
              key={option.icon}
              aria-pressed={selected}
              onClick={() => onChange(option.icon)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition-colors ${
                selected ? selectedClass : 'border-nook-brown/10 bg-white/80 text-nook-brown/50 hover:border-nook-brown/25'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{option.icon}</span>
              <span className="mt-1 text-xs font-black leading-none">{option.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

// --- 通用列表列元件 (用於設定頁面) ---
interface ItemRowProps {
  label: string;
  points: number;
  icon?: string;
  type?: ScoreType;
  category?: ScoreCategory;
  onDelete: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ label, points, icon, type, category, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-nook-brown/5 hover:border-nook-brown/20 transition-colors group">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 bg-nook-beige rounded-lg flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-nook-brown text-sm truncate">{label}</div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${type === ScoreType.POSITIVE ? 'bg-nook-green/20 text-nook-greenDark' : 'bg-nook-red/20 text-nook-red'}`}>
            {type === ScoreType.POSITIVE ? '+' : '-'}{points}
          </div>
          {category && (
            <div className={`text-xs font-black px-2 py-0.5 rounded-full border inline-block ${getScoreCategoryChipClassName(category)}`}>
              {getScoreCategoryLabel(category)}
            </div>
          )}
        </div>
      </div>
    </div>
    <button 
      type="button"
      onClick={(e) => {
          e.stopPropagation();
          onDelete();
      }} 
      className="text-nook-brown/30 hover:text-nook-red hover:bg-nook-red/10 p-2 rounded-lg transition-colors"
    >
      <Icons.Trash2 size={17} />
    </button>
  </div>
);

const CardListColumn: React.FC<{
  title: string;
  count: number;
  emptyText: string;
  children?: React.ReactNode;
}> = ({ title, count, emptyText, children }) => (
  <div className="space-y-2">
    <div className="bg-white/70 p-3 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-nook-brown text-base">{title}</h3>
        <span className="text-xs font-black text-nook-brown/50 bg-nook-beige px-3 py-1 rounded-full">{count} 筆</span>
      </div>
    </div>

    <div className="space-y-2">
      {count === 0 ? (
        <div className="text-center py-6 rounded-xl border border-dashed border-nook-brown/10 bg-white/50 text-nook-brown/40 text-sm font-bold">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

interface GoalSectionProps {
  title: string;
  goals: GoalReward[];
  users: User[];
  appData: AppState;
  emptyText: string;
  actionRenderer?: (goal: GoalReward) => React.ReactNode;
}

const GoalSection: React.FC<GoalSectionProps> = ({ title, goals, users, appData, emptyText, actionRenderer }) => (
  <div className="space-y-2">
    <div className="bg-white/70 p-3 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-nook-brown text-base">{title}</h3>
        <span className="text-xs font-black text-nook-brown/50 bg-nook-beige px-3 py-1 rounded-full">{goals.length} 筆</span>
      </div>
    </div>

    <div className="space-y-2">
      {goals.map((goal) => {
        const child = users.find((user) => user.id === goal.childId);
        const linkedCardCount = appData.discountCards.filter((card) => card.goalId === goal.id).length;

        return (
          <div key={goal.id} className="p-3 bg-white rounded-xl border border-nook-brown/5">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-nook-blue/10 text-nook-blueDark">
                {child?.name ?? '未指定孩子'}
              </span>
              <span className="rounded-full bg-nook-yellow/20 px-2 py-0.5 text-xs font-black text-nook-orangeDark">
                {getGoalRewardStatusLabel(goal.status)}
              </span>
              {linkedCardCount > 0 && (
                <span className="rounded-full bg-[#F3E8FF] px-2 py-0.5 text-xs font-black text-[#6D46C2]">
                  已發 5 折卡
                </span>
              )}
            </div>

            <p className="font-bold text-nook-brown text-sm leading-snug">{goal.targetText}</p>
            <p className="text-xs font-bold text-nook-brown/50 mt-1">{formatGoalDateRange(goal)}</p>

            {goal.resolvedByName && (
              <p className="text-xs font-bold text-nook-brown/40 mt-2">
                判定者：{goal.resolvedByName}
              </p>
            )}

            {actionRenderer && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {actionRenderer(goal)}
              </div>
            )}
          </div>
        );
      })}

      {goals.length === 0 && (
        <div className="text-center py-6 rounded-xl border border-dashed border-nook-brown/10 bg-white/50 text-nook-brown/40 text-sm font-bold">
          {emptyText}
        </div>
      )}
    </div>
  </div>
);
