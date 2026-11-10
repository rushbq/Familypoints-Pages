import React, { useState } from 'react';
import {
  AppState,
  DiscountCard,
  GoalReward,
  ScoreCategory,
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
import {
  addBeyScrap,
  assembleBey,
  awardSpecificPart,
  drawBeyPart,
  getBeyBuilds,
  removeBeyBuild,
} from '../services/beyUtils';
import {
  awardBossRewards,
  challengeBoss,
  getBossEntry,
  getEffectiveBossStats,
  getTeamStats,
  getWeekKey,
  setLineup,
} from '../services/beyBossUtils';
import { getBeyBoss } from '../services/beyBossData';
import { daysUntilRealSaturday, getDevDayOffset, setDevDayOffset } from '../services/devClock';
import { BattleOutcome, DevTestPanel } from './DevTestPanel';

const ROUND_ORDER = ['attack', 'defense', 'stamina'] as const;

/**
 * 依指定結果產生魔王戰用的亂數。resolveBattle 每回合抽一次：
 * 小於 UPSET_CHANCE 就爆冷。要必勝，就在我方落後的回合爆冷、領先的回合不爆冷；必敗反過來。
 */
const makeBattleRandom = (data: AppState, outcome: BattleOutcome): (() => number) => {
  if (outcome === 'random') return Math.random;
  const entry = getBossEntry(data.beyBoss, getWeekKey());
  const def = entry ? getBeyBoss(entry.bossId) : null;
  if (!def) return Math.random;
  const team = getTeamStats(entry, data.beyForge);
  const boss = getEffectiveBossStats(def, team.memberCount < 2);
  let round = 0;
  return () => {
    const stat = ROUND_ORDER[round % ROUND_ORDER.length];
    round += 1;
    const favoured = team[stat] >= boss[stat];
    return favoured === (outcome === 'win') ? 0.99 : 0;
  };
};

/**
 * 開發預覽用的 Dashboard 外殼（僅 import.meta.env.DEV）。
 * 用本地 state 模擬 App.tsx 的資料流，讓沒有 Firebase 登入時也能預覽並互動。
 * 網址加上 ?preview=child、?preview=parent 或 ?preview=roles 即可預覽指定入口。
 * 畫面左下角的「🧪 測試」是測試模式：切換身分、時光機、加分、指定魔王戰結果。
 */
export const PreviewHarness: React.FC<{ role: string }> = ({ role }) => {
  const [data, setData] = useState<AppState>(() => getMockState());
  const [viewAsId, setViewAsId] = useState<string>(() => {
    const users = getMockState().users;
    return (role === 'parent'
      ? users.find((u) => u.role === UserRole.PARENT)
      : users.find((u) => u.role === UserRole.CHILD))?.id ?? users[0].id;
  });
  const [battleOutcome, setBattleOutcome] = useState<BattleOutcome>('random');
  // 時光機的偏移量存在 devClock 裡；這個 state 只是讓畫面跟著重畫
  const [dayOffset, setDayOffset] = useState(getDevDayOffset());

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

  const currentUser: User = data.users.find((u) => u.id === viewAsId) ?? data.users[0];

  const onAddRecord = (record: Omit<ScoreRecord, 'id' | 'timestamp'>): ScoreRecord => {
    const timestamp = Date.now();
    const newRecord: ScoreRecord = { ...record, id: timestamp.toString(), timestamp };
    setData((prev) => ({
      ...prev,
      records: [...prev.records, newRecord],
      familyGarden: newRecord.pointsChange > 0
        ? addGardenPositivePoints(prev.familyGarden, newRecord.childId, newRecord.pointsChange)
        : prev.familyGarden,
      beyForge: newRecord.pointsChange > 0
        ? addBeyScrap(prev.beyForge, newRecord.childId, newRecord.pointsChange)
        : prev.beyForge,
    }));
    return newRecord;
  };

  // 和 App.tsx 一樣：結果在 setState 外面先算好、亂數先抽好，不從 updater 裡帶出來
  const onDrawBeyPart = (childId: string) => {
    const timestamp = Date.now();
    const roll = Math.random();
    const draw = (forge: AppState['beyForge']) => drawBeyPart(forge, childId, timestamp.toString(), timestamp, () => roll);
    const result = draw(data.beyForge);
    if (!result.partId) return { partId: null, isDuplicate: false };
    setData((prev) => {
      const next = draw(prev.beyForge);
      return next.partId ? { ...prev, beyForge: next.forge } : prev;
    });
    return { partId: result.partId, isDuplicate: result.isDuplicate };
  };

  const onWaterGarden = (childId: string) => {
    if (currentUser.role !== UserRole.CHILD || currentUser.id !== childId) return;
    const timestamp = Date.now();
    setData((prev) => {
      const result = waterFamilyGarden(prev.familyGarden, currentUser, timestamp.toString(), timestamp);
      return result.didWater ? { ...prev, familyGarden: result.garden } : prev;
    });
  };

  const onChallengeBoss = () => {
    const timestamp = Date.now();
    const now = new Date(timestamp);
    const battleRandom = makeBattleRandom(data, battleOutcome);
    const rolls = Array.from({ length: 8 }, () => battleRandom());
    const challenge = (state: AppState) => {
      let index = 0;
      const random = () => rolls[index++ % rolls.length];
      const result = challengeBoss(state.beyBoss, state.beyForge, getWeekKey(now), timestamp.toString(), timestamp, random, now);
      return { result, beyForge: awardBossRewards(state.beyForge, result, timestamp, random) };
    };
    const { result } = challenge(data);
    if (!result.attempt) return null;
    setData((prev) => {
      const next = challenge(prev);
      return next.result.attempt ? { ...prev, beyBoss: next.result.state, beyForge: next.beyForge } : prev;
    });
    return result.attempt;
  };

  // --- 測試模式的操作 ---
  const shiftClock = (days: number) => {
    setDevDayOffset(days);
    setDayOffset(days);
  };

  const addTestPoints = (childId: string, points: number) => {
    const child = data.users.find((u) => u.id === childId);
    onAddRecord({
      childId,
      childName: child?.name ?? '',
      itemId: '__test__',
      itemName: points > 0 ? '測試加分' : '測試扣分',
      pointsChange: points,
      scoreCategory: ScoreCategory.DAILY,
      note: '測試模式',
      createdById: 'test',
      createdByName: '測試模式',
    });
  };

  // 沒有陀螺的孩子先發一組零件組起來，再把每個孩子的第一顆派上場
  const lineupBoth = () => {
    const timestamp = Date.now();
    setData((prev) => {
      let beyForge = prev.beyForge;
      let beyBoss = prev.beyBoss;
      prev.users.filter((u) => u.role === UserRole.CHILD).forEach((child, index) => {
        if (getBeyBuilds(beyForge, child.id).length === 0) {
          const parts = ['blade_wing_blue', 'ratchet_dashed_cyan', 'bit_ball_blue'];
          parts.forEach((partId, p) => {
            beyForge = awardSpecificPart(beyForge, child.id, partId, `${timestamp}_t${index}${p}`, timestamp);
          });
          beyForge = assembleBey(beyForge, child.id, '測試陀螺', parts[0], parts[1], parts[2], `${timestamp}_tb${index}`, timestamp);
        }
        const build = getBeyBuilds(beyForge, child.id)[0];
        if (build) beyBoss = setLineup(beyBoss, getWeekKey(), child.id, build.id);
      });
      return { ...prev, beyForge, beyBoss };
    });
  };

  const resetBossWeek = () => {
    const weekKey = getWeekKey();
    setData((prev) => ({
      ...prev,
      beyBoss: {
        ...prev.beyBoss,
        entries: prev.beyBoss.entries.map((entry) => (entry.weekKey === weekKey
          ? { ...entry, attempts: [], defeatedAt: null }
          : entry)),
      },
    }));
  };

  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}/${now.getDate()}（${'日一二三四五六'[now.getDay()]}）`;

  return (
    <>
    <Dashboard
      key={viewAsId}
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
      onDrawBeyPart={onDrawBeyPart}
      onAssembleBey={(childId: string, name: string, bladeId: string, ratchetId: string, bitId: string) => {
        const timestamp = Date.now();
        setData((prev) => ({
          ...prev,
          beyForge: assembleBey(prev.beyForge, childId, name, bladeId, ratchetId, bitId, timestamp.toString(), timestamp),
        }));
      }}
      onDisassembleBey={(buildId: string) => setData((p) => ({ ...p, beyForge: removeBeyBuild(p.beyForge, buildId) }))}
      onSetBossLineup={(childId: string, buildId: string | null) =>
        setData((p) => ({ ...p, beyBoss: setLineup(p.beyBoss, getWeekKey(), childId, buildId) }))
      }
      onChallengeBoss={onChallengeBoss}
      cloudEmail="preview@example.com"
      onCloudLogout={() => window.alert('（預覽模式）切換帳號')}
    />
    <DevTestPanel
      users={data.users}
      viewAsId={viewAsId}
      onViewAs={setViewAsId}
      dateLabel={dateLabel}
      dayOffset={dayOffset}
      onShiftDays={(days) => shiftClock(dayOffset + days)}
      onJumpToSaturday={() => shiftClock(daysUntilRealSaturday())}
      onResetClock={() => shiftClock(0)}
      onAddPoints={addTestPoints}
      battleOutcome={battleOutcome}
      onBattleOutcome={setBattleOutcome}
      onLineupBoth={lineupBoth}
      onResetBossWeek={resetBossWeek}
      onResetAll={() => setData(getMockState())}
    />
    </>
  );
};
