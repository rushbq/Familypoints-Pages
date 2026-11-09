import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'reward' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  // Sweet Home 風格：緊湊、圓潤，保留輕微按壓深度。
  const baseStyles = "inline-flex min-h-10 items-center justify-center rounded-xl font-bold transition-[transform,filter,background-color,border-color] duration-200 active:translate-y-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-bey-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bey-deep disabled:opacity-45 disabled:pointer-events-none";

  const variants = {
    // 主隊青（確認）：亮色底配深色字，暗場下對比最高。
    primary: "bg-bey-cyan text-bey-void border-b-[3px] border-bey-cyanDark hover:brightness-110 active:border-b-0",
    // 資訊藍（導覽）
    secondary: "bg-bey-blue text-white border-b-[3px] border-bey-blueDark hover:brightness-110 active:border-b-0",
    // 爆發綠（加分／成功）
    success: "bg-bey-lime text-bey-void border-b-[3px] border-[#5E9410] hover:brightness-110 active:border-b-0",
    // 紅（扣分／危險）
    danger: "bg-bey-red text-white border-b-[3px] border-[#A32B2B] hover:brightness-110 active:border-b-0",
    // 對手橘（獎勵兌換）
    reward: "bg-bey-orange text-bey-void border-b-[3px] border-bey-orangeDark hover:brightness-110 active:border-b-0",
    // 金屬外框
    outline: "bg-bey-paper border border-bey-steel text-bey-ink hover:bg-bey-panel hover:border-bey-cyan/50 active:translate-y-0",
    // 透明
    ghost: "text-bey-dim hover:text-bey-ink hover:bg-bey-ink/10 active:translate-y-0",
  };

  const sizes = {
    sm: "min-h-8 px-3 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
