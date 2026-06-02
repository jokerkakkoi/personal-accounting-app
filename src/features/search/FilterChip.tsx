import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => {
  return (
    <div className="inline-flex items-center gap-1 bg-surface-card border border-hairline px-2.5 py-1 rounded-full text-xs text-ink font-medium select-none shadow-sm">
      <span>{label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-3.5 h-3.5 rounded-full hover:bg-surface-cream-strong flex items-center justify-center text-muted-token hover:text-ink transition-colors active:scale-90"
        aria-label={`清除过滤 ${label}`}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={10} className="stroke-2" />
      </button>
    </div>
  );
};
export default FilterChip;
