import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface NumPadProps {
  onKeyPress: (key: string) => void;
  className?: string;
}

export const NumPad: React.FC<NumPadProps> = ({ onKeyPress, className }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  const handlePress = (val: string) => {
    onKeyPress(val);
  };

  return (
    <div className={cn('grid grid-cols-3 gap-2 bg-surface-soft p-3 rounded-lg border border-hairline', className)}>
      {keys.map((key) => {
        const isBackspace = key === 'backspace';
        return (
          <button
            key={key}
            type="button"
            onClick={() => handlePress(key)}
            aria-label={isBackspace ? '退格' : undefined}
            className={cn(
              'h-14 flex items-center justify-center text-lg font-medium bg-canvas rounded-md border border-hairline text-ink select-none',
              'active:bg-surface-cream-strong active:scale-95 transition-all outline-none',
              isBackspace && 'bg-surface-card hover:bg-surface-cream-strong'
            )}
            style={{ touchAction: 'manipulation' }}
          >
            {isBackspace ? (
              <HugeiconsIcon icon={Delete02Icon} size={20} className="stroke-2 text-muted-token" />
            ) : (
              key
            )}
          </button>
        );
      })}
    </div>
  );
};
export default NumPad;
