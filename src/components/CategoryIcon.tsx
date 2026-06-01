import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  size = 'md',
  selected = false,
  onClick,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200 select-none',
        selected 
          ? 'bg-brand-primary text-white shadow-md scale-105 border border-brand-active' 
          : 'bg-surface-card hover:bg-surface-cream-strong border border-hairline text-ink',
        onClick && 'cursor-pointer active:scale-95',
        sizeClasses[size],
        className
      )}
    >
      <span className="leading-none">{icon}</span>
    </div>
  );
};
