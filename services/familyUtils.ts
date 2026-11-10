import {
  DiscountCard,
  GoalReward,
  GoalRewardStatus,
  RewardCard,
  RewardCardStatus,
  RewardItem,
  ScoreCategory,
  ScoreItem,
  ScoreRecord,
  ScoreType,
  StampCard,
  StampCardStatus,
} from '../types';

// 分類是「這筆屬於哪一類」的標籤，不是狀態，所以不吃強調色。
// 原本 活動=orange（隊色）、日常=cyan（系統作用中色）會和隊伍識別與
// 「這是可以按的東西」互相混淆，改成中性鋼灰 chip，靠文字區分。
export const SCORE_CATEGORY_OPTIONS = [
  {
    value: ScoreCategory.ACADEMIC,
    label: '學業',
    chipClassName: 'bg-bey-paper text-bey-dim border-bey-steel',
    panelClassName: 'bg-bey-deep/40 border-bey-steel',
  },
  {
    value: ScoreCategory.ACTIVITY,
    label: '活動',
    chipClassName: 'bg-bey-paper text-bey-dim border-bey-steel',
    panelClassName: 'bg-bey-deep/40 border-bey-steel',
  },
  {
    value: ScoreCategory.DAILY,
    label: '日常',
    chipClassName: 'bg-bey-paper text-bey-dim border-bey-steel',
    panelClassName: 'bg-bey-deep/40 border-bey-steel',
  },
] as const;

const ACADEMIC_LABELS = new Set(['成績優異 (95↑)', '成績優異 (90↑)', '複習課業']);
const ACTIVITY_LABELS = new Set(['去教會']);

export const getScoreCategoryLabel = (category?: ScoreCategory | null): string => {
  return SCORE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? '日常';
};

export const getScoreCategoryChipClassName = (category?: ScoreCategory | null): string => {
  return (
    SCORE_CATEGORY_OPTIONS.find((option) => option.value === category)?.chipClassName ??
    'bg-bey-paper text-bey-dim border-bey-steel'
  );
};

export const getScoreCategoryPanelClassName = (category?: ScoreCategory | null): string => {
  return (
    SCORE_CATEGORY_OPTIONS.find((option) => option.value === category)?.panelClassName ??
    'bg-bey-deep/40 border-bey-steel'
  );
};

export const inferScoreItemCategory = (item: Partial<ScoreItem>): ScoreCategory => {
  if (item.category && Object.values(ScoreCategory).includes(item.category)) {
    return item.category;
  }

  if (ACADEMIC_LABELS.has(item.label ?? '')) {
    return ScoreCategory.ACADEMIC;
  }

  if (ACTIVITY_LABELS.has(item.label ?? '')) {
    return ScoreCategory.ACTIVITY;
  }

  return ScoreCategory.DAILY;
};

export const normalizeScoreItem = (item: ScoreItem): ScoreItem => ({
  ...item,
  category: inferScoreItemCategory(item),
});

export const isRewardRecord = (record: Partial<ScoreRecord>, rewardIds: Set<string>): boolean => {
  if (record.itemId && rewardIds.has(record.itemId)) {
    return true;
  }

  if (record.itemName?.startsWith('兌換：')) {
    return true;
  }

  return record.note?.includes('獎勵兌換') ?? false;
};

export const resolveRecordCategory = (
  record: ScoreRecord,
  scoreItemMap: Map<string, ScoreItem>,
  rewardIds: Set<string>,
): ScoreCategory | null => {
  if (record.scoreCategory && Object.values(ScoreCategory).includes(record.scoreCategory)) {
    return record.scoreCategory;
  }

  if (record.itemId === CARRYOVER_ITEM_ID || isRewardRecord(record, rewardIds)) {
    return null;
  }

  if (record.itemId === '__custom__') {
    return ScoreCategory.DAILY;
  }

  return scoreItemMap.get(record.itemId)?.category ?? ScoreCategory.DAILY;
};

export const normalizeScoreRecord = (
  record: ScoreRecord,
  scoreItemMap: Map<string, ScoreItem>,
  rewardIds: Set<string>,
): ScoreRecord => ({
  ...record,
  scoreCategory: resolveRecordCategory(record, scoreItemMap, rewardIds),
});

/** 加扣分紀錄保留幾個月；更早的紀錄併成每個孩子一筆「結餘」。 */
export const RECORD_RETENTION_MONTHS = 3;
export const CARRYOVER_ITEM_ID = '__carryover__';

/**
 * 把超過保留期限的紀錄刪掉，改成每個孩子一筆結餘紀錄。
 *
 * 分數是所有紀錄 pointsChange 的總和，直接刪紀錄會讓分數變少，
 * 所以刪掉的分數要原封不動搬進結餘。舊的結餘也一起重算，每個孩子永遠只有一筆。
 * 花園陽光、鋼料這些累計值不是從紀錄算的，不受影響。
 */
export const pruneOldRecords = <T extends { records: ScoreRecord[] }>(state: T, now: number): T => {
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(cutoffDate.getMonth() - RECORD_RETENTION_MONTHS);
  const cutoff = cutoffDate.getTime();

  const isExpired = (record: ScoreRecord) => record.timestamp < cutoff;
  // 只有結餘本身過期的話不用動，否則每次寫入都會把結餘重寫一次
  if (!state.records.some((record) => isExpired(record) && record.itemId !== CARRYOVER_ITEM_ID)) {
    return state;
  }

  const carried = new Map<string, { childName: string; points: number }>();
  state.records.filter(isExpired).forEach((record) => {
    const entry = carried.get(record.childId) ?? { childName: record.childName, points: 0 };
    entry.points += record.pointsChange;
    if (record.itemId !== CARRYOVER_ITEM_ID) entry.childName = record.childName;
    carried.set(record.childId, entry);
  });

  const carryoverRecords: ScoreRecord[] = Array.from(carried.entries())
    .filter(([, entry]) => entry.points !== 0)
    .map(([childId, entry]) => ({
      id: `${CARRYOVER_ITEM_ID}_${childId}`,
      childId,
      childName: entry.childName,
      itemId: CARRYOVER_ITEM_ID,
      itemName: `${RECORD_RETENTION_MONTHS} 個月前的累計分數`,
      pointsChange: entry.points,
      scoreCategory: null,
      // 放在保留期限前一刻，讓它永遠排在最舊的位置
      timestamp: cutoff - 1,
      note: `超過 ${RECORD_RETENTION_MONTHS} 個月的紀錄已整理成這一筆，分數不變`,
      createdById: 'system',
      createdByName: '系統',
    }));

  return {
    ...state,
    records: [...carryoverRecords, ...state.records.filter((record) => !isExpired(record))],
  };
};

export const getTodayDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getGoalRewardStatusLabel = (status: GoalRewardStatus): string => {
  switch (status) {
    case GoalRewardStatus.ACHIEVED:
      return '已達成';
    case GoalRewardStatus.NOT_ACHIEVED:
      return '未達成';
    case GoalRewardStatus.ACTIVE:
    default:
      return '進行中';
  }
};

export const getGoalDisplayGroup = (
  goal: GoalReward,
  today = getTodayDateKey(),
): 'active' | 'pending' | 'achieved' | 'notAchieved' => {
  if (goal.status === GoalRewardStatus.ACHIEVED) {
    return 'achieved';
  }

  if (goal.status === GoalRewardStatus.NOT_ACHIEVED) {
    return 'notAchieved';
  }

  if (goal.endDate < today) {
    return 'pending';
  }

  return 'active';
};

export const isGoalWithinActiveWindow = (goal: GoalReward, today = getTodayDateKey()): boolean => {
  return goal.status === GoalRewardStatus.ACTIVE && goal.startDate <= today && goal.endDate >= today;
};

export const isGoalPendingDecision = (goal: GoalReward, today = getTodayDateKey()): boolean => {
  return goal.status === GoalRewardStatus.ACTIVE && goal.endDate < today;
};

export const formatGoalDateRange = (goal: GoalReward): string => {
  return `${goal.startDate} 至 ${goal.endDate}`;
};

export const getDiscountedRewardCost = (points: number): number => Math.ceil(points / 2);

export const getUnusedDiscountCards = (
  cards: DiscountCard[],
  childId: string,
): DiscountCard[] => {
  return cards
    .filter((card) => card.childId === childId && !card.usedAt)
    .sort((a, b) => a.issuedAt - b.issuedAt);
};

export const getRewardCost = (reward: RewardItem, useDiscountCard: boolean): number => {
  return useDiscountCard ? getDiscountedRewardCost(reward.points) : reward.points;
};

// === 獎勵卡 ===

/** 取得某位孩子尚未兌換的獎勵卡（依頒發時間排序，最新在前） */
export const getActiveRewardCards = (cards: RewardCard[], childId: string): RewardCard[] => {
  return cards
    .filter((card) => card.childId === childId && card.status === RewardCardStatus.ACTIVE)
    .sort((a, b) => b.issuedAt - a.issuedAt);
};

// === 集點卡 ===

/** 取得某位孩子集點中的卡片（依建立時間排序，最新在前） */
export const getActiveStampCards = (cards: StampCard[], childId: string): StampCard[] => {
  return cards
    .filter((card) => card.childId === childId && card.status === StampCardStatus.ACTIVE)
    .sort((a, b) => b.createdAt - a.createdAt);
};

/** 集點卡是否已集滿（達到目標章數） */
export const isStampCardComplete = (card: StampCard): boolean => {
  return card.stamps >= card.targetStamps;
};

export const groupScoreItemsByCategory = (items: ScoreItem[], type: ScoreType): Map<ScoreCategory, ScoreItem[]> => {
  const grouped = new Map<ScoreCategory, ScoreItem[]>();

  SCORE_CATEGORY_OPTIONS.forEach((option) => {
    const categoryItems = items
      .filter((item) => item.type === type && item.category === option.value)
      .sort((a, b) => a.points - b.points || a.label.localeCompare(b.label, 'zh-Hant'));

    if (categoryItems.length > 0) {
      grouped.set(option.value, categoryItems);
    }
  });

  return grouped;
};
