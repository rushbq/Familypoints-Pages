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
import { RoleSelector } from './RoleSelector';
import { getMockState } from '../services/mockData';
import {
  addGardenPositivePoints,
  startFamilyGardenPlant,
  waterFamilyGarden,
} from '../services/gardenUtils';

/**
 * 開發預覽用的 Dashboard 外殼（僅 import.meta.env.DEV）。
 * 用本地 state 模擬 App.tsx 的資料流，讓沒有 Firebase 登入時也能預覽並互動。
 * 網址加上 ?preview=child、?preview=parent 或 ?preview=roles 即可預覽指定入口。
 */
export const PreviewHarness: React.FC<{ role: string }> = ({ role }) => {
  const [data, setData] = useState<AppState>(() => getMockState());

  if (role === 'roles') {
    return (
      <RoleSelector
        users={data.users}
        onSelectUser={(user) => window.alert(`（預覽模式）進入 ${user.name} 的首頁`)}
        cloudEmail="preview@example.com"
        onCloudLogout={() => window.alert('（預覽模式）切換帳號')}
      />
    );
  }

  const currentUser: User =
    role === 'parent'
      ? data.users.find((u) => u.role === UserRole.PARENT)!
      : data.users.find((u) => u.role === UserRole.CHILD)!;

  const onAddRecord = (record: Omit<ScoreRecord, 'id' | 'timestamp'>): ScoreRecord => {
    const timestamp = Date.now();
    const newRecord: ScoreRecord = { ...record, id: timestamp.toString(), timestamp };
    setData((prev) => ({
      ...prev,
      records: [...prev.records, newRecord],
      familyGarden: newRecord.pointsChange > 0
        ? addGardenPositivePoints(prev.familyGarden, newRecord.childId, newRecord.pointsChange)
        : prev.familyGarden,
    }));
    return newRecord;
  };

  const onWaterGarden = (childId: string) => {
    if (currentUser.role !== UserRole.CHILD || currentUser.id !== childId) return;
    const timestamp = Date.now();
    setData((prev) => {
      const result = waterFamilyGarden(prev.familyGarden, currentUser, timestamp.toString(), timestamp);
      return result.didWater ? { ...prev, familyGarden: result.garden } : prev;
    });
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
      onUpdateRewardItems={(items: RewardItem[]) => setData((p) => ({ ...p, rewardItems: items }))}
      onUpdateGoalRewards={(updater: (items: GoalReward[]) => GoalReward[]) => setData((p) => ({ ...p, goalRewards: updater(p.goalRewards) }))}
      onUpdateDiscountCards={(updater: (items: DiscountCard[]) => DiscountCard[]) => setData((p) => ({ ...p, discountCards: updater(p.discountCards) }))}
      onUpdateRewardCards={(updater: (items: RewardCard[]) => RewardCard[]) => setData((p) => ({ ...p, rewardCards: updater(p.rewardCards) }))}
      onUpdateStampCards={(updater: (items: StampCard[]) => StampCard[]) => setData((p) => ({ ...p, stampCards: updater(p.stampCards) }))}
      onWaterGarden={onWaterGarden}
      onStartGardenPlant={(speciesId: string) => {
        const timestamp = Date.now();
        setData((prev) => ({
          ...prev,
          familyGarden: startFamilyGardenPlant(prev.familyGarden, speciesId, timestamp.toString(), timestamp),
        }));
      }}
      cloudEmail="preview@example.com"
      onCloudLogout={() => window.alert('（預覽模式）切換帳號')}
    />
  );
};
