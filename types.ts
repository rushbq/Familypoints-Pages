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
 * 評分項目介面 (例如：做家事、吵架)
 */
export interface ScoreItem {
  id: string;
  label: string;
  points: number; // 定義時皆為正數，邏輯層會根據 type 決定加減
  type: ScoreType;
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
}