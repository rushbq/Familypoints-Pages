import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { AppState, ScoreRecord } from '../types';
import {
  db as localDb,
  initializeDatabase,
  getStorageInfo as getLocalStorageInfo,
  getDefaultState,
} from './database';
import { auth, firestore } from './firebase';

/**
 * 儲存操作結果介面
 */
export interface SaveResult {
  success: boolean;
  error?: string;
  storageWarning?: boolean; // 儲存空間警告 (超過 80%)
}

const normalizeState = (state?: Partial<AppState>): AppState => {
  const defaults = getDefaultState();

  return {
    users: state?.users ?? defaults.users,
    scoreItems: state?.scoreItems ?? defaults.scoreItems,
    rewardItems: state?.rewardItems ?? defaults.rewardItems,
    records: state?.records ?? defaults.records,
    messages: state?.messages ?? defaults.messages,
  };
};

const getCurrentUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('請先登入 Firebase 雲端帳號');
  }

  return uid;
};

const getStateRef = (uid: string) => doc(firestore, 'userStates', uid);

const loadLocalIndexedDbState = async (): Promise<AppState> => {
  try {
    await initializeDatabase();

    const [users, scoreItems, rewardItems, records, messages] = await Promise.all([
      localDb.users.toArray(),
      localDb.scoreItems.toArray(),
      localDb.rewardItems.toArray(),
      localDb.records.toArray(),
      localDb.messages.toArray(),
    ]);

    return normalizeState({
      users,
      scoreItems,
      rewardItems,
      records,
      messages,
    });
  } catch (err) {
    console.warn('⚠️ 無法讀取舊版 IndexedDB，改用預設資料:', err);
    return normalizeState();
  }
};

const bootstrapCloudState = async (uid: string): Promise<AppState> => {
  const initialState = await loadLocalIndexedDbState();
  await setDoc(getStateRef(uid), initialState);
  return initialState;
};

/**
 * 從 Firestore 載入完整狀態
 */
export const loadState = async (): Promise<AppState> => {
  try {
    const uid = getCurrentUid();
    const snapshot = await getDoc(getStateRef(uid));

    if (!snapshot.exists()) {
      return bootstrapCloudState(uid);
    }

    return normalizeState(snapshot.data() as Partial<AppState>);
  } catch (err) {
    console.error('❌ 載入雲端狀態失敗:', err);
    return loadFallbackState();
  }
};

/**
 * 回退機制：返回預設狀態（雲端載入失敗時使用）
 */
const loadFallbackState = (): AppState => {
  console.warn('⚠️ 雲端資料不可用，使用預設資料');
  return normalizeState();
};

export const subscribeState = (
  onStateChange: (state: AppState) => void,
  onError?: (error: unknown) => void,
): (() => void) => {
  try {
    const uid = getCurrentUid();

    return onSnapshot(
      getStateRef(uid),
      (snapshot) => {
        if (snapshot.exists()) {
          onStateChange(normalizeState(snapshot.data() as Partial<AppState>));
          return;
        }

        void bootstrapCloudState(uid)
          .then(onStateChange)
          .catch((error) => onError?.(error));
      },
      (error) => onError?.(error),
    );
  } catch (error) {
    onError?.(error);
    return () => undefined;
  }
};

/**
 * 將完整狀態儲存至 Firestore
 */
export const saveState = async (state: AppState): Promise<SaveResult> => {
  try {
    const uid = getCurrentUid();
    await setDoc(getStateRef(uid), normalizeState(state));

    return { success: true, storageWarning: false };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '未知錯誤';
    console.error('❌ 儲存雲端狀態失敗:', errorMessage);
    return { success: false, error: errorMessage };
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
  const state = await loadState();
  const records = state.records.filter((record) => record.childId === childId);

  if (days) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    return records.filter((record) => record.timestamp >= cutoffTime);
  }

  return records;
};

/**
 * 取得未讀訊息數量
 */
export const getUnreadMessageCount = async (): Promise<number> => {
  const state = await loadState();
  return state.messages.filter((message) => !message.isRead).length;
};

export const getStorageInfo = async () => {
  const info = await getLocalStorageInfo();

  return {
    ...info,
    usedFormatted: info.usedFormatted === '未知' ? '雲端同步中' : info.usedFormatted,
    quotaFormatted: info.quotaFormatted === '未知' ? '瀏覽器快取' : info.quotaFormatted,
  };
};

export const cleanupOldRecords = async (daysToKeep: number = 365): Promise<number> => {
  const state = await loadState();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  const filteredRecords = state.records.filter((record) => record.timestamp >= cutoffTime);
  const deletedCount = state.records.length - filteredRecords.length;

  if (deletedCount > 0) {
    await saveState({
      ...state,
      records: filteredRecords,
    });
  }

  return deletedCount;
};

export const exportAllData = async (): Promise<string> => {
  const state = await loadState();

  return JSON.stringify(
    {
      ...state,
      exportedAt: new Date().toISOString(),
      version: '3.0-cloud',
    },
    null,
    2,
  );
};

export const importAllData = async (jsonData: string): Promise<void> => {
  const data = JSON.parse(jsonData) as Partial<AppState>;
  await saveState(normalizeState(data));
};
