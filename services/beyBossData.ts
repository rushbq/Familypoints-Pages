import { BeyColorSet } from './beyData';

export interface BeyBossDef {
  id: string;
  name: string;
  /** 一句話的登場介紹，讓每隻魔王有自己的個性。 */
  tagline: string;
  /** 三圍；隊伍是兩顆陀螺的三圍相加，所以這裡的數字比單顆陀螺大一截。 */
  attack: number;
  defense: number;
  stamina: number;
  color: BeyColorSet;
  /** 打贏才拿得到的專屬零件（beyData 裡 rarity 為 BOSS 的那 12 件）。 */
  rewardPartId: string;
}

const CRIMSON: BeyColorSet = { main: '#FF2F6D', deep: '#8E0F33' };
const ABYSS: BeyColorSet = { main: '#7B6CFF', deep: '#3A2E8C' };
const EMBER: BeyColorSet = { main: '#FFB300', deep: '#A86B00' };
const FROST: BeyColorSet = { main: '#8FE9FF', deep: '#2A7F99' };

/**
 * 12 隻魔王，每週輪一隻，約一季不重複。
 * 三圍刻意各有偏向：有的純攻、有的龜防、有的耐久，
 * 這樣孩子平日看得出「這週要補哪一項」，而不是無腦堆總分。
 */
export const BEY_BOSSES: BeyBossDef[] = [
  {
    id: 'boss_crimson_fang',
    name: '血牙',
    tagline: '一上場就衝，防禦很差，但你擋不住第一擊。',
    attack: 22, defense: 9, stamina: 11,
    color: CRIMSON,
    rewardPartId: 'blade_boss_crimson',
  },
  {
    id: 'boss_abyss_wall',
    name: '深淵壁',
    tagline: '它不攻擊，它只是站在那裡，站到你轉不動為止。',
    attack: 8, defense: 22, stamina: 14,
    color: ABYSS,
    rewardPartId: 'ratchet_boss_abyss',
  },
  {
    id: 'boss_ember_core',
    name: '熔核',
    tagline: '越打越熱，耐久是它的武器。',
    attack: 14, defense: 12, stamina: 20,
    color: EMBER,
    rewardPartId: 'bit_boss_ember',
  },
  {
    id: 'boss_frost_edge',
    name: '霜刃',
    tagline: '安靜、精準，三項都不弱。',
    attack: 15, defense: 15, stamina: 15,
    color: FROST,
    rewardPartId: 'blade_boss_frost',
  },
  {
    id: 'boss_crimson_tyrant',
    name: '赤紅暴君',
    tagline: '攻擊與防禦都很硬，但跑不久。',
    attack: 20, defense: 18, stamina: 7,
    color: CRIMSON,
    rewardPartId: 'ratchet_boss_crimson',
  },
  {
    id: 'boss_abyss_echo',
    name: '虛空回聲',
    tagline: '打得到它，但它一直轉一直轉。',
    attack: 10, defense: 14, stamina: 21,
    color: ABYSS,
    rewardPartId: 'bit_boss_abyss',
  },
  {
    id: 'boss_ember_hammer',
    name: '餘燼鎚',
    tagline: '慢，但每一下都很重。',
    attack: 21, defense: 13, stamina: 10,
    color: EMBER,
    rewardPartId: 'blade_boss_ember',
  },
  {
    id: 'boss_frost_shell',
    name: '凍殼',
    tagline: '外殼結冰，攻擊幾乎全被彈開。',
    attack: 9, defense: 21, stamina: 13,
    color: FROST,
    rewardPartId: 'ratchet_boss_frost',
  },
  {
    id: 'boss_crimson_storm',
    name: '血色風暴',
    tagline: '攻擊和耐久兼具，防禦是它唯一的破綻。',
    attack: 19, defense: 8, stamina: 19,
    color: CRIMSON,
    rewardPartId: 'bit_boss_crimson',
  },
  {
    id: 'boss_abyss_crown',
    name: '深淵冠冕',
    tagline: '三項都在水準之上，沒有明顯弱點。',
    attack: 16, defense: 17, stamina: 16,
    color: ABYSS,
    rewardPartId: 'blade_boss_abyss',
  },
  {
    id: 'boss_ember_forge',
    name: '鍛爐之主',
    tagline: '它也是個鍛造師，而且比你早開始很久。',
    attack: 18, defense: 16, stamina: 14,
    color: EMBER,
    rewardPartId: 'ratchet_boss_ember',
  },
  {
    id: 'boss_frost_zero',
    name: '絕對零度',
    tagline: '本季最難的一隻。三項都很高，只能靠合作。',
    attack: 19, defense: 19, stamina: 19,
    color: FROST,
    rewardPartId: 'bit_boss_frost',
  },
];

const BOSS_MAP = new Map(BEY_BOSSES.map((boss) => [boss.id, boss]));

export const getBeyBoss = (bossId: string): BeyBossDef | null => BOSS_MAP.get(bossId) ?? null;
