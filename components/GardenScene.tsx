import React from 'react';

/**
 * 花園舞台的背景場景。
 * 每澆一次水就換一個場景，序列以 plantId 為種子，讓每株植物看到的順序都不一樣。
 */
export interface GardenScene {
  id: string;
  /** 顯示在舞台左下角的場景名稱 */
  label: string;
  emoji: string;
  /** 舞台容器的天空底色（CSS background） */
  backdrop: string;
  /** 畫在植物後方的景色，使用 320x300 座標系 */
  Scenery: React.FC;
}

/**
 * 各階段的 viewBox 會裁掉上方，y 小於 110 的東西在種子階段看不到，
 * 因此天空裝飾集中在 y 110~200，地面細節放在 y 250 之後。
 */
const GROUND_PATH = 'M18 264 C68 236 111 250 158 258 C210 267 253 233 304 259 L304 294 H18 Z';

const SunnyScenery: React.FC = () => (
  <g aria-hidden="true">
    <circle cx="258" cy="132" r="24" fill="#F6D96B" opacity="0.22" />
    <g stroke="#D7B83D" strokeWidth="3" strokeLinecap="round" opacity="0.28">
      <path d="M258 96 V86" />
      <path d="M258 178 V168" />
      <path d="M222 132 H212" />
      <path d="M304 132 H294" />
    </g>
    <g fill="#FFFFFF" stroke="#65B7D9" strokeWidth="1.5" opacity="0.72">
      <circle cx="65" cy="126" r="13" />
      <circle cx="81" cy="119" r="18" />
      <circle cx="99" cy="127" r="12" />
      <path d="M53 129 H110 C106 141 58 142 53 129 Z" />
    </g>
    <path d={GROUND_PATH} fill="#DDEDD4" opacity="0.68" />
    <g fill="none" stroke="#75AE62" strokeWidth="3" strokeLinecap="round" opacity="0.55">
      <path d="M53 258 Q49 246 43 240 M53 258 Q58 247 64 242 M53 258 V241" />
      <path d="M271 258 Q267 246 261 241 M271 258 Q277 247 283 243 M271 258 V239" />
    </g>
  </g>
);

const SunsetScenery: React.FC = () => (
  <g aria-hidden="true">
    <circle cx="240" cy="186" r="36" fill="#F8B26A" opacity="0.3" />
    <circle cx="240" cy="186" r="21" fill="#F1994F" opacity="0.5" />
    <g fill="#F7C9A4" opacity="0.75">
      <path d="M38 152 H126 C122 162 42 163 38 152 Z" />
      <path d="M188 130 H262 C258 139 192 140 188 130 Z" />
      <path d="M56 198 H144 C140 207 60 208 56 198 Z" />
    </g>
    <g fill="none" stroke="#B5734A" strokeWidth="2.2" strokeLinecap="round" opacity="0.6">
      <path d="M92 122 q7 -6 13 0 q6 -6 13 0" />
      <path d="M134 142 q6 -5 11 0 q5 -5 11 0" />
    </g>
    <path d={GROUND_PATH} fill="#EADFC6" opacity="0.8" />
    <g fill="none" stroke="#C09A63" strokeWidth="3" strokeLinecap="round" opacity="0.5">
      <path d="M50 258 V240 M50 250 q8 -6 12 -12 M50 248 q-8 -6 -12 -11" />
      <path d="M274 258 V239 M274 250 q9 -6 13 -12" />
    </g>
  </g>
);

const NIGHT_STARS: Array<[number, number, number]> = [
  [52, 128, 3.2], [92, 152, 2.4], [128, 118, 2.8], [172, 166, 2.2],
  [204, 124, 2.6], [72, 188, 2.2], [116, 200, 2.8], [230, 198, 2.4], [36, 162, 2],
];

const NightScenery: React.FC = () => (
  <g aria-hidden="true">
    <circle cx="256" cy="136" r="22" fill="#F9F4D9" stroke="#E4D9A6" strokeWidth="2" />
    <g fill="#EDE3B4" opacity="0.7">
      <circle cx="249" cy="130" r="4.5" />
      <circle cx="262" cy="142" r="3.2" />
      <circle cx="253" cy="147" r="2.4" />
    </g>
    <g fill="#FFFFFF">
      {NIGHT_STARS.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
    <g fill="#F6D96B" opacity="0.85">
      <circle cx="64" cy="222" r="3.2" />
      <circle cx="106" cy="240" r="2.4" />
      <circle cx="244" cy="230" r="2.8" />
    </g>
    <path d={GROUND_PATH} fill="#C9D8CE" opacity="0.72" />
    <g fill="none" stroke="#7C9C86" strokeWidth="3" strokeLinecap="round" opacity="0.55">
      <path d="M53 258 Q49 246 43 240 M53 258 V241" />
      <path d="M271 258 Q277 247 283 243 M271 258 V239" />
    </g>
  </g>
);

const RAINBOW_BANDS: Array<[number, string]> = [
  [126, '#E76F67'], [117, '#F0A24A'], [108, '#F6D96B'], [99, '#64B96A'], [90, '#65B7D9'],
];

const RainbowScenery: React.FC = () => (
  <g aria-hidden="true">
    <g fill="none" strokeWidth="8" strokeLinecap="round" opacity="0.3">
      {RAINBOW_BANDS.map(([radius, color]) => (
        <path key={color} d={`M${160 - radius} 262 A${radius} ${radius} 0 0 1 ${160 + radius} 262`} stroke={color} />
      ))}
    </g>
    <g fill="#FFFFFF" stroke="#8FA9B5" strokeWidth="1.5" opacity="0.8">
      <circle cx="58" cy="132" r="12" />
      <circle cx="74" cy="124" r="17" />
      <circle cx="92" cy="133" r="11" />
      <path d="M46 135 H103 C99 147 51 148 46 135 Z" />
    </g>
    <g stroke="#65B7D9" strokeWidth="2.4" strokeLinecap="round" opacity="0.5">
      <path d="M58 150 L54 164" />
      <path d="M76 152 L72 170" />
      <path d="M94 149 L90 161" />
    </g>
    <path d={GROUND_PATH} fill="#D8E7D6" opacity="0.72" />
    <g fill="#9FD2E5" opacity="0.55">
      <ellipse cx="62" cy="278" rx="22" ry="5" />
      <ellipse cx="256" cy="270" rx="16" ry="4" />
    </g>
  </g>
);

const SeasideScenery: React.FC = () => (
  <g aria-hidden="true">
    <path d="M0 212 H320 V266 H0 Z" fill="#A9DCEC" opacity="0.5" />
    <g fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
      <path d="M24 228 q8 -5 16 0 q8 5 16 0" />
      <path d="M228 236 q8 -5 16 0 q8 5 16 0" />
      <path d="M74 248 q8 -5 16 0 q8 5 16 0" />
    </g>
    <g transform="translate(232 184)">
      <path d="M0 22 H32 L25 31 H7 Z" fill="#F6EEDF" stroke="#B08A5E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 22 V0 L32 20 Z" fill="#FFFFFF" stroke="#65B7D9" strokeWidth="2" strokeLinejoin="round" />
    </g>
    <g fill="none" stroke="#8FA9B5" strokeWidth="2.2" strokeLinecap="round">
      <path d="M56 142 q8 -7 15 0 q7 -7 15 0" />
      <path d="M102 122 q6 -5 11 0 q5 -5 11 0" />
    </g>
    <path d="M0 260 C58 251 120 266 190 259 C240 254 282 263 320 257 L320 300 H0 Z" fill="#F2E3C4" opacity="0.9" />
    <g fill="#F8D5C6" stroke="#D89A86" strokeWidth="1.5">
      <path d="M48 282 a10 10 0 0 1 20 0 Z" />
      <path d="M264 276 a8 8 0 0 1 16 0 Z" />
    </g>
  </g>
);

const MountainScenery: React.FC = () => (
  <g aria-hidden="true">
    <circle cx="250" cy="140" r="19" fill="#F6D96B" opacity="0.28" />
    <path d="M-10 260 L58 172 L114 234 L158 188 L220 260 Z" fill="#C2D6DC" opacity="0.7" />
    <path d="M118 260 L190 176 L248 228 L288 196 L340 260 Z" fill="#A8C3CC" opacity="0.65" />
    <g fill="#FFFFFF" opacity="0.85">
      <path d="M58 172 L43 191 q15 7 30 0 Z" />
      <path d="M190 176 L175 195 q15 7 30 0 Z" />
    </g>
    <g fill="#FFFFFF" opacity="0.45">
      <ellipse cx="96" cy="222" rx="52" ry="7" />
      <ellipse cx="238" cy="212" rx="40" ry="6" />
    </g>
    <g fill="#5A9A55" opacity="0.75">
      <path d="M40 266 L55 224 L70 266 Z" />
      <path d="M46 244 L55 220 L64 244 Z" />
      <path d="M252 266 L265 230 L278 266 Z" />
    </g>
    <path d={GROUND_PATH} fill="#D6E6D2" opacity="0.8" />
  </g>
);

export const GARDEN_SCENES: GardenScene[] = [
  {
    id: 'sunny',
    label: '晴天草地',
    emoji: '☀️',
    backdrop: 'linear-gradient(180deg, #E8F4FA 0%, #EAF2E5 68%)',
    Scenery: SunnyScenery,
  },
  {
    id: 'sunset',
    label: '黃昏',
    emoji: '🌇',
    backdrop: 'linear-gradient(180deg, #FDE7CC 0%, #FBD7BE 46%, #F0E7D5 100%)',
    Scenery: SunsetScenery,
  },
  {
    id: 'night',
    label: '星空',
    emoji: '🌙',
    backdrop: 'linear-gradient(180deg, #D7DEF3 0%, #E2E8F4 52%, #E6EDE3 100%)',
    Scenery: NightScenery,
  },
  {
    id: 'rainbow',
    label: '雨後彩虹',
    emoji: '🌈',
    backdrop: 'linear-gradient(180deg, #DFEBF3 0%, #E8F1E9 100%)',
    Scenery: RainbowScenery,
  },
  {
    id: 'seaside',
    label: '海邊',
    emoji: '🌊',
    backdrop: 'linear-gradient(180deg, #DCF2F8 0%, #CDE9F3 55%, #F5ECD8 100%)',
    Scenery: SeasideScenery,
  },
  {
    id: 'mountain',
    label: '山林',
    emoji: '⛰️',
    backdrop: 'linear-gradient(180deg, #E3F0F6 0%, #EAF1E6 100%)',
    Scenery: MountainScenery,
  },
];

export const getGardenSceneById = (sceneId: string | undefined): GardenScene =>
  GARDEN_SCENES.find((scene) => scene.id === sceneId) ?? GARDEN_SCENES[0];

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 99991;
  }
  return hash;
};

/** 依植物與澆水次數挑場景：同一株每澆一次水就換一幕，不同株的起點也不同 */
export const getGardenScene = (plantId: string, stage: number): GardenScene =>
  GARDEN_SCENES[(hashSeed(plantId) + Math.max(0, stage)) % GARDEN_SCENES.length];
