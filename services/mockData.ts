import {
  AppState,
  GoalRewardStatus,
  RewardCardStatus,
  ScoreCategory,
  ScoreType,
  StampCardStatus,
  UserRole,
} from '../types';
import { createInitialFamilyGarden } from './gardenUtils';

/**
 * 開發預覽用的假資料（僅在 import.meta.env.DEV 下透過 PreviewHarness 使用）。
 * 正式 build 會被 tree-shaking 移除，不會影響 Firebase 正式流程。
 */
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const dateKey = (offsetDays: number): string => {
  const d = new Date(now + offsetDays * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getMockState = (): AppState => {
  const users = [
    { id: 'parent_1', name: '爸爸/媽媽', role: UserRole.PARENT, avatar: '👑' },
    { id: 'child_1', name: '丞鈞', role: UserRole.CHILD, avatar: '🧑' },
    { id: 'child_2', name: '佑佑', role: UserRole.CHILD, avatar: '🧒' },
  ];
  const familyGarden = createInitialFamilyGarden(users, now - 12 * DAY);
  familyGarden.childProgress = [
    { childId: 'child_1', earnedPositivePoints: 55, usedWaterings: 1 },
    { childId: 'child_2', earnedPositivePoints: 13, usedWaterings: 0 },
  ];
  familyGarden.plants[0].waterings = [
    { id: 'gw_1', childId: 'child_1', childName: '丞鈞', wateredAt: now - 3 * DAY },
  ];

  return {
  users,
  scoreItems: [
    { id: 'item_1', label: '做家事', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.DAILY, icon: '🧹' },
    { id: 'item_2', label: '成績優異 (95↑)', points: 10, type: ScoreType.POSITIVE, category: ScoreCategory.ACADEMIC, icon: '💯' },
    { id: 'item_4', label: '互相幫忙', points: 10, type: ScoreType.POSITIVE, category: ScoreCategory.DAILY, icon: '🤝' },
    { id: 'item_5', label: '複習課業', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.ACADEMIC, icon: '📖' },
    { id: 'item_6', label: '去教會', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.ACTIVITY, icon: '⛪' },
    { id: 'item_7', label: '未整理書包', points: 5, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '🎒' },
    { id: 'item_8', label: '刻意吵架', points: 10, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '💢' },
  ],
  rewardItems: [
    { id: 'reward_1', label: '玩 Switch (30分)', points: 30, icon: '🎮' },
    { id: 'reward_2', label: '看電視 (30分)', points: 30, icon: '📺' },
    { id: 'reward_3', label: '使用電腦 (30分)', points: 15, icon: '💻' },
  ],
  records: [
    { id: 'r1', childId: 'child_1', childName: '丞鈞', itemId: 'item_2', itemName: '成績優異 (95↑)', pointsChange: 10, scoreCategory: ScoreCategory.ACADEMIC, timestamp: now - 1 * DAY, note: '數學考 98 分', createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r2', childId: 'child_1', childName: '丞鈞', itemId: 'item_1', itemName: '做家事', pointsChange: 5, scoreCategory: ScoreCategory.DAILY, timestamp: now - 2 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r3', childId: 'child_1', childName: '丞鈞', itemId: 'item_8', itemName: '刻意吵架', pointsChange: -10, scoreCategory: ScoreCategory.DAILY, timestamp: now - 3 * DAY, note: '跟弟弟搶玩具', createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r4', childId: 'child_1', childName: '丞鈞', itemId: 'item_5', itemName: '複習課業', pointsChange: 5, scoreCategory: ScoreCategory.ACADEMIC, timestamp: now - 4 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r5', childId: 'child_1', childName: '丞鈞', itemId: 'reward_3', itemName: '兌換：使用電腦 (30分)', pointsChange: -15, scoreCategory: null, timestamp: now - 5 * DAY, note: '獎勵兌換｜原價 15 分｜實付 15 分｜未使用 5 折卡', createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r6', childId: 'child_1', childName: '丞鈞', itemId: 'item_1', itemName: '做家事', pointsChange: 5, scoreCategory: ScoreCategory.DAILY, timestamp: now - 6 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r7', childId: 'child_2', childName: '佑佑', itemId: 'item_4', itemName: '互相幫忙', pointsChange: 10, scoreCategory: ScoreCategory.DAILY, timestamp: now - 1 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r8', childId: 'child_2', childName: '佑佑', itemId: 'item_6', itemName: '去教會', pointsChange: 5, scoreCategory: ScoreCategory.ACTIVITY, timestamp: now - 2 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
    { id: 'r9', childId: 'child_2', childName: '佑佑', itemId: 'item_2', itemName: '成績優異 (95↑)', pointsChange: 10, scoreCategory: ScoreCategory.ACADEMIC, timestamp: now - 3 * DAY, createdById: 'parent_1', createdByName: '爸爸/媽媽' },
  ],
  messages: [],
  goalRewards: [
    { id: 'goal_1', childId: 'child_1', targetText: '這週每天主動整理書包', startDate: dateKey(-2), endDate: dateKey(3), status: GoalRewardStatus.ACTIVE, createdAt: now - 2 * DAY },
    { id: 'goal_2', childId: 'child_2', targetText: '整個月不跟哥哥吵架', startDate: dateKey(-10), endDate: dateKey(-1), status: GoalRewardStatus.ACTIVE, createdAt: now - 10 * DAY },
  ],
  discountCards: [
    { id: 'card_goal_x', childId: 'child_1', goalId: 'goal_x', issuedAt: now - 8 * DAY, usedAt: null, usedById: null, usedByName: null, usedOnRecordId: null },
  ],
  rewardCards: [
    { id: 'rc_1', childId: 'child_1', title: '美術比賽獲獎', rewardType: 'ITEM', rewardItemId: 'reward_1', rewardLabel: '玩 Switch (30分)', rewardIcon: '🎮', status: RewardCardStatus.ACTIVE, issuedAt: now - 1 * DAY, issuedById: 'parent_1', issuedByName: '爸爸/媽媽' },
    { id: 'rc_2', childId: 'child_2', title: '幫忙照顧生病的哥哥', rewardType: 'CUSTOM', rewardItemId: null, rewardLabel: '週末去看電影', rewardIcon: '🎬', status: RewardCardStatus.ACTIVE, issuedAt: now - 2 * DAY, issuedById: 'parent_1', issuedByName: '爸爸/媽媽' },
  ],
  stampCards: [
    { id: 'sc_1', childId: 'child_1', title: '暑假閱讀集點', targetStamps: 10, stamps: 6, rewardLabel: '一本新的故事書', rewardIcon: '📚', status: StampCardStatus.ACTIVE, createdAt: now - 15 * DAY },
    { id: 'sc_2', childId: 'child_2', title: '主動刷牙集點', targetStamps: 5, stamps: 5, rewardLabel: '小汽車玩具', rewardIcon: '🚗', status: StampCardStatus.ACTIVE, createdAt: now - 7 * DAY },
  ],
  familyGarden,
  };
};
