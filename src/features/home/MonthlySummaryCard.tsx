import React from 'react';
import { AmountDisplay } from '../../components/AmountDisplay';

interface MonthlySummaryCardProps {
  income: number;
  expense: number;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({ income, expense }) => {
  const balance = income - expense;

  return (
    <div className="bg-surface-card border border-hairline p-5 rounded-lg flex flex-col gap-4 shadow-sm select-none">
      {/* Balance Block */}
      <div className="text-center">
        <span className="text-xs text-muted-token block mb-1">本月结余</span>
        <AmountDisplay amount={balance} size="2xl" type="neutral" />
      </div>

      <div className="w-full h-px bg-hairline" />

      {/* Income / Expense block */}
      <div className="flex justify-between items-center text-center">
        <div className="flex-1">
          <span className="text-[10px] text-muted-token block mb-1">本月收入</span>
          <AmountDisplay amount={income} size="lg" type="income" />
        </div>
        
        <div className="w-px h-8 bg-hairline" />
        
        <div className="flex-1">
          <span className="text-[10px] text-muted-token block mb-1">本月支出</span>
          <AmountDisplay amount={expense} size="lg" type="expense" />
        </div>
      </div>
    </div>
  );
};
export default MonthlySummaryCard;
