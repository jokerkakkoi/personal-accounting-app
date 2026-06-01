import React from 'react';
import { formatDate, formatCurrency } from '../../utils/format';

interface DateGroupHeaderProps {
  date: string;
  dayIncome: number;
  dayExpense: number;
}

export const DateGroupHeader: React.FC<DateGroupHeaderProps> = ({
  date,
  dayIncome,
  dayExpense,
}) => {
  const showIncome = dayIncome > 0;
  const showExpense = dayExpense > 0;

  return (
    <div className="flex justify-between items-center py-2 px-4 bg-surface-soft border-y border-hairline select-none">
      {/* Date label */}
      <span className="text-xs font-semibold text-ink">
        {formatDate(date)}
      </span>

      {/* Daily totals */}
      <div className="flex items-center gap-2.5 text-[10px] text-muted-soft">
        {showIncome && (
          <span>
            收: <span className="text-success font-medium">{formatCurrency(dayIncome)}</span>
          </span>
        )}
        {showExpense && (
          <span>
            支: <span className="text-error font-medium">{formatCurrency(dayExpense)}</span>
          </span>
        )}
      </div>
    </div>
  );
};
export default DateGroupHeader;
