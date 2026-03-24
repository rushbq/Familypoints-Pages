import Dexie, { Table } from 'dexie';
import {
  DiscountCard,
  GoalReward,
  RewardItem,
  ScoreCategory,
  ScoreItem,
  ScoreRecord,
  ScoreType,
  SecretMessage,
  User,
  UserRole,
} from '../types';
import { inferScoreItemCategory, normalizeScoreItem, normalizeScoreRecord } from './familyUtils';

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
export const getDefaultState = () => ({
  users: INITIAL_USERS,
  scoreItems: INITIAL_SCORE_ITEMS,
  rewardItems: INITIAL_REWARD_ITEMS,
  records: [] as ScoreRecord[],
  messages: [] as SecretMessage[],
  goalRewards: [] as GoalReward[],
  discountCards: [] as DiscountCard[],
});

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

/**
 * 取得資料庫儲存空間使用資訊
 */
export const getStorageInfo = async (): Promise<{
  used: number;
  quota: number;
  percentage: number;
  usedFormatted: string;
  quotaFormatted: string;
}> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;
      
      return {
        used,
        quota,
        percentage,
        usedFormatted: formatBytes(used),
        quotaFormatted: formatBytes(quota)
      };
    }
  } catch (err) {
    console.warn('無法取得儲存空間資訊:', err);
  }
  
  return {
    used: 0,
    quota: 0,
    percentage: 0,
    usedFormatted: '未知',
    quotaFormatted: '未知'
  };
};

/**
 * 格式化位元組數為易讀格式
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 清理過舊的紀錄（保留最近 N 天）
 * @param daysToKeep 保留天數，預設 365 天
 * @returns 刪除的紀錄數量
 */
export const cleanupOldRecords = async (daysToKeep: number = 365): Promise<number> => {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  try {
    const oldRecords = await db.records
      .where('timestamp')
      .below(cutoffTime)
      .toArray();
    
    if (oldRecords.length > 0) {
      await db.records.bulkDelete(oldRecords.map(r => r.id));
      console.log(`🧹 已清理 ${oldRecords.length} 筆超過 ${daysToKeep} 天的紀錄`);
    }
    
    return oldRecords.length;
  } catch (err) {
    console.error('清理舊紀錄失敗:', err);
    return 0;
  }
};

/**
 * 匯出所有資料為 JSON（用於備份）
 */
export const exportAllData = async (): Promise<string> => {
  const [users, scoreItems, rewardItems, records, messages, goalRewards, discountCards] = await Promise.all([
    db.users.toArray(),
    db.scoreItems.toArray(),
    db.rewardItems.toArray(),
    db.records.toArray(),
    db.messages.toArray(),
    db.goalRewards.toArray(),
    db.discountCards.toArray(),
  ]);
  
  return JSON.stringify({
    users,
    scoreItems,
    rewardItems,
    records,
    messages,
    goalRewards,
    discountCards,
    exportedAt: new Date().toISOString(),
    version: '3.0' // IndexedDB 版本標記
  }, null, 2);
};

/**
 * 從 JSON 匯入資料（用於還原）
 */
export const importAllData = async (jsonData: string): Promise<void> => {
  const data = JSON.parse(jsonData);
  
  await db.transaction('rw', [db.users, db.scoreItems, db.rewardItems, db.records, db.messages, db.goalRewards, db.discountCards], async () => {
    await db.users.clear();
    await db.scoreItems.clear();
    await db.rewardItems.clear();
    await db.records.clear();
    await db.messages.clear();
    await db.goalRewards.clear();
    await db.discountCards.clear();
    
    if (data.users?.length) await db.users.bulkAdd(data.users);
    if (data.scoreItems?.length) await db.scoreItems.bulkAdd(data.scoreItems.map((item: ScoreItem) => normalizeScoreItem(item)));
    if (data.rewardItems?.length) await db.rewardItems.bulkAdd(data.rewardItems);
    if (data.records?.length) {
      const scoreItems: ScoreItem[] = (data.scoreItems?.length ? data.scoreItems : INITIAL_SCORE_ITEMS)
        .map((item: ScoreItem) => normalizeScoreItem(item));
      const scoreItemMap = new Map<string, ScoreItem>(scoreItems.map((item: ScoreItem) => [item.id, item]));
      const rewardIds = new Set<string>((data.rewardItems ?? INITIAL_REWARD_ITEMS).map((item: RewardItem) => item.id));
      await db.records.bulkAdd(
        data.records.map((record: ScoreRecord) => normalizeScoreRecord(record, scoreItemMap, rewardIds)),
      );
    }
    if (data.messages?.length) await db.messages.bulkAdd(data.messages);
    if (data.goalRewards?.length) await db.goalRewards.bulkAdd(data.goalRewards);
    if (data.discountCards?.length) await db.discountCards.bulkAdd(data.discountCards);
  });
};
