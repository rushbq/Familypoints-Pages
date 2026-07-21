import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  action?: ReactNode;
  variant?: 'default' | 'paper' | 'phone';
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, title, action, variant = 'default' }) => {
  const variantStyles = {
    default: "bg-white border border-black/5 soft-card rounded-[2rem]",
    paper: "bg-white border border-black/5 soft-card rounded-[2rem]",
    phone: "bg-white/90 backdrop-blur-md border-[6px] border-white shadow-xl rounded-[3rem]" // NookPhone App container
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="px-6 md:px-8 py-4 md:py-5 flex justify-between items-center bg-nook-green/10 border-b border-black/5">
          {title && <h3 className="font-black text-nook-brown text-lg md:text-xl tracking-wide flex items-center gap-2">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 md:p-8">
        {children}
      </div>
    </div>
  );
};