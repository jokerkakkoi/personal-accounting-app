import React from 'react';
import { CategoryIcon } from '../../components/CategoryIcon';
import { formatCurrency, formatPercent } from '../../utils/format';
import { cn } from '@/lib/utils';

interface CategoryBudgetItemProps {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  budgetAmount: number;
  onClick: () => void;
}

export const CategoryBudgetItem: React.FC<CategoryBudgetItemProps> = ({
  categoryName,
  categoryIcon,
  spent,
  budgetAmount,
  onClick,
}) => {
  const percent = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
  const isOverspent = spent > budgetAmount;
  const isWarning = percent >= 80 && percent < 100;
  
  const progressColor = isOverspent 
    ? 'bg-error' 
    : isWarning 
      ? 'bg-warning' 
      : 'bg-success';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-3 p-3 bg-canvas border-b border-hairline/50 hover:bg-surface-soft active:bg-surface-soft/80 cursor-pointer select-none"
      style={{ minHeight: '56px' }}
    >
      {/* Category Icon */}
      <CategoryIcon icon={categoryIcon} size="sm" className="shrink-0" />

      {/* Budget details */}
      <div className="flex-1 flex flex-col min-w-0 gap-1">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-semibold text-ink truncate">{categoryName}</span>
          <span className="text-[10px] text-muted-soft">
            {formatCurrency(spent)} / {formatCurrency(budgetAmount)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-brand-disabled rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', progressColor)}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Percentage label */}
      <div className="shrink-0 text-right min-w-[40px]">
        <span className={cn('text-xs font-semibold tabular-nums', isOverspent ? 'text-error' : isWarning ? 'text-warning' : 'text-success')}>
          {formatPercent(percent)}
        </span>
      </div>
    </div>
  );
};
export default CategoryBudgetItem;
