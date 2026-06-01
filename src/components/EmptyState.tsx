import React from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📭',
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-canvas rounded-lg border border-dashed border-hairline',
        className
      )}
    >
      <div className="text-4xl mb-3 animate-bounce select-none">
        {typeof icon === 'string' ? icon : icon}
      </div>
      
      <h3 className="text-lg font-heading text-ink mb-1 select-none">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-token max-w-xs mb-4 select-none">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-brand-primary hover:bg-brand-active text-white text-xs px-4 py-2 h-8 rounded-md active:scale-95 transition-transform"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
