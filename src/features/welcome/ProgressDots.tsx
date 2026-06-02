import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, current }) => {
  return (
    <div className="flex gap-2 justify-center items-center select-none">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            idx === current ? 'bg-brand-primary w-5' : 'bg-brand-disabled'
          )}
        />
      ))}
    </div>
  );
};
export default ProgressDots;
