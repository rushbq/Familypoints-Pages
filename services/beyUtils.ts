import {
  BeyBuild,
  BeyChildProgress,
  BeyForgeState,
  BeyOwnedPart,
  BeyPartSlot,
  BeyPartSource,
  User,
  UserRole,
} from '../types';
import { BEY_PARTS, BeyPartDef, getBeyPart } from './beyData';

/** 累積多少鋼料可以鍛造一次。刻意比花園的 20 點高，讓花園維持主線。 */
export const DEFAULT_SCRAP_PER_DRAW = 25;

/** 抽到已擁有的零件時，退還的鋼料，避免白抽。 */
export const DUPLICATE_SCRAP_REFUND = 10;

const toNonNegativeInteger = (value: unknown): number => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const createChildProgress = (childId: string): BeyChildProgress => ({
  childId,
  earnedScrap: 0,
  usedScrap: 0,
});

export const createInitialBeyForge = (users: User[]): BeyForgeState => ({
  version: 1,
  scrapPerDraw: DEFAULT_SCRAP_PER_DRAW,
  childProgress: users
    .filter((user) => user.role === UserRole.CHILD)
    .map((child) => createChildProgress(child.id)),
  parts: [],
  builds: [],
});

/**
 * 把雲端／舊版資料補成完整結構。
 * 新加入的孩子會自動補一筆進度，失效的零件與陀螺會被丟掉。
 */
export const normalizeBeyForge = (
  forge: Partial<BeyForgeState> | undefined,
  users: User[],
): BeyForgeState => {
  const childIds = new Set(users.filter((user) => user.role === UserRole.CHILD).map((user) => user.id));
  const base = createInitialBeyForge(users);
  if (!forge) return base;

  const progressById = new Map<string, BeyChildProgress>();
  (forge.childProgress ?? []).forEach((progress) => {
    if (!progress?.childId || !childIds.has(progress.childId)) return;
    progressById.set(progress.childId, {
      childId: progress.childId,
      earnedScrap: toNonNegativeInteger(progress.earnedScrap),
      usedScrap: toNonNegativeInteger(progress.usedScrap),
    });
  });
  childIds.forEach((childId) => {
    if (!progressById.has(childId)) progressById.set(childId, createChildProgress(childId));
  });

  const parts = (forge.parts ?? []).filter((part): part is BeyOwnedPart => Boolean(
    part?.id && part.childId && childIds.has(part.childId) && getBeyPart(part.partId),
  ));

  const ownedPartIds = new Set(parts.map((part) => `${part.childId}|${part.partId}`));
  const builds = (forge.builds ?? []).filter((build): build is BeyBuild => Boolean(
    build?.id
    && build.childId
    && childIds.has(build.childId)
    && ownedPartIds.has(`${build.childId}|${build.bladeId}`)
    && ownedPartIds.has(`${build.childId}|${build.ratchetId}`)
    && ownedPartIds.has(`${build.childId}|${build.bitId}`),
  ));

  return {
    version: 1,
    scrapPerDraw: toNonNegativeInteger(forge.scrapPerDraw) || DEFAULT_SCRAP_PER_DRAW,
    childProgress: Array.from(progressById.values()),
    parts,
    builds,
  };
};

export const getBeyChildProgress = (forge: BeyForgeState, childId: string): BeyChildProgress =>
  forge.childProgress.find((progress) => progress.childId === childId) ?? createChildProgress(childId);

/** 還沒用掉的鍛造次數。 */
export const getAvailableBeyDraws = (forge: BeyForgeState, childId: string): number => {
  const progress = getBeyChildProgress(forge, childId);
  const earned = Math.floor(progress.earnedScrap / forge.scrapPerDraw);
  return Math.max(0, earned - progress.usedScrap);
};

/** 距離下一次鍛造還差多少鋼料。 */
export const getScrapTowardNextDraw = (forge: BeyForgeState, childId: string): number =>
  getBeyChildProgress(forge, childId).earnedScrap % forge.scrapPerDraw;

export const getScrapUntilNextDraw = (forge: BeyForgeState, childId: string): number =>
  forge.scrapPerDraw - getScrapTowardNextDraw(forge, childId);

/** 家長加正分時累積鋼料。和花園的陽光各走各的，不互相消耗。 */
export const addBeyScrap = (
  forge: BeyForgeState,
  childId: string,
  points: number,
): BeyForgeState => {
  const safePoints = toNonNegativeInteger(points);
  if (safePoints === 0) return forge;

  const exists = forge.childProgress.some((progress) => progress.childId === childId);
  const childProgress = exists
    ? forge.childProgress.map((progress) => (progress.childId === childId
      ? { ...progress, earnedScrap: progress.earnedScrap + safePoints }
      : progress))
    : [...forge.childProgress, { ...createChildProgress(childId), earnedScrap: safePoints }];

  return { ...forge, childProgress };
};

export const getOwnedParts = (forge: BeyForgeState, childId: string): BeyOwnedPart[] =>
  forge.parts.filter((part) => part.childId === childId);

export const ownsPart = (forge: BeyForgeState, childId: string, partId: string): boolean =>
  forge.parts.some((part) => part.childId === childId && part.partId === partId);

export const getOwnedPartDefs = (
  forge: BeyForgeState,
  childId: string,
  slot: BeyPartSlot,
): BeyPartDef[] => {
  const owned = new Set(getOwnedParts(forge, childId).map((part) => part.partId));
  return BEY_PARTS.filter((part) => part.slot === slot && owned.has(part.id));
};

/** 一顆陀螺的能力：三個零件的三圍相加。 */
export interface BeyStats {
  attack: number;
  defense: number;
  stamina: number;
  total: number;
}

export const getBuildStats = (
  bladeId: string,
  ratchetId: string,
  bitId: string,
): BeyStats => {
  const defs = [getBeyPart(bladeId), getBeyPart(ratchetId), getBeyPart(bitId)];
  const stats = defs.reduce(
    (acc, def) => ({
      attack: acc.attack + (def?.attack ?? 0),
      defense: acc.defense + (def?.defense ?? 0),
      stamina: acc.stamina + (def?.stamina ?? 0),
    }),
    { attack: 0, defense: 0, stamina: 0 },
  );
  return { ...stats, total: stats.attack + stats.defense + stats.stamina };
};

export interface DrawPartResult {
  forge: BeyForgeState;
  /** 這次抽到的零件；沒有鍛造次數時為 null。 */
  partId: string | null;
  /** 是否為重複零件（重複時會退鋼料而不是入庫）。 */
  isDuplicate: boolean;
}

/**
 * 用掉一次鍛造次數，抽一個普通零件。
 * 抽到已擁有的零件時不入庫，改退 DUPLICATE_SCRAP_REFUND 鋼料。
 */
export const drawBeyPart = (
  forge: BeyForgeState,
  childId: string,
  partInstanceId: string,
  timestamp: number,
  random: () => number = Math.random,
): DrawPartResult => {
  if (getAvailableBeyDraws(forge, childId) <= 0) {
    return { forge, partId: null, isDuplicate: false };
  }

  const pool = BEY_PARTS.filter((part) => part.rarity === 'COMMON');
  const picked = pool[Math.floor(random() * pool.length)] ?? pool[0];
  const duplicate = ownsPart(forge, childId, picked.id);

  const childProgress = forge.childProgress.map((progress) => (progress.childId === childId
    ? {
      ...progress,
      usedScrap: progress.usedScrap + 1,
      earnedScrap: progress.earnedScrap + (duplicate ? DUPLICATE_SCRAP_REFUND : 0),
    }
    : progress));

  return {
    forge: {
      ...forge,
      childProgress,
      parts: duplicate
        ? forge.parts
        : [...forge.parts, { id: partInstanceId, childId, partId: picked.id, obtainedAt: timestamp, source: 'SCRAP' }],
    },
    partId: picked.id,
    isDuplicate: duplicate,
  };
};

/**
 * 里程碑掉落：從還沒擁有的稀有零件裡給一個。
 * 稀有零件全部收齊後改給普通零件，收齊全部則不給。
 */
export const grantBeyPart = (
  forge: BeyForgeState,
  childId: string,
  source: BeyPartSource,
  partInstanceId: string,
  timestamp: number,
  random: () => number = Math.random,
): { forge: BeyForgeState; partId: string | null } => {
  // 魔王專屬零件只能靠打贏魔王取得，不進里程碑池。
  const missing = BEY_PARTS.filter((part) => (
    part.rarity !== 'BOSS' && !ownsPart(forge, childId, part.id)
  ));
  const rarePool = missing.filter((part) => part.rarity === 'RARE');
  const pool = rarePool.length > 0 ? rarePool : missing;
  if (pool.length === 0) return { forge, partId: null };

  const picked = pool[Math.floor(random() * pool.length)] ?? pool[0];
  return {
    forge: {
      ...forge,
      parts: [...forge.parts, { id: partInstanceId, childId, partId: picked.id, obtainedAt: timestamp, source }],
    },
    partId: picked.id,
  };
};

/** 組裝一顆陀螺。三個零件都必須是這個孩子擁有的。 */
/** 直接給予指定零件（魔王獎勵用）。已擁有則不重複給。 */
export const awardSpecificPart = (
  forge: BeyForgeState,
  childId: string,
  partId: string,
  partInstanceId: string,
  timestamp: number,
): BeyForgeState => {
  if (!getBeyPart(partId) || ownsPart(forge, childId, partId)) return forge;
  return {
    ...forge,
    parts: [...forge.parts, { id: partInstanceId, childId, partId, obtainedAt: timestamp, source: 'BOSS' }],
  };
};

export const assembleBey = (
  forge: BeyForgeState,
  childId: string,
  name: string,
  bladeId: string,
  ratchetId: string,
  bitId: string,
  buildId: string,
  timestamp: number,
): BeyForgeState => {
  const valid = [bladeId, ratchetId, bitId].every((partId) => ownsPart(forge, childId, partId));
  if (!valid) return forge;

  const trimmed = name.trim() || '無名陀螺';
  return {
    ...forge,
    builds: [
      { id: buildId, childId, name: trimmed, bladeId, ratchetId, bitId, assembledAt: timestamp },
      ...forge.builds,
    ],
  };
};

export const removeBeyBuild = (forge: BeyForgeState, buildId: string): BeyForgeState => ({
  ...forge,
  builds: forge.builds.filter((build) => build.id !== buildId),
});

export const getBeyBuilds = (forge: BeyForgeState, childId: string): BeyBuild[] =>
  forge.builds.filter((build) => build.childId === childId);

/** 零件收集完成度，給圖鑑顯示。 */
export const getBeyCollectionProgress = (forge: BeyForgeState, childId: string) => ({
  owned: getOwnedParts(forge, childId).length,
  total: BEY_PARTS.length,
});
