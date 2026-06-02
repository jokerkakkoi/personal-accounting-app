import React from 'react';
import { cn } from '@/lib/utils';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentControl: React.FC<SegmentControlProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex p-1 bg-surface-card rounded-md border border-hairline',
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-1.5 text-sm font-medium rounded-sm transition-all duration-200 focus:outline-none select-none',
              isActive
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-muted-token hover:text-ink active:bg-surface-cream-strong'
            )}
            style={{ minHeight: '36px' }} // minimum touch target helper for internal elements
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
