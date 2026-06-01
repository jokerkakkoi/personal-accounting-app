import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { MonthlySummaryCard } from '../features/home/MonthlySummaryCard';
import { BudgetBanner } from '../features/home/BudgetBanner';
import { DateGroupHeader } from '../features/home/DateGroupHeader';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { groupTransactionsByDate, formatMonth } from '../utils/format';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Grid02Icon, 
  Search01Icon, 
  ArrowLeft01Icon, 
  ArrowRight01Icon 
} from '@hugeicons/core-free-icons';
import dayjs from 'dayjs';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const transactions = useAppStore(state => state.transactions);
  const budgets = useAppStore(state => state.budgets);
  
  // Default to current year/month: e.g. "2026-06"
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().format('YYYY-MM'));

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => dayjs(prev + '-01').subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => dayjs(prev + '-01').add(1, 'month').format('YYYY-MM'));
  };

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter(tx => tx.date.startsWith(currentMonth));
  
  // Calculate totals
  const totalIncome = monthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = monthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Fetch current month budget
  const currentBudget = budgets.find(b => b.month === currentMonth);

  // Group transactions by date
  const groupedTransactions = groupTransactionsByDate(monthTransactions);

  // Header left/right custom buttons
  const leftButton = (
    <button
      onClick={() => navigate('/categories')}
      className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform"
      aria-label="分类管理"
    >
      <HugeiconsIcon icon={Grid02Icon} size={20} className="stroke-2" />
    </button>
  );

  const rightButton = (
    <button
      onClick={() => navigate('/search')}
      className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform"
      aria-label="搜索交易"
    >
      <HugeiconsIcon icon={Search01Icon} size={20} className="stroke-2" />
    </button>
  );

  // Custom title widget for month swapping
  const monthSwitcher = (
    <div className="flex items-center gap-1 justify-center shrink-0">
      <button 
        onClick={handlePrevMonth} 
        className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
        aria-label="上个月"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="stroke-2" />
      </button>
      <span className="text-xs font-semibold text-ink min-w-[76px] text-center">
        {formatMonth(currentMonth)}
      </span>
      <button 
        onClick={handleNextMonth} 
        className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
        aria-label="下个月"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="stroke-2" />
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20">
      {/* Header bar */}
      <PageHeader 
        title="" 
        leftAction={leftButton} 
        rightAction={rightButton}
      />
      
      {/* Month Switcher row (placed right below header for clean visual spacing) */}
      <div className="w-full flex justify-center py-2 bg-canvas border-b border-hairline/50">
        {monthSwitcher}
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Monthly Summary block */}
        <MonthlySummaryCard income={totalIncome} expense={totalExpense} />

        {/* Budget Warning banner */}
        <BudgetBanner spent={totalExpense} total={currentBudget?.totalAmount} />
      </div>

      {/* Transaction List */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xs font-heading font-semibold text-muted-token px-4 mb-2 select-none uppercase tracking-wider">
          明细记录
        </h3>

        {groupedTransactions.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              title="本月无记账记录"
              description="点击底部的“+”按钮记一笔吧！"
              action={{
                label: "记一笔",
                onClick: () => navigate('/transaction/new'),
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {groupedTransactions.map((group) => (
              <div key={group.date} className="flex flex-col">
                <DateGroupHeader
                  date={group.date}
                  dayIncome={group.dayIncome}
                  dayExpense={group.dayExpense}
                />
                <div className="flex flex-col bg-canvas">
                  {group.transactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onClick={() => navigate(`/transaction/${tx.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default HomePage;
