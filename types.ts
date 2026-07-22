/**
 * 使用者角色定義
 * PARENT: 家長 (擁有設定與管理權限)
 * CHILD: 小孩 (主要累積分數的對象)
 */
export enum UserRole {
  PARENT = 'PARENT',
  CHILD = 'CHILD'
}

/**
 * 使用者資料介面
 */
export interface User {
  id: string;      // 唯一識別碼
  name: string;    // 顯示名稱
  role: UserRole;  // 角色
  avatar: string;  // 頭像 (Emoji)
}

/**
 * 分數類型
 * POSITIVE: 加分行為
 * NEGATIVE: 扣分行為
 */
export enum ScoreType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE'
}

/**
 * 評分類別
 * 1: 學業
 * 2: 活動
 * 3: 日常
 */
export enum ScoreCategory {
  ACADEMIC = 1,
  ACTIVITY = 2,
  DAILY = 3,
}

/**
 * 評分項目介面 (例如：做家事、吵架)
 */
export interface ScoreItem {
  id: string;
  label: string;
  points: number; // 定義時皆為正數，邏輯層會根據 type 決定加減
  type: ScoreType;
  category: ScoreCategory;
  icon?: string;
}

/**
 * 新增：獎勵項目介面 (例如：玩 Switch)
 */
export interface RewardItem {
  id: string;
  label: string;
  points: number; // 兌換所需的點數 (成本)
  icon?: string;
}

/**
 * 分數紀錄介面 (歷史紀錄)
 * 包含加分、扣分以及兌換獎勵的紀錄
 */
export interface ScoreRecord {
  id: string;
  childId: string;
  childName: string;
  itemId: string;
  itemName: string;
  pointsChange: number; // 實際的分數變化 (+10 或 -30)
  scoreCategory?: ScoreCategory | null; // 僅加分 / 扣分紀錄使用
  timestamp: number;    // 發生時間
  note?: string;        // 備註
  createdById: string;  // 建立者 ID
  createdByName: string;// 建立者名稱
}

/**
 * 悄悄話/信件介面
 */
export interface SecretMessage {
  id: string;
  fromChildId: string;
  fromChildName: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export enum GoalRewardStatus {
  ACTIVE = 'ACTIVE',
  ACHIEVED = 'ACHIEVED',
  NOT_ACHIEVED = 'NOT_ACHIEVED',
}

export interface GoalReward {
  id: string;
  childId: string;
  targetText: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: GoalRewardStatus;
  createdAt: number;
  resolvedAt?: number | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
}

export interface DiscountCard {
  id: string;
  childId: string;
  goalId: string;
  issuedAt: number;
  usedAt?: number | null;
  usedById?: string | null;
  usedByName?: string | null;
  usedOnRecordId?: string | null;
}

/**
 * 獎勵卡狀態
 * ACTIVE: 已頒發、尚未兌換
 * REDEEMED: 已兌換
 */
export enum RewardCardStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
}

/**
 * 獎勵卡介面
 * 家長因特殊事蹟（如比賽獲獎）頒發，頒發時即綁定兌換內容。
 * 兌換時「不扣分」，可綁定現有獎勵項目或由家長自訂。
 */
export interface RewardCard {
  id: string;
  childId: string;
  title: string;                 // 頒發原因，例如「美術比賽獎狀」
  rewardType: 'ITEM' | 'CUSTOM'; // ITEM: 綁定現有獎勵；CUSTOM: 家長自訂
  rewardItemId?: string | null;  // rewardType === 'ITEM' 時對應的 RewardItem id
  rewardLabel: string;           // 兌換內容顯示文字（現有獎勵的快照或自訂文字）
  rewardIcon?: string;
  status: RewardCardStatus;
  issuedAt: number;
  issuedById: string;
  issuedByName: string;
  redeemedAt?: number | null;
  redeemedById?: string | null;
  redeemedByName?: string | null;
  redeemedRecordId?: string | null; // 兌換時產生的紀錄 id
}

/**
 * 集點卡狀態
 * ACTIVE: 集點中
 * REDEEMED: 已集滿並兌換
 */
export enum StampCardStatus {
  ACTIVE = 'ACTIVE',
  REDEEMED = 'REDEEMED',
}

/**
 * 集點卡介面
 * 家長手動蓋章的獨立集點系統，與積分完全分離（不加分、不扣分）。
 * 集滿目標章數後可兌換家長指定的實體禮物。
 */
export interface StampCard {
  id: string;
  childId: string;
  title: string;        // 集點卡名稱，例如「暑假閱讀集點」
  targetStamps: number; // 集滿所需章數（例如 5 或 10）
  stamps: number;       // 目前已蓋章數
  rewardLabel: string;  // 集滿可兌換的實體禮物（家長手填）
  rewardIcon?: string;
  status: StampCardStatus;
  createdAt: number;
  redeemedAt?: number | null;
  redeemedById?: string | null;
  redeemedByName?: string | null;
}

/**
 * 家庭花園中，每位孩子的累積進度。
 * earnedPositivePoints 只增加、不因扣分或兌換倒退；usedWaterings 記錄已使用次數。
 */
export interface GardenChildProgress {
  childId: string;
  earnedPositivePoints: number;
  usedWaterings: number;
}

/** 一次由孩子親自完成的澆水事件。 */
export interface GardenWateringEvent {
  id: string;
  childId: string;
  childName: string;
  wateredAt: number;
}

/** 一株植物從種下到開花的完整週期，也是圖鑑的歷史來源。 */
export interface GardenPlantCycle {
  id: string;
  speciesId: string;
  startedAt: number;
  completedAt?: number | null;
  waterings: GardenWateringEvent[];
}

/** 兩個孩子共同使用的家庭花園狀態。 */
export interface FamilyGardenState {
  version: 1;
  pointsPerWatering: number;
  wateringsToBloom: number;
  activePlantId?: string | null;
  childProgress: GardenChildProgress[];
  plants: GardenPlantCycle[];
}

/**
 * 應用程式全域狀態介面
 * 儲存所有資料結構
 */
export interface AppState {
  users: User[];            // 使用者列表
  scoreItems: ScoreItem[];  // 評分項目列表
  rewardItems: RewardItem[];// 獎勵項目列表 (New)
  records: ScoreRecord[];   // 歷史紀錄
  messages: SecretMessage[];// 信件紀錄
  goalRewards: GoalReward[];// 目標獎勵
  discountCards: DiscountCard[];// 打折卡
  rewardCards: RewardCard[];// 獎勵卡
  stampCards: StampCard[];  // 集點卡
  familyGarden: FamilyGardenState;// 家庭共育花園
}
