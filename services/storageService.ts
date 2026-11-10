import { FirestoreError, doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { AppState, ScoreRecord } from '../types';
import {
  db as localDb,
  initializeDatabase,
  getDefaultState,
} from './database';
import { normalizeScoreItem, normalizeScoreRecord, pruneOldRecords } from './familyUtils';
import { normalizeFamilyGarden } from './gardenUtils';
import { normalizeBeyForge } from './beyUtils';
import { normalizeBeyBoss } from './beyBossUtils';
import { auth, firestore } from './firebase';

/** 對狀態的一次修改。必須是純函式：同樣的輸入永遠得到同樣的輸出，因為它可能被重套好幾次。 */
export type StateMutation = (state: AppState) => AppState;

/**
 * 雲端文件裡記錄「最近套用過哪些操作」的欄位，不屬於 AppState。
 * 收到快照時用它判斷本機還沒確認的操作是不是已經寫進雲端了。
 */
const APPLIED_OPS_FIELD = '_ops';
const MAX_APPLIED_OPS = 50;

/** 離線、逾時、衝突這類錯誤，等一下再試就會好；其他錯誤（權限、文件過大）重試也沒用。 */
const RETRYABLE_ERROR_CODES = new Set(['unavailable', 'deadline-exceeded', 'aborted', 'resource-exhausted']);

export const isRetryableSaveError = (error: unknown): boolean =>
  error instanceof FirestoreError && RETRYABLE_ERROR_CODES.has(error.code);

const readAppliedOps = (raw: Record<string, unknown> | undefined): string[] => {
  const ops = raw?.[APPLIED_OPS_FIELD];
  return Array.isArray(ops) ? ops.filter((op): op is string => typeof op === 'string') : [];
};

export const normalizeAppState = (state?: Partial<AppState>): AppState => {
  const defaults = getDefaultState();
  const users = state?.users ?? defaults.users;
  const scoreItems = (state?.scoreItems ?? defaults.scoreItems).map(normalizeScoreItem);
  const rewardItems = state?.rewardItems ?? defaults.rewardItems;
  const rewardIds = new Set(rewardItems.map((item) => item.id));
  const scoreItemMap = new Map(scoreItems.map((item) => [item.id, item]));
  const records = (state?.records ?? defaults.records).map((record) =>
    normalizeScoreRecord(record, scoreItemMap, rewardIds),
  );

  return {
    users,
    scoreItems,
    rewardItems,
    records,
    messages: state?.messages ?? defaults.messages,
    goalRewards: state?.goalRewards ?? defaults.goalRewards,
    discountCards: state?.discountCards ?? defaults.discountCards,
    rewardCards: state?.rewardCards ?? defaults.rewardCards,
    stampCards: state?.stampCards ?? defaults.stampCards,
    familyGarden: normalizeFamilyGarden(state?.familyGarden, users),
    beyForge: normalizeBeyForge(state?.beyForge, users),
    beyBoss: normalizeBeyBoss(state?.beyBoss, users),
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

    const [users, scoreItems, rewardItems, records, messages, goalRewards, discountCards, rewardCards, stampCards] = await Promise.all([
      localDb.users.toArray(),
      localDb.scoreItems.toArray(),
      localDb.rewardItems.toArray(),
      localDb.records.toArray(),
      localDb.messages.toArray(),
      localDb.goalRewards.toArray(),
      localDb.discountCards.toArray(),
      localDb.rewardCards.toArray(),
      localDb.stampCards.toArray(),
    ]);

    return normalizeAppState({
      users,
      scoreItems,
      rewardItems,
      records,
      messages,
      goalRewards,
      discountCards,
      rewardCards,
      stampCards,
    });
  } catch (err) {
    console.warn('⚠️ 無法讀取舊版 IndexedDB，改用預設資料:', err);
    return normalizeAppState();
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

    return normalizeAppState(snapshot.data() as Partial<AppState>);
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
  return normalizeAppState();
};

/**
 * 即時監聽雲端狀態。appliedOps 是雲端已經套用過的操作 id，
 * 讓呼叫端把這些操作從「還沒確認」的清單裡拿掉。
 */
export const subscribeState = (
  onStateChange: (state: AppState, appliedOps: string[]) => void,
  onError?: (error: unknown) => void,
): (() => void) => {
  try {
    const uid = getCurrentUid();

    return onSnapshot(
      getStateRef(uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.data();
          onStateChange(normalizeAppState(raw as Partial<AppState>), readAppliedOps(raw));
          return;
        }

        void bootstrapCloudState(uid)
          .then((state) => onStateChange(state, []))
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
 * 把一次操作套在「雲端最新的狀態」上，用交易寫回。
 *
 * 以前是把本機整份狀態 setDoc 上去，兩台裝置同時操作（或一台離線後才連上）時，
 * 後寫的會整份蓋掉先寫的。改成交易後，每次都是讀雲端最新版、套上這次的修改再寫，
 * 另一台裝置的變更不會被吃掉；同時有人寫入時 Firestore 會自動重跑交易。
 * 交易需要連線，離線時會丟出可重試的錯誤，由呼叫端排隊等連線恢復。
 *
 * 同一個 opId 只會套用一次：交易其實成功、但回應在路上斷掉時，重試不會重複加分。
 * 每次寫入順便把超過保留期限的紀錄併成結餘，文件才不會長到 Firestore 的 1 MiB 上限。
 */
export const commitStateMutation = async (opId: string, mutate: StateMutation): Promise<void> => {
  const ref = getStateRef(getCurrentUid());

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const raw = snapshot.exists() ? snapshot.data() : undefined;
    const appliedOps = readAppliedOps(raw);
    if (appliedOps.includes(opId)) return;

    const current = normalizeAppState(raw as Partial<AppState> | undefined);
    const next = pruneOldRecords(normalizeAppState(mutate(current)), Date.now());
    transaction.set(ref, {
      ...next,
      [APPLIED_OPS_FIELD]: [...appliedOps, opId].slice(-MAX_APPLIED_OPS),
    });
  });
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
