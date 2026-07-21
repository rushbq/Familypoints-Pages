import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
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
  // Pikmin Bloom 風格：緊湊、圓潤，保留輕微按壓深度。
  const baseStyles = "inline-flex min-h-10 items-center justify-center rounded-xl font-bold transition-[transform,filter,background-color,border-color] duration-200 active:translate-y-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark focus-visible:ring-offset-2 disabled:opacity-45 disabled:pointer-events-none";
  
  const variants = {
    // Mint Green (Confirmation)
    primary: "bg-nook-green text-white border-b-[3px] border-nook-greenDark hover:brightness-105 active:border-b-0",
    // Sky Blue (Navigation/Info)
    secondary: "bg-nook-blue text-white border-b-[3px] border-nook-blueDark hover:brightness-105 active:border-b-0",
    // Leaf Green (Positive)
    success: "bg-nook-green text-white border-b-[3px] border-nook-greenDark hover:brightness-105 active:border-b-0",
    // Red (Danger/Cancel)
    danger: "bg-nook-red text-white border-b-[3px] border-[#B84F49] hover:brightness-105 active:border-b-0",
    // Brown Outline
    outline: "bg-white border border-nook-brown/20 text-nook-brown hover:bg-nook-beige active:translate-y-0",
    // Ghost
    ghost: "text-nook-brown/70 hover:text-nook-brown hover:bg-nook-brown/5 active:translate-y-0",
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
