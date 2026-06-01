import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatMonth, formatCurrency, formatPercent } from '../utils/format';
import { cn } from '@/lib/utils';
import { 
  ArrowDown01Icon, 
  ArrowUp01Icon, 
  AlertCircleIcon, 
  Calendar01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

export const BudgetHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const budgets = useAppStore(state => state.budgets);
  const categories = useAppStore(state => state.categories);
  const transactions = useAppStore(state => state.transactions);

  // Time range state: 3, 6, 12 months or 'all'
  const [timeRange, setTimeRange] = useState<3 | 6 | 12 | 'all'>(6);
  // Expanded card state: mapping month (string) to boolean
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleExpand = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  // Get range display text
  const timeRanges = [
    { label: '近3月', value: 3 as const },
    { label: '近6月', value: 6 as const },
    { label: '近12月', value: 12 as const },
    { label: '全部', value: 'all' as const },
  ];

  // Recalculate and clean history budgets
  const sortedBudgets = [...budgets]
    .sort((a, b) => b.month.localeCompare(a.month))
    .filter(b => b.totalAmount > 0); // Only show months with budget set

  // Filter budgets by range
  const filteredBudgets = sortedBudgets.filter(b => {
    if (timeRange === 'all') return true;
    
    const budgetMonth = dayjs(b.month + '-01');
    const limitMonth = dayjs().startOf('month').subtract(timeRange - 1, 'month');
    
    // Check if the budget month is after or equal to the limit month
    return budgetMonth.isAfter(limitMonth) || budgetMonth.isSame(limitMonth, 'month');
  });

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none min-h-screen">
      <PageHeader
        title="预算历史"
        showBack={true}
      />

      {/* Time Range Selector */}
      <div className="px-4 py-3 bg-canvas sticky top-[56px] z-40 border-b border-hairline/50 flex justify-center">
        <div className="flex bg-surface-soft p-0.5 rounded-full w-full max-w-sm">
          {timeRanges.map((range) => {
            const isActive = timeRange === range.value;
            return (
              <button
                key={range.label}
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  'flex-1 text-center py-1.5 text-xs font-medium rounded-full transition-all duration-200 select-none active:scale-95',
                  isActive 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-muted-token hover:text-ink'
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {filteredBudgets.length === 0 ? (
          <EmptyState
            title="暂无预算历史"
            description="在当前筛选的时间范围内没有设置过任何预算。"
            icon="📅"
            action={{
              label: "去管理预算",
              onClick: () => navigate('/budgets'),
            }}
          />
        ) : (
          filteredBudgets.map((b) => {
            const monthStr = b.month;
            const isExpanded = !!expandedMonths[monthStr];
            
            // Get all transactions for this month to calculate actual spend
            const monthExpenseTxs = transactions.filter(
              t => t.type === 'expense' && t.date.startsWith(monthStr)
            );
            const actualSpent = monthExpenseTxs.reduce((sum, t) => sum + t.amount, 0);
            
            const totalBudget = b.totalAmount;
            const remaining = totalBudget - actualSpent;
            const percent = totalBudget > 0 ? Math.min((actualSpent / totalBudget) * 100, 100) : 0;
            const isOverspent = actualSpent > totalBudget;
            const isWarning = percent >= 80 && percent < 100;
            
            const progressColor = isOverspent 
              ? 'bg-error' 
              : isWarning 
                ? 'bg-warning' 
                : 'bg-success';

            // Calculate category spent details
            const categoryDetails = b.categoryBudgets.map(cb => {
              const cat = categories.find(c => c.id === cb.categoryId) || {
                name: '其他',
                icon: '📦',
              };
              const cbSpent = monthExpenseTxs
                .filter(t => t.categoryId === cb.categoryId)
                .reduce((sum, t) => sum + t.amount, 0);
              
              const cbPercent = cb.amount > 0 ? (cbSpent / cb.amount) * 100 : 0;

              return {
                categoryId: cb.categoryId,
                name: cat.name,
                icon: cat.icon,
                budgetAmount: cb.amount,
                spent: cbSpent,
                percent: cbPercent,
              };
            });

            // Get Top 3 category budgets by spent amount/percentage
            const topCategories = [...categoryDetails]
              .sort((x, y) => y.spent - x.spent)
              .slice(0, 3);

            return (
              <div 
                key={monthStr}
                className="bg-surface-card border border-hairline rounded-lg overflow-hidden flex flex-col transition-all duration-300 shadow-sm"
              >
                {/* Month Card Header */}
                <div 
                  onClick={() => toggleExpand(monthStr)}
                  className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-surface-cream-strong transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-muted-soft stroke-2" />
                      <span className="text-sm font-heading font-semibold text-ink">
                        {formatMonth(monthStr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOverspent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-error/10 text-error rounded-full flex items-center gap-0.5">
                          <HugeiconsIcon icon={AlertCircleIcon} size={10} className="stroke-2 text-error shrink-0" />
                          超支 {formatCurrency(Math.abs(remaining))}
                        </span>
                      )}
                      {!isOverspent && remaining >= 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-success/10 text-success rounded-full">
                          剩 {formatCurrency(remaining)}
                        </span>
                      )}
                      <HugeiconsIcon 
                        icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} 
                        size={16} 
                        className="text-muted-token stroke-2" 
                      />
                    </div>
                  </div>

                  {/* Month Total Info */}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-soft">
                      已花 <span className="font-semibold text-ink">{formatCurrency(actualSpent)}</span>
                    </span>
                    <span className="text-muted-soft">
                      预算 <span className="font-medium text-ink">{formatCurrency(totalBudget)}</span>
                    </span>
                  </div>

                  {/* Main Progress Bar */}
                  <div className="w-full h-2 bg-brand-disabled rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', progressColor)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Top 3 Category Preview (Shown when collapsed) */}
                  {!isExpanded && topCategories.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-hairline/30 flex flex-col gap-1.5">
                      <span className="text-[10px] text-muted-token font-medium uppercase tracking-wider">
                        支出排行预览
                      </span>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {topCategories.map((tc) => (
                          <div 
                            key={tc.categoryId} 
                            className="flex items-center gap-1.5 bg-canvas/80 border border-hairline/40 rounded-full px-2 py-0.5 shrink-0"
                          >
                            <span className="text-[10px]">{tc.icon}</span>
                            <span className="text-[10px] font-semibold text-ink truncate max-w-[48px]">
                              {tc.name}
                            </span>
                            <span className={cn(
                              'text-[10px] font-semibold tabular-nums',
                              tc.spent > tc.budgetAmount ? 'text-error' : 'text-success'
                            )}>
                              {formatPercent(tc.percent)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Category details */}
                {isExpanded && (
                  <div className="border-t border-hairline/80 bg-canvas">
                    <div className="px-4 py-2 bg-surface-soft/40 border-b border-hairline/40">
                      <h4 className="text-[10px] font-bold text-muted-token uppercase tracking-wider">
                        分类预算明细
                      </h4>
                    </div>

                    {categoryDetails.length === 0 ? (
                      <div className="py-6 px-4 text-center text-xs text-muted-token">
                        本月未设置任何分类预算。
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {categoryDetails.map((tc) => {
                          const isCatOverspent = tc.spent > tc.budgetAmount;
                          const isCatWarning = tc.percent >= 80 && tc.percent < 100;
                          const catColor = isCatOverspent ? 'bg-error' : isCatWarning ? 'bg-warning' : 'bg-success';

                          return (
                            <div 
                              key={tc.categoryId}
                              className="flex items-center gap-3 px-4 py-3 border-b border-hairline/40 last:border-b-0 min-h-[52px]"
                            >
                              <CategoryIcon icon={tc.icon} size="sm" className="shrink-0" />
                              
                              <div className="flex-1 flex flex-col min-w-0 gap-1">
                                <div className="flex justify-between items-baseline text-xs">
                                  <span className="font-semibold text-ink truncate">{tc.name}</span>
                                  <span className="text-[10px] text-muted-soft">
                                    {formatCurrency(tc.spent)} / {formatCurrency(tc.budgetAmount)}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-brand-disabled rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', catColor)}
                                    style={{ width: `${Math.min(tc.percent, 100)}%` }}
                                  />
                                </div>
                              </div>

                              <div className="shrink-0 text-right min-w-[40px] pl-2">
                                <span className={cn(
                                  'text-xs font-semibold tabular-nums',
                                  isCatOverspent ? 'text-error' : isCatWarning ? 'text-warning' : 'text-success'
                                )}>
                                  {formatPercent(tc.percent)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetHistoryPage;
