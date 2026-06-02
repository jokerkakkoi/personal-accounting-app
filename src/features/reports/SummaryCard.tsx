import React from 'react';
import { formatCurrency, formatPercent } from '../../utils/format';
import { cn } from '@/lib/utils';
import { ArrowUpRight01Icon, ArrowDownRight01Icon, Wallet01Icon, Wallet02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface SummaryCardProps {
  income: number;
  expense: number;
  prevIncome: number;
  prevExpense: number;
  periodLabel: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  income,
  expense,
  prevIncome,
  prevExpense,
  periodLabel,
}) => {
  const netBalance = income - expense;
  const prevNetBalance = prevIncome - prevExpense;

  const calculateChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr > 0 ? null : 0;
    return ((curr - prev) / prev) * 100;
  };

  const incomeChange = calculateChange(income, prevIncome);
  const expenseChange = calculateChange(expense, prevExpense);
  const balanceChange = calculateChange(netBalance, prevNetBalance);

  const renderTrendBadge = (change: number | null, isExpense: boolean = false) => {
    if (change === null) {
      return (
        <span className={cn(
          "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1",
          isExpense ? "bg-error/10 text-error" : "bg-success/10 text-success"
        )}>
          新增
        </span>
      );
    }
    if (change === 0) return null;
    const isPositive = change > 0;
    
    // For expense: increase is bad (red/coral), decrease is good (green)
    // For income/balance: increase is good (green), decrease is bad (red/coral)
    let isGood = isPositive;
    if (isExpense) {
      isGood = !isPositive;
    }

    const absChange = Math.abs(change);
    const label = `${isPositive ? '+' : '-'}${formatPercent(absChange)}`;

    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1",
        isGood 
          ? "bg-success/10 text-success" 
          : "bg-error/10 text-error"
      )}>
        <HugeiconsIcon 
          icon={isPositive ? ArrowUpRight01Icon : ArrowDownRight01Icon} 
          size={10} 
          className="stroke-2 shrink-0" 
        />
        {label}
      </span>
    );
  };

  return (
    <div className="bg-surface-card border border-hairline p-4 rounded-lg flex flex-col gap-4 shadow-sm select-none">
      {/* Top Banner: Balance */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-soft uppercase tracking-wider">本期净结余</span>
          <span className={cn(
            "text-2xl font-sans font-semibold mt-0.5",
            netBalance >= 0 ? "text-ink" : "text-error"
          )}>
            {formatCurrency(netBalance)}
          </span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[9px] text-muted-soft">环比上个{periodLabel}</span>
          {renderTrendBadge(balanceChange)}
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Grid: Income / Expense */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income column */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Wallet01Icon} size={16} className="text-success stroke-2" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-soft">收入</span>
            <span className="text-sm font-semibold text-success mt-0.5 truncate">
              {formatCurrency(income)}
            </span>
            {renderTrendBadge(incomeChange, false)}
          </div>
        </div>

        {/* Expense column */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Wallet02Icon} size={16} className="text-error stroke-2" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-soft">支出</span>
            <span className="text-sm font-semibold text-error mt-0.5 truncate">
              {formatCurrency(expense)}
            </span>
            {renderTrendBadge(expenseChange, true)}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SummaryCard;
