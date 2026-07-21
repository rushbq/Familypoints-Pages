import React, { useState } from 'react';
import {
  AppState,
  DiscountCard,
  GoalReward,
  RewardCard,
  RewardItem,
  ScoreItem,
  ScoreRecord,
  SecretMessage,
  StampCard,
  User,
  UserRole,
} from '../types';
import { Dashboard } from './Dashboard';
import { getMockState } from '../services/mockData';

/**
 * 開發預覽用的 Dashboard 外殼（僅 import.meta.env.DEV）。
 * 用本地 state 模擬 App.tsx 的資料流，讓沒有 Firebase 登入時也能預覽並互動。
 * 網址加上 ?preview=child 或 ?preview=parent 即可切換角色。
 */
export const PreviewHarness: React.FC<{ role: string }> = ({ role }) => {
  const [data, setData] = useState<AppState>(() => getMockState());

  const currentUser: User =
    role === 'parent'
      ? data.users.find((u) => u.role === UserRole.PARENT)!
      : data.users.find((u) => u.role === UserRole.CHILD)!;

  const onAddRecord = (record: Omit<ScoreRecord, 'id' | 'timestamp'>): ScoreRecord => {
    const newRecord: ScoreRecord = { ...record, id: Date.now().toString(), timestamp: Date.now() };
    setData((prev) => ({ ...prev, records: [...prev.records, newRecord] }));
    return newRecord;
  };

  return (
    <Dashboard
      currentUser={currentUser}
      data={data}
      onLogout={() => window.alert('（預覽模式）登出')}
      onAddRecord={onAddRecord}
      onUpdateItems={(items: ScoreItem[]) => setData((p) => ({ ...p, scoreItems: items }))}
      onSendMessage={(msg: Omit<SecretMessage, 'id' | 'timestamp' | 'isRead'>) =>
        setData((p) => ({ ...p, messages: [...p.messages, { ...msg, id: Date.now().toString(), timestamp: Date.now(), isRead: false }] }))
      }
      onMarkMessageRead={(id: string) =>
        setData((p) => ({ ...p, messages: p.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)) }))
      }
      onUpdateUsers={(users: User[]) => setData((p) => ({ ...p, users }))}
      onImportData={(state: AppState) => setData(state)}
      onUpdateRewardItems={(items: RewardItem[]) => setData((p) => ({ ...p, rewardItems: items }))}
      onUpdateGoalRewards={(updater: (items: GoalReward[]) => GoalReward[]) => setData((p) => ({ ...p, goalRewards: updater(p.goalRewards) }))}
      onUpdateDiscountCards={(updater: (items: DiscountCard[]) => DiscountCard[]) => setData((p) => ({ ...p, discountCards: updater(p.discountCards) }))}
      onUpdateRewardCards={(updater: (items: RewardCard[]) => RewardCard[]) => setData((p) => ({ ...p, rewardCards: updater(p.rewardCards) }))}
      onUpdateStampCards={(updater: (items: StampCard[]) => StampCard[]) => setData((p) => ({ ...p, stampCards: updater(p.stampCards) }))}
      cloudEmail="preview@example.com"
      onCloudLogout={() => window.alert('（預覽模式）切換帳號')}
    />
  );
};
