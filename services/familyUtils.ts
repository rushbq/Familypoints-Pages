import {
  DiscountCard,
  GoalReward,
  GoalRewardStatus,
  RewardItem,
  ScoreCategory,
  ScoreItem,
  ScoreRecord,
  ScoreType,
} from '../types';

export const SCORE_CATEGORY_OPTIONS = [
  {
    value: ScoreCategory.ACADEMIC,
    label: '學業',
    chipClassName: 'bg-nook-blue/15 text-nook-blueDark border-nook-blue/30',
    panelClassName: 'bg-nook-blue/10 border-nook-blue/25',
  },
  {
    value: ScoreCategory.ACTIVITY,
    label: '活動',
    chipClassName: 'bg-nook-orange/15 text-nook-orangeDark border-nook-orange/30',
    panelClassName: 'bg-nook-orange/10 border-nook-orange/25',
  },
  {
    value: ScoreCategory.DAILY,
    label: '日常',
    chipClassName: 'bg-nook-green/15 text-nook-greenDark border-nook-green/30',
    panelClassName: 'bg-nook-green/10 border-nook-green/25',
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
    'bg-nook-green/15 text-nook-greenDark border-nook-green/30'
  );
};

export const getScoreCategoryPanelClassName = (category?: ScoreCategory | null): string => {
  return (
    SCORE_CATEGORY_OPTIONS.find((option) => option.value === category)?.panelClassName ??
    'bg-nook-green/10 border-nook-green/25'
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

  if (isRewardRecord(record, rewardIds)) {
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
