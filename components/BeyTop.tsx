import React, { useRef } from 'react';
import {
  BeyBitStyle,
  BeyBladeShape,
  BeyColorSet,
  BeyRatchetStyle,
  getBeyPart,
} from '../services/beyData';

type TeamColor = 'purple' | 'orange' | 'cyan' | 'lime' | 'yellow';

interface BeyTopProps {
  /** 隊色；給沒有指定零件的場合（登入頁、導覽列、計分卡）使用。 */
  color?: TeamColor;
  /** 直接指定配色，優先於 color。魔王有自己的色系，不在隊色裡。 */
  colorSet?: BeyColorSet;
  /** 指定三個零件後，陀螺會依零件的外型與配色繪製。 */
  bladeId?: string;
  ratchetId?: string;
  bitId?: string;
  size?: number;
  /**
   * 旋轉狀態。預設 idle：陀螺平常是擺著的，轉動代表「現在有事發生」。
   * launch 是拉繩彈出去的一次性加速後停住，用在登場畫面。
   */
  speed?: 'idle' | 'launch' | 'slow' | 'fast';
  className?: string;
}

const TEAM_PALETTE: Record<TeamColor, BeyColorSet> = {
  purple: { main: '#C44DFF', deep: '#7D1FB0' },
  cyan: { main: '#13FFF3', deep: '#0A9C95' },
  orange: { main: '#FF7A2F', deep: '#A8441A' },
  lime: { main: '#A2FF1F', deep: '#5E9410' },
  yellow: { main: '#FCEE21', deep: '#A89709' },
};

const CORE = '#05080F';
const STEEL = '#2C3B60';

/** 單片刀刃的形狀，畫在 12 點鐘方向後再旋轉複製。 */
const BLADE_PATHS: Record<BeyBladeShape, string> = {
  spear: 'M50 2 L59 20 L50 25 L41 20 Z',
  axe: 'M38 6 L62 6 L58 24 L42 24 Z',
  claw: 'M50 3 L60 14 L56 26 L50 20 L44 26 L40 14 Z',
  wing: 'M50 5 C62 7 66 16 60 25 L50 22 Z',
  drill: 'M50 1 L56 13 L52 13 L56 24 L44 24 L48 13 L44 13 Z',
  saw: 'M43 8 L47 2 L50 8 L53 2 L57 8 L55 23 L45 23 Z',
};

const renderBlades = (shape: BeyBladeShape, count: number, color: BeyColorSet) => {
  const path = BLADE_PATHS[shape];
  return Array.from({ length: count }, (_, index) => {
    const angle = (360 / count) * index;
    return (
      <g key={angle} transform={`rotate(${angle} 50 50)`}>
        <path d={path} fill={index % 2 === 0 ? color.main : color.deep} />
        {/* 標記刃：偶數片刀刃左右對稱，少了這道高光，轉動只會看成邊緣閃爍 */}
        {index === 0 && <path d={path} fill="#FFFFFF" opacity="0.4" />}
      </g>
    );
  });
};

const renderRatchet = (style: BeyRatchetStyle, color: BeyColorSet) => {
  switch (style) {
    case 'dashed':
      return (
        <circle cx="50" cy="50" r="26" fill="none" stroke={color.main} strokeWidth="6" strokeDasharray="6 6" />
      );
    case 'spoke':
      return (
        <>
          <circle cx="50" cy="50" r="26" fill="none" stroke={STEEL} strokeWidth="6" />
          {Array.from({ length: 6 }, (_, index) => (
            <rect
              key={index}
              x="48.5"
              y="24"
              width="3"
              height="12"
              fill={color.main}
              transform={`rotate(${index * 60} 50 50)`}
            />
          ))}
        </>
      );
    case 'double':
      return (
        <>
          <circle cx="50" cy="50" r="29" fill="none" stroke={color.deep} strokeWidth="3" />
          <circle cx="50" cy="50" r="23" fill="none" stroke={color.main} strokeWidth="5" />
        </>
      );
    case 'solid':
    default:
      return <circle cx="50" cy="50" r="26" fill="none" stroke={color.main} strokeWidth="8" />;
  }
};

const renderBit = (style: BeyBitStyle, color: BeyColorSet) => {
  switch (style) {
    case 'ball':
      return (
        <>
          <circle cx="50" cy="50" r="14" fill={color.main} />
          <circle cx="50" cy="50" r="6" fill={CORE} />
        </>
      );
    case 'flat':
      return (
        <>
          <circle cx="50" cy="50" r="14" fill={color.main} />
          <rect x="40" y="46" width="20" height="8" rx="2" fill={CORE} />
        </>
      );
    case 'needle':
      return (
        <>
          <circle cx="50" cy="50" r="14" fill={color.main} />
          <path d="M50 38 L53 50 L50 62 L47 50 Z" fill={CORE} />
        </>
      );
    case 'point':
    default:
      return (
        <>
          <circle cx="50" cy="50" r="14" fill={color.main} />
          <path d="M50 41 L57 52 L50 59 L43 52 Z" fill={CORE} />
        </>
      );
  }
};

/**
 * 原創對戰陀螺圖形：外層刀刃環、中層齒輪、核心軸尖。
 * 給定 bladeId / ratchetId / bitId 時會依零件定義繪製，讓每種組合長得不一樣；
 * 沒給就退回單純的隊色造型。刻意只用幾何結構，不描摹任何既有商品造型。
 */
export const BeyTop: React.FC<BeyTopProps> = ({
  color = 'cyan',
  colorSet,
  bladeId,
  ratchetId,
  bitId,
  size = 72,
  speed = 'idle',
  className = '',
}) => {
  const fallback = colorSet ?? TEAM_PALETTE[color];
  const blade = bladeId ? getBeyPart(bladeId) : null;
  const ratchet = ratchetId ? getBeyPart(ratchetId) : null;
  const bit = bitId ? getBeyPart(bitId) : null;

  const bladeColor = blade?.color ?? fallback;
  const ratchetColor = ratchet?.color ?? { main: STEEL, deep: STEEL };
  const bitColor = bit?.color ?? fallback;

  // 同一個畫面上好幾顆陀螺若同時起跑、同週期，會黏成一片運動場而不是各自的物件。
  // 每個實例自己抽一個亂數，用來錯開相位、週期，以及停著時的靜止角度。
  const seed = useRef(Math.random()).current;

  const spinClass = speed === 'fast' ? 'bey-spin-fast'
    : speed === 'slow' ? 'bey-spin'
    : speed === 'launch' ? 'bey-launch'
    : '';

  const spinStyle: React.CSSProperties | undefined = (() => {
    if (speed === 'slow' || speed === 'fast') {
      const base = speed === 'slow' ? 2.3 : 0.8;
      const spread = speed === 'slow' ? 0.8 : 0.25;
      const duration = base + seed * spread;
      return { animationDuration: `${duration.toFixed(2)}s`, animationDelay: `-${(seed * duration).toFixed(2)}s` };
    }
    // 同一畫面上的幾顆不要同一刻彈出去
    if (speed === 'launch') {
      return { animationDelay: `${(seed * 0.3).toFixed(2)}s` };
    }
    // 停著的時候，有零件的陀螺各停在不同角度，六顆才像六個物件而不是六份拷貝。
    // 沒有零件的是品牌標記（登入頁、導覽列），角度要固定。
    if (speed === 'idle' && blade) {
      return { transform: `rotate(${Math.round(seed * 360)}deg)`, transformOrigin: '50% 50%' };
    }
    return undefined;
  })();

  // 高速旋轉時加一點偏擺，才像受力中的陀螺而不是等速的齒輪
  const wobbleClass = speed === 'fast' ? 'bey-wobble' : '';
  const label = blade ? `${blade.name}陀螺` : '對戰陀螺';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={`${wobbleClass} ${className}`.trim()}
    >
      {/* 旋轉層：刀刃環與齒輪 */}
      <g className={spinClass} style={spinStyle}>
        <circle cx="50" cy="50" r="40" fill="none" stroke={bladeColor.main} strokeWidth="4" />
        <circle cx="50" cy="50" r="40" fill={bladeColor.main} opacity="0.08" />
        {renderBlades(blade?.shape ?? 'spear', blade?.bladeCount ?? 4, bladeColor)}
        {renderRatchet(ratchet?.ratchetStyle ?? 'solid', ratchetColor)}
      </g>

      {/* 固定層：核心與軸尖 */}
      {renderBit(bit?.bitStyle ?? 'point', bitColor)}
    </svg>
  );
};
