import Dexie, { Table } from 'dexie';
import {
  DiscountCard,
  GoalReward,
  RewardCard,
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
import { inferScoreItemCategory, normalizeScoreItem, normalizeScoreRecord } from './familyUtils';
import { createInitialFamilyGarden } from './gardenUtils';

/**
 * FamilyPointsDB - 使用 Dexie.js 封裝 IndexedDB
 * 
 * 優點：
 * - 儲存空間大 (50MB+)
 * - 支援複雜查詢
 * - 自動處理資料庫版本遷移
 * - TypeScript 完整支援
 */
export class FamilyPointsDB extends Dexie {
  users!: Table<User, string>;
  scoreItems!: Table<ScoreItem, string>;
  rewardItems!: Table<RewardItem, string>;
  records!: Table<ScoreRecord, string>;
  messages!: Table<SecretMessage, string>;
  goalRewards!: Table<GoalReward, string>;
  discountCards!: Table<DiscountCard, string>;
  rewardCards!: Table<RewardCard, string>;
  stampCards!: Table<StampCard, string>;

  constructor() {
    super('FamilyPointsDB');
    
    // 定義資料庫結構 (Schema)
    // 版本 1：初始結構
    this.version(1).stores({
      users: 'id, role',                    // 主鍵 id，索引 role
      scoreItems: 'id, type',               // 主鍵 id，索引 type
      rewardItems: 'id',                    // 主鍵 id
      records: 'id, childId, timestamp',    // 主鍵 id，索引 childId 和 timestamp
      messages: 'id, fromChildId, isRead, timestamp' // 主鍵 id，多重索引
    });

    this.version(2).stores({
      users: 'id, role',
      scoreItems: 'id, type, category',
      rewardItems: 'id',
      records: 'id, childId, timestamp, scoreCategory',
      messages: 'id, fromChildId, isRead, timestamp',
      goalRewards: 'id, childId, status, startDate, endDate, createdAt',
      discountCards: 'id, childId, goalId, issuedAt, usedAt',
    }).upgrade(async (tx) => {
      const scoreItemsTable = tx.table<ScoreItem, string>('scoreItems');
      const rewardItemsTable = tx.table<RewardItem, string>('rewardItems');
      const recordsTable = tx.table<ScoreRecord, string>('records');

      await scoreItemsTable.toCollection().modify((item) => {
        item.category = inferScoreItemCategory(item);
      });

      const scoreItems = (await scoreItemsTable.toArray()).map(normalizeScoreItem);
      const rewardIds = new Set((await rewardItemsTable.toArray()).map((item) => item.id));
      const scoreItemMap = new Map(scoreItems.map((item) => [item.id, item]));

      await recordsTable.toCollection().modify((record) => {
        record.scoreCategory = normalizeScoreRecord(record, scoreItemMap, rewardIds).scoreCategory;
      });
    });

    // 版本 3：新增獎勵卡與集點卡
    this.version(3).stores({
      users: 'id, role',
      scoreItems: 'id, type, category',
      rewardItems: 'id',
      records: 'id, childId, timestamp, scoreCategory',
      messages: 'id, fromChildId, isRead, timestamp',
      goalRewards: 'id, childId, status, startDate, endDate, createdAt',
      discountCards: 'id, childId, goalId, issuedAt, usedAt',
      rewardCards: 'id, childId, status, issuedAt',
      stampCards: 'id, childId, status, createdAt',
    });
  }
}

// 單例模式：全域資料庫實例
export const db = new FamilyPointsDB();

// =============================================
// 預設資料設定（只需在這裡修改）
// =============================================

/** 預設使用者清單 */
export const INITIAL_USERS: User[] = [
  { id: 'parent_1', name: '爸爸/媽媽', role: UserRole.PARENT, avatar: '👑' },
  { id: 'child_1', name: '丞鈞', role: UserRole.CHILD, avatar: '🧑' },
  { id: 'child_2', name: '佑佑', role: UserRole.CHILD, avatar: '🧒' },
];

/** 預設評分項目清單 */
export const INITIAL_SCORE_ITEMS: ScoreItem[] = [
  { id: 'item_1', label: '做家事', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.DAILY, icon: '🧹' },
  { id: 'item_2', label: '成績優異 (95↑)', points: 10, type: ScoreType.POSITIVE, category: ScoreCategory.ACADEMIC, icon: '💯' },
  { id: 'item_3', label: '成績優異 (90↑)', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.ACADEMIC, icon: '💯' },
  { id: 'item_4', label: '互相幫忙', points: 10, type: ScoreType.POSITIVE, category: ScoreCategory.DAILY, icon: '🤝' },
  { id: 'item_5', label: '複習課業', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.ACADEMIC, icon: '📖' },
  { id: 'item_6', label: '去教會', points: 5, type: ScoreType.POSITIVE, category: ScoreCategory.ACTIVITY, icon: '⛪' },
  { id: 'item_7', label: '未整理書包', points: 5, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '🎒' },
  { id: 'item_8', label: '刻意吵架', points: 10, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '💢' },
  { id: 'item_9', label: '欺負對方', points: 20, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '😈' },
  { id: 'item_10', label: '未收拾環境', points: 5, type: ScoreType.NEGATIVE, category: ScoreCategory.DAILY, icon: '🦠' },
];

/** 預設獎勵項目清單 */
export const INITIAL_REWARD_ITEMS: RewardItem[] = [
  { id: 'reward_1', label: '玩 Switch (30分)', points: 30, icon: '🎮' },
  { id: 'reward_2', label: '看電視 (30分)', points: 30, icon: '📺' },
  { id: 'reward_3', label: '使用電腦 (30分)', points: 15, icon: '💻' },
];

// =============================================

/**
 * 取得預設應用程式狀態
 * 當 IndexedDB 失敗或需要重置時使用
 */
export const getDefaultState = () => {
  const users = INITIAL_USERS.map((user) => ({ ...user }));

  return {
    users,
    scoreItems: INITIAL_SCORE_ITEMS,
    rewardItems: INITIAL_REWARD_ITEMS,
    records: [] as ScoreRecord[],
    messages: [] as SecretMessage[],
    goalRewards: [] as GoalReward[],
    discountCards: [] as DiscountCard[],
    rewardCards: [] as RewardCard[],
    stampCards: [] as StampCard[],
    familyGarden: createInitialFamilyGarden(users),
  };
};

/**
 * 初始化資料庫
 * 如果資料庫是空的，則寫入預設資料
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const userCount = await db.users.count();
    
    if (userCount === 0) {
      console.log('🌱 資料庫初始化：寫入預設資料...');
      
      await db.transaction('rw', [db.users, db.scoreItems, db.rewardItems, db.goalRewards, db.discountCards], async () => {
        await db.users.bulkAdd(INITIAL_USERS);
        await db.scoreItems.bulkAdd(INITIAL_SCORE_ITEMS);
        await db.rewardItems.bulkAdd(INITIAL_REWARD_ITEMS);
      });
      
      console.log('✅ 資料庫初始化完成');
    }
  } catch (err) {
    console.error('❌ 資料庫初始化失敗:', err);
    throw err;
  }
};
