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
    default: "bg-bey-panel soft-card rounded-2xl",
    paper: "bg-bey-paper soft-card rounded-2xl",
    phone: "bg-bey-panel soft-card rounded-2xl"
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="px-4 md:px-5 py-3 flex justify-between items-center bg-bey-cyan/10 border-b border-bey-steel">
          {title && <h3 className="font-black text-bey-ink text-base md:text-lg flex items-center gap-2">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4 md:p-5">
        {children}
      </div>
    </div>
  );
};
