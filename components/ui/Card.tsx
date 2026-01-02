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
    default: "bg-nook-cream border-2 border-nook-beige shadow-sm rounded-[2.5rem]",
    paper: "bg-white border border-nook-brown/10 shadow-sm rounded-3xl relative before:content-[''] before:block before:absolute before:left-6 before:top-0 before:bottom-0 before:w-[2px] before:bg-nook-red/20", // Notebook line
    phone: "bg-white/90 backdrop-blur-md border-[6px] border-white shadow-xl rounded-[3rem]" // NookPhone App container
  };

  return (
    <div 
      onClick={onClick}
      className={`${variantStyles[variant]} overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''} ${className}`}
    >
      {(title || action) && (
        <div className={`px-8 py-5 flex justify-between items-center ${variant === 'paper' ? 'border-b-2 border-dashed border-nook-brown/20 bg-nook-yellow/10' : 'bg-nook-yellow/20 border-b border-nook-yellow'}`}>
          {title && <h3 className="font-bold text-nook-brown text-xl tracking-wide flex items-center gap-2">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`${variant === 'paper' ? 'p-8 pl-12' : 'p-6 md:p-8'}`}>
        {children}
      </div>
    </div>
  );
};