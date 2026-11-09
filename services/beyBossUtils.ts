import {
  BeyBossAttempt,
  BeyBossEntry,
  BeyBossRound,
  BeyBossState,
  BeyForgeState,
  User,
  UserRole,
} from '../types';
import { BEY_BOSSES, BeyBossDef, getBeyBoss } from './beyBossData';
import { getTodayDateKey } from './familyUtils';
import { getBeyBuilds, getBuildStats } from './beyUtils';

/** 只有週六、週日開戰。平日看得到魔王情報，但打不了。 */
const BATTLE_WEEKDAYS = new Set([0, 6]); // 0 = 週日, 6 = 週六

/** 單人出戰時魔王的減弱倍率。 */
export const WEAKENED_MULTIPLIER = 0.6;

/** 數值落後仍可能贏下一回合的機率，讓弱勢方保有翻盤空間。 */
export const UPSET_CHANCE = 0.2;

const ROUND_STATS: BeyBossRound['stat'][] = ['attack', 'defense', 'stamina'];

export const ROUND_LABELS: Record<BeyBossRound['stat'], string> = {
  attack: '攻擊',
  defense: '防禦',
  stamina: '持久',
};

/**
 * 以本地日期推導 ISO 週次，格式 YYYY-Www。
 * 沒有伺服器，所以「本週是哪隻魔王」必須能由日期算出來。
 */
export const getWeekKey = (date = new Date()): string => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // ISO 週：以星期四所在的年份為準
  const day = (d.getDay() + 6) % 7; // 週一 = 0
  d.setDate(d.getDate() - day + 3);
  const isoYear = d.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
};

/** 本週輪到哪一隻魔王。同一個 weekKey 在任何裝置上都會得到同一隻。 */
export const getBossForWeek = (weekKey: string): BeyBossDef => {
  const [yearPart, weekPart] = weekKey.split('-W');
  const seed = Number(yearPart) * 53 + Number(weekPart);
  return BEY_BOSSES[Math.abs(seed) % BEY_BOSSES.length];
};

export const isBattleDay = (date = new Date()): boolean => BATTLE_WEEKDAYS.has(date.getDay());

/** 距離下一個週六還有幾天；今天就是戰鬥日時回傳 0。 */
export const getDaysUntilBattle = (date = new Date()): number => {
  if (isBattleDay(date)) return 0;
  return (6 - date.getDay() + 7) % 7;
};

export const createInitialBeyBoss = (): BeyBossState => ({ version: 1, entries: [] });

export const normalizeBeyBoss = (
  boss: Partial<BeyBossState> | undefined,
  users: User[],
): BeyBossState => {
  if (!boss?.entries) return createInitialBeyBoss();
  const childIds = new Set(users.filter((user) => user.role === UserRole.CHILD).map((user) => user.id));

  const entries = (boss.entries ?? [])
    .filter((entry): entry is BeyBossEntry => Boolean(entry?.weekKey && getBeyBoss(entry.bossId)))
    .map((entry) => ({
      weekKey: entry.weekKey,
      bossId: entry.bossId,
      lineup: (entry.lineup ?? []).filter((slot) => slot?.childId && childIds.has(slot.childId) && slot.buildId),
      attempts: (entry.attempts ?? []).filter((attempt) => Boolean(attempt?.id && attempt.dateKey)),
      defeatedAt: entry.defeatedAt ?? null,
    }));

  return { version: 1, entries };
};

export const getBossEntry = (state: BeyBossState, weekKey: string): BeyBossEntry | null =>
  state.entries.find((entry) => entry.weekKey === weekKey) ?? null;

/** 取得（必要時建立）本週的紀錄。 */
const ensureEntry = (state: BeyBossState, weekKey: string): { state: BeyBossState; entry: BeyBossEntry } => {
  const existing = getBossEntry(state, weekKey);
  if (existing) return { state, entry: existing };
  const entry: BeyBossEntry = {
    weekKey,
    bossId: getBossForWeek(weekKey).id,
    lineup: [],
    attempts: [],
    defeatedAt: null,
  };
  return { state: { ...state, entries: [entry, ...state.entries] }, entry };
};

export const isBossDefeated = (entry: BeyBossEntry | null): boolean => Boolean(entry?.defeatedAt);

export const hasAttemptedToday = (entry: BeyBossEntry | null, today = getTodayDateKey()): boolean =>
  Boolean(entry?.attempts.some((attempt) => attempt.dateKey === today));

/** 孩子為本週派出哪一顆陀螺。 */
export const getLineupBuildId = (entry: BeyBossEntry | null, childId: string): string | null =>
  entry?.lineup.find((slot) => slot.childId === childId)?.buildId ?? null;

export const setLineup = (
  state: BeyBossState,
  weekKey: string,
  childId: string,
  buildId: string | null,
): BeyBossState => {
  const { state: next, entry } = ensureEntry(state, weekKey);
  const lineup = entry.lineup.filter((slot) => slot.childId !== childId);
  if (buildId) lineup.push({ childId, buildId });

  return {
    ...next,
    entries: next.entries.map((item) => (item.weekKey === weekKey ? { ...item, lineup } : item)),
  };
};

export interface BossTeam {
  attack: number;
  defense: number;
  stamina: number;
  /** 實際派出的人數；1 人就是減弱版。 */
  memberCount: number;
}

/** 隊伍數值 = 所有已派出陀螺的三圍相加，所以再弱的陀螺都是淨貢獻。 */
export const getTeamStats = (
  entry: BeyBossEntry | null,
  forge: BeyForgeState,
): BossTeam => {
  const base = { attack: 0, defense: 0, stamina: 0, memberCount: 0 };
  if (!entry) return base;

  return entry.lineup.reduce((acc, slot) => {
    const build = forge.builds.find((item) => item.id === slot.buildId && item.childId === slot.childId);
    if (!build) return acc;
    const stats = getBuildStats(build.bladeId, build.ratchetId, build.bitId);
    return {
      attack: acc.attack + stats.attack,
      defense: acc.defense + stats.defense,
      stamina: acc.stamina + stats.stamina,
      memberCount: acc.memberCount + 1,
    };
  }, base);
};

/** 單人出戰時魔王打折；回傳這場實際要面對的數值。 */
export const getEffectiveBossStats = (boss: BeyBossDef, weakened: boolean) => ({
  attack: weakened ? Math.round(boss.attack * WEAKENED_MULTIPLIER) : boss.attack,
  defense: weakened ? Math.round(boss.defense * WEAKENED_MULTIPLIER) : boss.defense,
  stamina: weakened ? Math.round(boss.stamina * WEAKENED_MULTIPLIER) : boss.stamina,
});

export type BossAvailability =
  | 'READY'          // 可以打
  | 'NOT_BATTLE_DAY' // 平日
  | 'NO_LINEUP'      // 沒有人派出陀螺
  | 'ALREADY_TODAY'  // 今天打過了
  | 'DEFEATED';      // 本週已擊敗

export const getBossAvailability = (
  entry: BeyBossEntry | null,
  forge: BeyForgeState,
  now = new Date(),
): BossAvailability => {
  if (isBossDefeated(entry)) return 'DEFEATED';
  if (!isBattleDay(now)) return 'NOT_BATTLE_DAY';
  if (getTeamStats(entry, forge).memberCount === 0) return 'NO_LINEUP';
  if (hasAttemptedToday(entry, getTodayDateKey(now))) return 'ALREADY_TODAY';
  return 'READY';
};

/**
 * 三回合，依序比攻擊、防禦、持久。
 * 數值高的一方勝，但有 UPSET_CHANCE 的機率爆冷，讓落後方仍有機會。
 * 先贏兩回合者勝。
 */
export const resolveBattle = (
  team: BossTeam,
  bossStats: { attack: number; defense: number; stamina: number },
  random: () => number = Math.random,
): { rounds: BeyBossRound[]; won: boolean } => {
  const rounds: BeyBossRound[] = ROUND_STATS.map((stat) => {
    const teamValue = team[stat];
    const bossValue = bossStats[stat];
    const favoured = teamValue >= bossValue;
    const upset = random() < UPSET_CHANCE;
    return { stat, teamValue, bossValue, won: upset ? !favoured : favoured, upset };
  });

  return { rounds, won: rounds.filter((round) => round.won).length >= 2 };
};

export interface ChallengeResult {
  state: BeyBossState;
  attempt: BeyBossAttempt | null;
  /** 打贏完整版才給專屬零件。 */
  rewardPartId: string | null;
  /** 打贏減弱版的安慰獎：一個一般稀有零件。 */
  grantRare: boolean;
}

export const challengeBoss = (
  state: BeyBossState,
  forge: BeyForgeState,
  weekKey: string,
  attemptId: string,
  timestamp: number,
  random: () => number = Math.random,
  now = new Date(),
): ChallengeResult => {
  const entry = getBossEntry(state, weekKey);
  if (getBossAvailability(entry, forge, now) !== 'READY' || !entry) {
    return { state, attempt: null, rewardPartId: null, grantRare: false };
  }

  const boss = getBeyBoss(entry.bossId);
  if (!boss) return { state, attempt: null, rewardPartId: null, grantRare: false };

  const team = getTeamStats(entry, forge);
  const weakened = team.memberCount < 2;
  const { rounds, won } = resolveBattle(team, getEffectiveBossStats(boss, weakened), random);

  const attempt: BeyBossAttempt = {
    id: attemptId,
    attemptedAt: timestamp,
    dateKey: getTodayDateKey(now),
    weakened,
    rounds,
    won,
  };

  // 只有「兩人都派出、打贏完整版」才算本週通關。
  // 單人打贏減弱版刻意不鎖住本週，否則先出手的孩子會替另一個人
  // 把專屬零件的機會用掉——那正是這個功能要避免的衝突。
  const clearedForWeek = won && !weakened;

  return {
    state: {
      ...state,
      entries: state.entries.map((item) => (item.weekKey === weekKey
        ? {
          ...item,
          attempts: [...item.attempts, attempt],
          defeatedAt: clearedForWeek ? timestamp : item.defeatedAt ?? null,
        }
        : item)),
    },
    attempt,
    rewardPartId: clearedForWeek ? boss.rewardPartId : null,
    grantRare: won && weakened,
  };
};

/** 本週可派出的陀螺清單。 */
export const getSelectableBuilds = (forge: BeyForgeState, childId: string) =>
  getBeyBuilds(forge, childId);
