import React from 'react';
import { formatCurrency, formatPercent } from '../../utils/format';
import { cn } from '@/lib/utils';
import { Edit02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface BudgetProgressCardProps {
  spent: number;
  total: number;
  onClick: () => void;
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  spent,
  total,
  onClick,
}) => {
  const isBudgetSet = total > 0;
  const remaining = total - spent;
  const percent = isBudgetSet ? Math.min((spent / total) * 100, 100) : 0;

  // Determine color matching for progress & warning states
  const isOverspent = spent > total;
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
      className="bg-surface-card border border-hairline p-5 rounded-lg flex flex-col gap-4 shadow-sm cursor-pointer hover:bg-surface-cream-strong active:scale-98 transition-transform select-none"
    >
      {/* Title block */}
      <div className="flex justify-between items-center text-xs text-muted-token">
        <span>总预算使用量</span>
        <span className="flex items-center gap-1">
          编辑预算
          <HugeiconsIcon icon={Edit02Icon} size={12} className="stroke-2 text-muted-token" />
        </span>
      </div>

      {/* Main progress values */}
      <div className="flex justify-between items-baseline">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-soft mb-0.5">本月已花</span>
          <span className="text-2xl font-sans font-medium text-ink">
            {formatCurrency(spent)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-muted-soft mb-0.5">总额 / 剩余</span>
          <span className="text-sm font-sans font-medium text-ink">
            {isBudgetSet ? formatCurrency(total) : '未设置'}
            {isBudgetSet && (
              <span className={cn('text-xs ml-1.5 font-medium', remaining >= 0 ? 'text-success' : 'text-error')}>
                ({remaining >= 0 ? '剩 ' : '超 '}{formatCurrency(Math.abs(remaining))})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Custom progress bar */}
      {isBudgetSet && (
        <div className="flex flex-col gap-1.5">
          <div className="w-full h-2.5 bg-brand-disabled rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressColor)}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-soft font-medium">
            <span>使用进度</span>
            <span>{formatPercent(spent / total * 100)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default BudgetProgressCard;
