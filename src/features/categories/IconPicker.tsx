import React from 'react';
import { ICON_PALETTE } from '../../utils/constants';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-8 gap-2 p-1 max-h-[160px] overflow-y-auto border border-hairline rounded-md bg-canvas pr-1', className)}>
      {ICON_PALETTE.map((icon) => {
        const isSelected = selectedIcon === icon;
        return (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform select-none',
              isSelected 
                ? 'bg-brand-primary text-white shadow-sm border border-brand-active' 
                : 'bg-surface-card hover:bg-surface-cream-strong border border-hairline'
            )}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};
export default IconPicker;
