import { BeyPartSlot, BeyRarity } from '../types';

/** 刃環的外型；交給 BeyTop 決定刀刃怎麼畫。 */
export type BeyBladeShape = 'spear' | 'axe' | 'claw' | 'wing' | 'drill' | 'saw';

/** 齒輪環的樣式。 */
export type BeyRatchetStyle = 'solid' | 'dashed' | 'spoke' | 'double';

/** 軸尖的樣式。 */
export type BeyBitStyle = 'point' | 'ball' | 'flat' | 'needle';

/** 零件配色，直接餵給 SVG。 */
export interface BeyColorSet {
  main: string;
  deep: string;
}

export interface BeyPartDef {
  id: string;
  slot: BeyPartSlot;
  name: string;
  rarity: BeyRarity;
  /** 三圍：1～5，一顆陀螺的能力是三個零件相加。 */
  attack: number;
  defense: number;
  stamina: number;
  color: BeyColorSet;
  /** 僅 BLADE 使用 */
  shape?: BeyBladeShape;
  /** 僅 BLADE 使用：刀刃數量 */
  bladeCount?: number;
  /** 僅 RATCHET 使用 */
  ratchetStyle?: BeyRatchetStyle;
  /** 僅 BIT 使用 */
  bitStyle?: BeyBitStyle;
}

const CYAN: BeyColorSet = { main: '#13FFF3', deep: '#0A9C95' };
const ORANGE: BeyColorSet = { main: '#FF7A2F', deep: '#A8441A' };
const LIME: BeyColorSet = { main: '#A2FF1F', deep: '#5E9410' };
const YELLOW: BeyColorSet = { main: '#FCEE21', deep: '#A89709' };
const BLUE: BeyColorSet = { main: '#1C93E5', deep: '#0F5E96' };
const RED: BeyColorSet = { main: '#FF4D4D', deep: '#A32B2B' };
const VIOLET: BeyColorSet = { main: '#B57BFF', deep: '#6F3FB8' };
const SILVER: BeyColorSet = { main: '#D7E3F7', deep: '#7D8BA6' };
const CRIMSON: BeyColorSet = { main: '#FF2F6D', deep: '#8E0F33' };
const ABYSS: BeyColorSet = { main: '#7B6CFF', deep: '#3A2E8C' };
const EMBER: BeyColorSet = { main: '#FFB300', deep: '#A86B00' };
const FROST: BeyColorSet = { main: '#8FE9FF', deep: '#2A7F99' };

/** 刃環：決定攻擊力與陀螺的主要外型。 */
const BLADES: BeyPartDef[] = [
  { id: 'blade_spear_cyan', slot: 'BLADE', name: '疾風槍刃', rarity: 'COMMON', attack: 3, defense: 2, stamina: 2, color: CYAN, shape: 'spear', bladeCount: 4 },
  { id: 'blade_axe_orange', slot: 'BLADE', name: '烈焰斧刃', rarity: 'COMMON', attack: 4, defense: 2, stamina: 1, color: ORANGE, shape: 'axe', bladeCount: 3 },
  { id: 'blade_claw_lime', slot: 'BLADE', name: '猛獸爪刃', rarity: 'COMMON', attack: 4, defense: 1, stamina: 2, color: LIME, shape: 'claw', bladeCount: 4 },
  { id: 'blade_wing_blue', slot: 'BLADE', name: '蒼空翼刃', rarity: 'COMMON', attack: 2, defense: 3, stamina: 3, color: BLUE, shape: 'wing', bladeCount: 5 },
  { id: 'blade_saw_silver', slot: 'BLADE', name: '鋸齒旋刃', rarity: 'COMMON', attack: 3, defense: 3, stamina: 1, color: SILVER, shape: 'saw', bladeCount: 6 },
  { id: 'blade_drill_yellow', slot: 'BLADE', name: '黃金鑽刃', rarity: 'COMMON', attack: 3, defense: 1, stamina: 3, color: YELLOW, shape: 'drill', bladeCount: 4 },
  { id: 'blade_spear_red', slot: 'BLADE', name: '赤紅破刃', rarity: 'RARE', attack: 5, defense: 2, stamina: 1, color: RED, shape: 'spear', bladeCount: 3 },
  { id: 'blade_wing_violet', slot: 'BLADE', name: '幻夜翼刃', rarity: 'RARE', attack: 3, defense: 4, stamina: 3, color: VIOLET, shape: 'wing', bladeCount: 6 },
  { id: 'blade_axe_cyan', slot: 'BLADE', name: '極凍巨斧', rarity: 'RARE', attack: 5, defense: 3, stamina: 1, color: CYAN, shape: 'axe', bladeCount: 4 },
  { id: 'blade_claw_yellow', slot: 'BLADE', name: '雷神爪刃', rarity: 'RARE', attack: 4, defense: 2, stamina: 4, color: YELLOW, shape: 'claw', bladeCount: 5 },
];

/** 齒輪：決定防禦力與重心。 */
const RATCHETS: BeyPartDef[] = [
  { id: 'ratchet_solid_silver', slot: 'RATCHET', name: '實心鋼環', rarity: 'COMMON', attack: 1, defense: 4, stamina: 2, color: SILVER, ratchetStyle: 'solid' },
  { id: 'ratchet_dashed_cyan', slot: 'RATCHET', name: '輕量齒環', rarity: 'COMMON', attack: 2, defense: 2, stamina: 3, color: CYAN, ratchetStyle: 'dashed' },
  { id: 'ratchet_spoke_orange', slot: 'RATCHET', name: '六爪支架', rarity: 'COMMON', attack: 3, defense: 2, stamina: 2, color: ORANGE, ratchetStyle: 'spoke' },
  { id: 'ratchet_double_blue', slot: 'RATCHET', name: '雙層緩衝環', rarity: 'COMMON', attack: 1, defense: 3, stamina: 3, color: BLUE, ratchetStyle: 'double' },
  { id: 'ratchet_solid_red', slot: 'RATCHET', name: '重裝鐵壁', rarity: 'RARE', attack: 1, defense: 5, stamina: 3, color: RED, ratchetStyle: 'solid' },
  { id: 'ratchet_spoke_lime', slot: 'RATCHET', name: '狂暴支架', rarity: 'RARE', attack: 4, defense: 3, stamina: 2, color: LIME, ratchetStyle: 'spoke' },
  { id: 'ratchet_double_violet', slot: 'RATCHET', name: '幻影雙環', rarity: 'RARE', attack: 2, defense: 4, stamina: 4, color: VIOLET, ratchetStyle: 'double' },
];

/** 軸尖：決定持久力與轉速。 */
const BITS: BeyPartDef[] = [
  { id: 'bit_point_silver', slot: 'BIT', name: '標準尖軸', rarity: 'COMMON', attack: 2, defense: 2, stamina: 3, color: SILVER, bitStyle: 'point' },
  { id: 'bit_ball_blue', slot: 'BIT', name: '滾球軸', rarity: 'COMMON', attack: 1, defense: 3, stamina: 4, color: BLUE, bitStyle: 'ball' },
  { id: 'bit_flat_orange', slot: 'BIT', name: '平面衝軸', rarity: 'COMMON', attack: 4, defense: 1, stamina: 2, color: ORANGE, bitStyle: 'flat' },
  { id: 'bit_needle_cyan', slot: 'BIT', name: '細針軸', rarity: 'COMMON', attack: 2, defense: 1, stamina: 5, color: CYAN, bitStyle: 'needle' },
  { id: 'bit_flat_red', slot: 'BIT', name: '暴衝平軸', rarity: 'RARE', attack: 5, defense: 1, stamina: 3, color: RED, bitStyle: 'flat' },
  { id: 'bit_ball_lime', slot: 'BIT', name: '永動滾球', rarity: 'RARE', attack: 1, defense: 4, stamina: 5, color: LIME, bitStyle: 'ball' },
  { id: 'bit_needle_yellow', slot: 'BIT', name: '黃金針軸', rarity: 'RARE', attack: 3, defense: 3, stamina: 4, color: YELLOW, bitStyle: 'needle' },
];

/**
 * 魔王專屬零件：12 件，一隻魔王對應一件。
 * 刻意排除在鋼料抽取與里程碑掉落之外（見 beyUtils 的 drawBeyPart / grantBeyPart），
 * 否則「專屬」就不成立。
 */
const BOSS_PARTS: BeyPartDef[] = [
  { id: 'blade_boss_crimson', slot: 'BLADE', name: '血月裂刃', rarity: 'BOSS', attack: 5, defense: 3, stamina: 2, color: CRIMSON, shape: 'claw', bladeCount: 3 },
  { id: 'blade_boss_abyss', slot: 'BLADE', name: '深淵翼刃', rarity: 'BOSS', attack: 4, defense: 5, stamina: 2, color: ABYSS, shape: 'wing', bladeCount: 4 },
  { id: 'blade_boss_ember', slot: 'BLADE', name: '餘燼鑽刃', rarity: 'BOSS', attack: 5, defense: 2, stamina: 4, color: EMBER, shape: 'drill', bladeCount: 5 },
  { id: 'blade_boss_frost', slot: 'BLADE', name: '霜牙鋸刃', rarity: 'BOSS', attack: 4, defense: 4, stamina: 3, color: FROST, shape: 'saw', bladeCount: 6 },

  { id: 'ratchet_boss_crimson', slot: 'RATCHET', name: '血契齒環', rarity: 'BOSS', attack: 4, defense: 4, stamina: 3, color: CRIMSON, ratchetStyle: 'spoke' },
  { id: 'ratchet_boss_abyss', slot: 'RATCHET', name: '虛空三環', rarity: 'BOSS', attack: 2, defense: 5, stamina: 5, color: ABYSS, ratchetStyle: 'double' },
  { id: 'ratchet_boss_ember', slot: 'RATCHET', name: '熔核重環', rarity: 'BOSS', attack: 5, defense: 4, stamina: 2, color: EMBER, ratchetStyle: 'solid' },
  { id: 'ratchet_boss_frost', slot: 'RATCHET', name: '凍結輕環', rarity: 'BOSS', attack: 3, defense: 3, stamina: 5, color: FROST, ratchetStyle: 'dashed' },

  { id: 'bit_boss_crimson', slot: 'BIT', name: '貫穿血軸', rarity: 'BOSS', attack: 5, defense: 2, stamina: 4, color: CRIMSON, bitStyle: 'flat' },
  { id: 'bit_boss_abyss', slot: 'BIT', name: '無盡深軸', rarity: 'BOSS', attack: 2, defense: 4, stamina: 5, color: ABYSS, bitStyle: 'needle' },
  { id: 'bit_boss_ember', slot: 'BIT', name: '炎心滾球', rarity: 'BOSS', attack: 4, defense: 5, stamina: 3, color: EMBER, bitStyle: 'ball' },
  { id: 'bit_boss_frost', slot: 'BIT', name: '絕對零軸', rarity: 'BOSS', attack: 3, defense: 4, stamina: 5, color: FROST, bitStyle: 'point' },
];

/** 全部 36 個零件，共 14 × 11 × 11 = 1694 種組合。 */
export const BEY_PARTS: BeyPartDef[] = [...BLADES, ...RATCHETS, ...BITS, ...BOSS_PARTS];

const PART_MAP = new Map(BEY_PARTS.map((part) => [part.id, part]));

export const getBeyPart = (partId: string): BeyPartDef | null => PART_MAP.get(partId) ?? null;

export const getBeyPartsBySlot = (slot: BeyPartSlot): BeyPartDef[] =>
  BEY_PARTS.filter((part) => part.slot === slot);

export const BEY_SLOT_LABELS: Record<BeyPartSlot, string> = {
  BLADE: '刃環',
  RATCHET: '齒輪',
  BIT: '軸尖',
};

export const BEY_SOURCE_LABELS: Record<string, string> = {
  SCRAP: '鍛造',
  GOAL: '目標達成',
  STAMP: '集點滿卡',
  REWARD_CARD: '獎勵卡',
  BOSS: '擊敗魔王',
};
