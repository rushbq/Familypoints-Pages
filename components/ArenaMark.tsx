import React from 'react';

/** 六角形競技場的輪廓；尖角朝上，像一面徽章。 */
const HEX = 'M50 6 L88.1 28 L88.1 72 L50 94 L11.9 72 L11.9 28 Z';
/** 中央的發射點火花。 */
const SPARK = 'M50 30 L54.5 45.5 L70 50 L54.5 54.5 L50 70 L45.5 54.5 L30 50 L45.5 45.5 Z';

const CYAN = '#13FFF3';

/**
 * 品牌標誌：從上方俯視的六角形競技場。
 *
 * 刻意**不是**一顆陀螺——導覽列的標誌跟場上的陀螺、魔王長得一樣時，
 * 三者會讀成同一件東西，而且一個會轉的圓環在頁首看起來像載入指示。
 * 直線的六角形在 30px 也認得出來，和場上所有的圓形剛好相反。
 *
 * 裝飾性元素：三個使用位置旁邊都有「BEY ARENA」或可讀的按鈕標籤。
 */
export const ArenaMark: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d={HEX} fill={CYAN} opacity="0.1" />
    <path d={HEX} fill="none" stroke={CYAN} strokeWidth="7" strokeLinejoin="round" />
    {/* 內圈是場地的碗壁 */}
    <circle cx="50" cy="50" r="26" fill="none" stroke={CYAN} strokeWidth="4" opacity="0.5" />
    <path d={SPARK} fill={CYAN} />
  </svg>
);
