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
  // AC Style: "Squishy" buttons with bottom border for depth
  const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all transform active:scale-95 active:translate-y-[4px] active:shadow-none focus:outline-none disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_0_0_rgba(0,0,0,0.15)]";
  
  const variants = {
    // Mint Green (Confirmation)
    primary: "bg-nook-green text-white border-b-4 border-nook-greenDark hover:brightness-105 active:border-b-0",
    // Sky Blue (Navigation/Info)
    secondary: "bg-nook-blue text-white border-b-4 border-nook-blueDark hover:brightness-105 active:border-b-0",
    // Leaf Green (Positive)
    success: "bg-[#7FD959] text-white border-b-4 border-[#5DA83D] hover:brightness-105 active:border-b-0",
    // Red (Danger/Cancel)
    danger: "bg-nook-red text-white border-b-4 border-[#D96057] hover:brightness-105 active:border-b-0",
    // Brown Outline
    outline: "bg-transparent border-2 border-nook-brown text-nook-brown hover:bg-nook-brown/10 shadow-none active:translate-y-0",
    // Ghost
    ghost: "text-nook-brown hover:bg-nook-brown/10 shadow-none active:translate-y-0 active:scale-95",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl tracking-wide",
    xl: "px-10 py-5 text-2xl tracking-wide",
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