import { AppState, ScoreRecord } from '../types';
import { db, initializeDatabase, getStorageInfo, cleanupOldRecords, exportAllData, importAllData, getDefaultState } from './database';

// 重新匯出資料庫相關函式，方便其他模組使用
export { getStorageInfo, cleanupOldRecords, exportAllData, importAllData, getDefaultState };

/**
 * 儲存操作結果介面
 */
export interface SaveResult {
  success: boolean;
  error?: string;
  storageWarning?: boolean; // 儲存空間警告 (超過 80%)
}

/**
 * 從 IndexedDB 載入完整狀態
 */
export const loadState = async (): Promise<AppState> => {
  try {
    // 初始化資料庫（若為空則寫入預設值）
    await initializeDatabase();
    
    // 從 IndexedDB 讀取所有資料
    const [users, scoreItems, rewardItems, records, messages] = await Promise.all([
      db.users.toArray(),
      db.scoreItems.toArray(),
      db.rewardItems.toArray(),
      db.records.toArray(),
      db.messages.toArray()
    ]);
    
    return {
      users,
      scoreItems,
      rewardItems,
      records,
      messages
    };
  } catch (err) {
    console.error('❌ 載入狀態失敗:', err);
    
    // 返回預設狀態
    return loadFallbackState();
  }
};

/**
 * 回退機制：返回預設狀態（IndexedDB 失敗時使用）
 */
const loadFallbackState = (): AppState => {
  console.warn('⚠️ IndexedDB 不可用，使用預設資料');
  return getDefaultState();
};

/**
 * 將完整狀態儲存至 IndexedDB
 * 包含錯誤處理和儲存空間監控
 */
export const saveState = async (state: AppState): Promise<SaveResult> => {
  try {
    await db.transaction('rw', [db.users, db.scoreItems, db.rewardItems, db.records, db.messages], async () => {
      // 更新 users
      await db.users.clear();
      if (state.users.length) await db.users.bulkAdd(state.users);
      
      // 更新 scoreItems
      await db.scoreItems.clear();
      if (state.scoreItems.length) await db.scoreItems.bulkAdd(state.scoreItems);
      
      // 更新 rewardItems
      await db.rewardItems.clear();
      if (state.rewardItems.length) await db.rewardItems.bulkAdd(state.rewardItems);
      
      // 更新 records
      await db.records.clear();
      if (state.records.length) await db.records.bulkAdd(state.records);
      
      // 更新 messages
      await db.messages.clear();
      if (state.messages.length) await db.messages.bulkAdd(state.messages);
    });
    
    // 檢查儲存空間
    const storageInfo = await getStorageInfo();
    const storageWarning = storageInfo.percentage > 80;
    
    if (storageWarning) {
      console.warn(`⚠️ 儲存空間使用率較高: ${storageInfo.percentage.toFixed(1)}%`);
    }
    
    return { success: true, storageWarning };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知錯誤';
    console.error('❌ 儲存狀態失敗:', errorMessage);
    
    // 嘗試使用 LocalStorage 作為備援
    try {
      localStorage.setItem('family_points_db_v1', JSON.stringify(state));
      console.log('⚠️ 已使用 LocalStorage 備援儲存');
      return { success: true, error: '使用備援儲存' };
    } catch (fallbackErr) {
      return { success: false, error: errorMessage };
    }
  }
};

/**
 * 計算特定小孩的總積分
 */
export const calculateScore = (childId: string, records: ScoreRecord[]): number => {
  return records
    .filter(r => r.childId === childId)
    .reduce((acc, curr) => acc + curr.pointsChange, 0);
};

/**
 * 取得特定小孩的紀錄（可選時間範圍）
 */
export const getRecordsByChild = async (childId: string, days?: number): Promise<ScoreRecord[]> => {
  let query = db.records.where('childId').equals(childId);
  
  if (days) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const records = await query.toArray();
    return records.filter(r => r.timestamp >= cutoffTime);
  }
  
  return query.toArray();
};

/**
 * 取得未讀訊息數量
 */
export const getUnreadMessageCount = async (): Promise<number> => {
  return db.messages.where('isRead').equals(0).count();
};
