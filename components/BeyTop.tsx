import React from 'react';

type TeamColor = 'cyan' | 'orange' | 'lime' | 'yellow';

interface BeyTopProps {
  /** 隊色：青色為主隊、橘色為對手隊。 */
  color?: TeamColor;
  size?: number;
  /** 旋轉速度；idle 代表停轉（用於尚未啟動的狀態）。 */
  speed?: 'idle' | 'slow' | 'fast';
  className?: string;
}

const PALETTE: Record<TeamColor, { main: string; deep: string; core: string }> = {
  cyan: { main: '#13FFF3', deep: '#0A9C95', core: '#05080F' },
  orange: { main: '#FF7A2F', deep: '#A8441A', core: '#05080F' },
  lime: { main: '#A2FF1F', deep: '#5E9410', core: '#05080F' },
  yellow: { main: '#FCEE21', deep: '#A89709', core: '#05080F' },
};

/**
 * 原創對戰陀螺圖形：外層刀刃環、中層金屬齒輪、核心軸尖。
 * 刻意只用幾何同心結構，不描摹任何既有商品造型。
 */
export const BeyTop: React.FC<BeyTopProps> = ({
  color = 'cyan',
  size = 72,
  speed = 'slow',
  className = '',
}) => {
  const c = PALETTE[color];
  const spinClass = speed === 'fast' ? 'bey-spin-fast' : speed === 'slow' ? 'bey-spin' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="對戰陀螺"
      className={className}
    >
      {/* 旋轉層：刀刃環與齒輪 */}
      <g className={spinClass}>
        <circle cx="50" cy="50" r="40" fill="none" stroke={c.main} strokeWidth="4" />
        <circle cx="50" cy="50" r="40" fill={c.main} opacity="0.08" />

        {/* 四向刀刃 */}
        <g fill={c.main}>
          <path d="M50 4 L59 18 L41 18 Z" />
          <path d="M96 50 L82 59 L82 41 Z" />
          <path d="M50 96 L41 82 L59 82 Z" />
          <path d="M4 50 L18 41 L18 59 Z" />
        </g>

        {/* 斜向配重塊 */}
        <g fill={c.deep}>
          <path d="M79 21 L86 28 L74 34 L68 28 Z" />
          <path d="M21 79 L14 72 L26 66 L32 72 Z" />
        </g>

        {/* 金屬齒輪環 */}
        <circle cx="50" cy="50" r="26" fill="none" stroke="#2C3B60" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke={c.main}
          strokeWidth="2"
          strokeDasharray="5 7"
          opacity="0.9"
        />
      </g>

      {/* 固定層：核心與軸尖 */}
      <circle cx="50" cy="50" r="14" fill={c.main} />
      <path d="M50 41 L57 52 L50 59 L43 52 Z" fill={c.core} />
    </svg>
  );
};
