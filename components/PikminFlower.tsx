import React from 'react';

/**
 * Pikmin Bloom 風格的小花圖案（5 片圓潤花瓣 + 花心）。
 * 用於裝飾、項目符號與強調點綴。
 */
export const PikminFlower: React.FC<{
  size?: number;
  petal?: string;
  center?: string;
  className?: string;
}> = ({ size = 24, petal = '#FFFFFF', center = '#F6C544', className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {[0, 72, 144, 216, 288].map((deg) => (
      <ellipse key={deg} cx="20" cy="9" rx="6.2" ry="8.4" fill={petal} transform={`rotate(${deg} 20 20)`} />
    ))}
    <circle cx="20" cy="20" r="5.4" fill={center} />
  </svg>
);

/**
 * 背景裝飾用的漂浮花朵層（絕對定位、不攔截點擊）。
 * 放在有 position:relative 的容器內即可。
 */
const DECOR_FLOWERS: { top: string; left?: string; right?: string; size: number; petal: string; center: string; delay: string }[] = [
  { top: '4%', left: '-2%', size: 64, petal: '#FBDCEB', center: '#F48FB1', delay: '0s' },
  { top: '18%', right: '-3%', size: 88, petal: '#FFFFFF', center: '#F6C544', delay: '1.2s' },
  { top: '52%', left: '-4%', size: 72, petal: '#DDF3E6', center: '#7ED9A7', delay: '0.6s' },
  { top: '74%', right: '-2%', size: 56, petal: '#E6E0FB', center: '#A88BFA', delay: '1.8s' },
];

export const FloatingFlowers: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`} aria-hidden="true">
    {DECOR_FLOWERS.map((f, i) => (
      <div
        key={i}
        className="absolute opacity-40 animate-sway"
        style={{ top: f.top, left: f.left, right: f.right, animationDelay: f.delay }}
      >
        <PikminFlower size={f.size} petal={f.petal} center={f.center} />
      </div>
    ))}
  </div>
);
