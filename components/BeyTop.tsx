import React, { useId, useRef } from 'react';
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
  /**
   * boss 換成尖刺星輪與不轉的眼睛。魔王跟孩子的陀螺長一樣時，
   * 只靠顏色分敵我太弱，看久了會覺得魔王也是自己的一顆陀螺。
   */
  variant?: 'bey' | 'boss';
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
const RIVET = '#C9D6EE';

/**
 * 單片刀刃的形狀，畫在 12 點鐘方向後再旋轉複製。
 * 刀尖刻意往順時針方向傾，靜止時也看得出旋轉方向。
 */
const BLADE_PATHS: Record<BeyBladeShape, string> = {
  spear: 'M54 1 L63 16 L57 26 L43 26 L42 15 Z',
  axe: 'M33 11 Q49 -2 70 7 L62 26 L40 26 Z',
  claw: 'M46 2 C62 1 70 11 65 26 L57 20 L51 27 L41 23 Z',
  wing: 'M40 9 C57 -2 76 7 68 26 L46 26 Z',
  drill: 'M51 0 L58 9 L55 10 L62 26 L40 26 L46 10 L43 9 Z',
  saw: 'M37 12 L42 3 L47 9 L52 1 L57 8 L64 3 L62 26 L40 26 Z',
};

/** 魔王外層的尖刺輪；index 0 那根是加長的角。 */
const BOSS_SPIKES_OUTER = 'M50.0 2.0 L60.0 29.3 L81.3 25.1 L72.4 44.9 L89.0 58.9 L68.0 64.3 L67.4 86.0 L50.0 73.0 L32.6 86.0 L32.0 64.3 L11.0 58.9 L27.6 44.9 L18.7 25.1 L40.0 29.3 Z';
/** 內層再疊一圈小的，讓輪廓有厚度。 */
const BOSS_SPIKES_INNER = 'M50.0 16.0 L56.1 37.4 L71.9 32.5 L63.6 46.9 L77.3 56.2 L60.9 58.7 L62.1 75.2 L50.0 64.0 L37.9 75.2 L39.1 58.7 L22.7 56.2 L36.4 46.9 L28.1 32.5 L43.9 37.4 Z';

/** 每個 SVG 自己的 gradient id；同一頁有很多顆陀螺，id 撞到會互相借色。 */
interface Ids {
  sheen: string;
  blade: string;
  disc: string;
  core: string;
  aura: string;
}

const url = (id: string) => `url(#${id})`;

/**
 * 共用定義。全部用 SVG 屬性而不是 Tailwind class：
 * 競技場會把陀螺轉成圖片貼到 Canvas 上，class 在圖片裡不生效。
 */
const renderDefs = (ids: Ids, bladeColor: BeyColorSet, coreColor: BeyColorSet) => (
  <defs>
    {/* 斜向打光：亮面 → 透明 → 暗面，蓋在任何顏色上都有金屬斜角的感覺 */}
    <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0.45">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
      <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
    </linearGradient>
    <linearGradient id={ids.blade} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={bladeColor.main} />
      <stop offset="1" stopColor={bladeColor.deep} />
    </linearGradient>
    <radialGradient id={ids.disc} cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stopColor="#4A5C88" />
      <stop offset="0.6" stopColor="#1C2742" />
      <stop offset="1" stopColor="#0B111F" />
    </radialGradient>
    <radialGradient id={ids.core} cx="0.38" cy="0.32" r="0.8">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
      <stop offset="0.25" stopColor={coreColor.main} />
      <stop offset="1" stopColor={coreColor.deep} />
    </radialGradient>
    <radialGradient id={ids.aura} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.55" stopColor={bladeColor.main} stopOpacity="0.35" />
      <stop offset="1" stopColor={bladeColor.main} stopOpacity="0" />
    </radialGradient>
  </defs>
);

const renderBlades = (shape: BeyBladeShape, count: number, color: BeyColorSet, ids: Ids) => {
  const path = BLADE_PATHS[shape];
  return Array.from({ length: count }, (_, index) => {
    const angle = (360 / count) * index;
    return (
      <g key={angle} transform={`rotate(${angle} 50 50)`}>
        <path d={path} fill={index % 2 === 0 ? url(ids.blade) : color.deep} stroke={CORE} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={path} fill={url(ids.sheen)} />
        {/* 標記刃：偶數片刀刃左右對稱，少了這道高光，轉動只會看成邊緣閃爍 */}
        {index === 0 && <path d={path} fill="#FFFFFF" opacity="0.4" />}
      </g>
    );
  });
};

/** 金屬底盤：刀刃與齒輪之間的那一片，外緣一圈零件色的光邊加上鉚釘。 */
const renderDisc = (color: BeyColorSet, ids: Ids) => (
  <>
    <circle cx="50" cy="50" r="28" fill={url(ids.disc)} stroke={CORE} strokeWidth="1.5" />
    <circle cx="50" cy="50" r="26.6" fill="none" stroke={color.main} strokeWidth="1.2" opacity="0.85" />
    {Array.from({ length: 6 }, (_, index) => {
      const a = (Math.PI / 3) * index + Math.PI / 6;
      return (
        <circle
          key={index}
          cx={(50 + Math.cos(a) * 25).toFixed(2)}
          cy={(50 + Math.sin(a) * 25).toFixed(2)}
          r="1.2"
          fill={RIVET}
          stroke={CORE}
          strokeWidth="0.5"
        />
      );
    })}
  </>
);

/** 齒輪環：每種樣式都帶齒，金屬感來自同一道斜向打光。 */
const renderRatchet = (style: BeyRatchetStyle, color: BeyColorSet, ids: Ids) => {
  const teeth = (count: number, inner: number, outer: number, width: number) =>
    Array.from({ length: count }, (_, index) => (
      <rect
        key={index}
        x={50 - width / 2}
        y={50 - outer}
        width={width}
        height={outer - inner}
        rx="0.6"
        fill={color.main}
        stroke={CORE}
        strokeWidth="0.8"
        transform={`rotate(${(360 / count) * index} 50 50)`}
      />
    ));

  switch (style) {
    case 'dashed':
      return (
        <>
          <circle cx="50" cy="50" r="20" fill="none" stroke={CORE} strokeWidth="8" />
          <circle cx="50" cy="50" r="20" fill="none" stroke={color.main} strokeWidth="5.5" strokeDasharray="6 4.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke={url(ids.sheen)} strokeWidth="5.5" strokeDasharray="6 4.5" />
        </>
      );
    case 'spoke':
      return (
        <>
          <circle cx="50" cy="50" r="21" fill="none" stroke={STEEL} strokeWidth="4" />
          {Array.from({ length: 6 }, (_, index) => (
            <g key={index} transform={`rotate(${index * 60} 50 50)`}>
              <path d="M46.5 26 L53.5 26 L52.3 36 L47.7 36 Z" fill={color.main} stroke={CORE} strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M46.5 26 L53.5 26 L52.3 36 L47.7 36 Z" fill={url(ids.sheen)} />
            </g>
          ))}
        </>
      );
    case 'double':
      return (
        <>
          <circle cx="50" cy="50" r="23" fill="none" stroke={color.deep} strokeWidth="3" />
          <circle cx="50" cy="50" r="23" fill="none" stroke={CORE} strokeWidth="0.8" />
          <circle cx="50" cy="50" r="18.5" fill="none" stroke={color.main} strokeWidth="4" />
          <circle cx="50" cy="50" r="18.5" fill="none" stroke={url(ids.sheen)} strokeWidth="4" />
          {teeth(8, 20.5, 21.8, 2)}
        </>
      );
    case 'solid':
    default:
      return (
        <>
          {teeth(12, 21, 24, 2.8)}
          <circle cx="50" cy="50" r="19.5" fill="none" stroke={CORE} strokeWidth="8" />
          <circle cx="50" cy="50" r="19.5" fill="none" stroke={color.main} strokeWidth="6" />
          <circle cx="50" cy="50" r="19.5" fill="none" stroke={url(ids.sheen)} strokeWidth="6" />
        </>
      );
  }
};

/** 軸心：發亮的寶石核心，加上每種軸尖自己的紋章。 */
const renderBit = (style: BeyBitStyle, color: BeyColorSet, ids: Ids) => {
  const emblem = (() => {
    switch (style) {
      case 'ball':
        return (
          <>
            <circle cx="50" cy="50" r="7" fill={CORE} />
            <circle cx="50" cy="50" r="4.2" fill={color.main} />
          </>
        );
      case 'flat':
        return (
          <>
            <rect x="40" y="46.5" width="20" height="7" rx="2" fill={CORE} />
            <rect x="43" y="48.5" width="14" height="3" rx="1" fill={color.main} />
          </>
        );
      case 'needle':
        return <path d="M50 37 L53 50 L50 63 L47 50 Z M37 50 L50 47.5 L63 50 L50 52.5 Z" fill={CORE} />;
      case 'point':
      default:
        return <path d="M50 40 L58 51 L50 59 L42 51 Z" fill={CORE} />;
    }
  })();

  return (
    <>
      <circle cx="50" cy="50" r="16" fill={CORE} />
      <circle cx="50" cy="50" r="14.5" fill={url(ids.core)} />
      {emblem}
      {/* 高光固定在左上：陀螺轉起來時這一點不動，看起來像有光打在上面 */}
      <ellipse cx="44.5" cy="43.5" rx="5" ry="2.6" fill="#FFFFFF" opacity="0.55" transform="rotate(-35 44.5 43.5)" />
    </>
  );
};

/**
 * 魔王的眼睛。畫在不轉的那一層，尖刺在外面狂轉、眼睛不動，
 * 看起來才像有東西在盯著你，而不是一顆零件。
 */
const renderBossEye = (color: BeyColorSet, ids: Ids) => (
  <>
    <circle cx="50" cy="50" r="20" fill={url(ids.aura)} />
    <circle cx="50" cy="50" r="15" fill={CORE} stroke={color.deep} strokeWidth="3" />
    <path d="M50 38 Q60 50 50 62 Q40 50 50 38 Z" fill={color.main} />
    <path d="M50 42 Q53.5 50 50 58 Q46.5 50 50 42 Z" fill={CORE} />
    <circle cx="47.5" cy="45" r="1.6" fill="#FFFFFF" opacity="0.8" />
  </>
);

/**
 * 原創對戰陀螺圖形：外圈能量環、帶斜角打光的刀刃、金屬底盤與鉚釘、
 * 帶齒的齒輪環、發亮的寶石軸心。
 * 給定 bladeId / ratchetId / bitId 時會依零件定義繪製，讓每種組合長得不一樣；
 * 沒給就退回單純的隊色造型。刻意只用幾何結構，不描摹任何既有商品造型。
 */
export const BeyTop: React.FC<BeyTopProps> = ({
  color = 'cyan',
  colorSet,
  variant = 'bey',
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

  // React 的 useId 帶冒號等符號，放進 url(#…) 會失效
  const uid = `bey${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ids: Ids = {
    sheen: `${uid}s`,
    blade: `${uid}b`,
    disc: `${uid}d`,
    core: `${uid}c`,
    aura: `${uid}a`,
  };

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
  const label = variant === 'boss' ? '魔王' : blade ? `${blade.name}陀螺` : '對戰陀螺';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      className={`${wobbleClass} ${className}`.trim()}
    >
      {renderDefs(ids, bladeColor, variant === 'boss' ? bladeColor : bitColor)}

      {/* 旋轉層：魔王是尖刺輪，陀螺是能量環、刀刃、底盤與齒輪 */}
      <g className={spinClass} style={spinStyle}>
        {variant === 'boss' ? (
          <>
            <circle cx="50" cy="50" r="49" fill={url(ids.aura)} />
            <path d={BOSS_SPIKES_OUTER} fill={url(ids.blade)} stroke={CORE} strokeWidth="1.6" strokeLinejoin="round" />
            <path d={BOSS_SPIKES_OUTER} fill={url(ids.sheen)} />
            <path d={BOSS_SPIKES_INNER} fill={bladeColor.deep} stroke={CORE} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={BOSS_SPIKES_INNER} fill={url(ids.sheen)} opacity="0.7" />
            <circle cx="50" cy="50" r="21" fill="none" stroke={bladeColor.main} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
          </>
        ) : (
          <>
            {/* 外圈能量環：虛線在轉動時讀成速度線 */}
            <circle cx="50" cy="50" r="47" fill="none" stroke={bladeColor.main} strokeWidth="1.4" strokeDasharray="2.5 5" opacity="0.55" />
            {renderBlades(blade?.shape ?? 'spear', blade?.bladeCount ?? 4, bladeColor, ids)}
            {renderDisc(bladeColor, ids)}
            {renderRatchet(ratchet?.ratchetStyle ?? 'solid', ratchetColor, ids)}
          </>
        )}
      </g>

      {/* 固定層：魔王的眼睛，或陀螺的寶石軸心 */}
      {variant === 'boss' ? renderBossEye(bladeColor, ids) : renderBit(bit?.bitStyle ?? 'point', bitColor, ids)}
    </svg>
  );
};
