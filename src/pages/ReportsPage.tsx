import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { SegmentControl } from '../components/SegmentControl';
import { SummaryCard } from '../features/reports/SummaryCard';
import { TrendPreviewCard } from '../features/reports/TrendPreviewCard';
import { BreakdownPreviewCard } from '../features/reports/BreakdownPreviewCard';
import { TopCategoriesRank } from '../features/reports/TopCategoriesRank';
import { EmptyState } from '../components/EmptyState';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

const CATEGORY_COLORS = [
  '#cc785c', // Coral
  '#5db8a6', // Teal
  '#e8a55a', // Amber
  '#5db872', // Green
  '#d4a017', // Warning yellow
  '#c64545', // Error red
  '#a374f2', // Purple
  '#f274a3', // Pink
  '#74a3f2', // Blue
  '#74f2a3', // Mint
  '#f2a374', // Orange
  '#a3f274', // Lime
];

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);

  // States
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(() => dayjs());

  // Period navigation
  const handlePrevPeriod = () => {
    setCurrentDate(prev => prev.subtract(1, periodType));
  };

  const handleNextPeriod = () => {
    setCurrentDate(prev => prev.add(1, periodType));
  };

  // Format date range text
  const getPeriodText = () => {
    switch (periodType) {
      case 'day':
        return currentDate.format('YYYY年MM月DD日');
      case 'week': {
        const start = currentDate.startOf('week');
        const end = currentDate.endOf('week');
        return `${start.format('YYYY.MM.DD')} - ${end.format('MM.DD')}`;
      }
      case 'month':
        return currentDate.format('YYYY年MM月');
      case 'year':
        return currentDate.format('YYYY年');
      default:
        return '';
    }
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'day': return '日';
      case 'week': return '周';
      case 'month': return '月';
      case 'year': return '年';
    }
  };

  // Helper to filter transactions in a range
  const filterTxsForPeriod = (dateVal: dayjs.Dayjs) => {
    return transactions.filter(t => {
      const txDate = dayjs(t.date);
      switch (periodType) {
        case 'day':
          return txDate.isSame(dateVal, 'day');
        case 'week':
          return txDate.isSame(dateVal, 'week');
        case 'month':
          return txDate.isSame(dateVal, 'month');
        case 'year':
          return txDate.isSame(dateVal, 'year');
        default:
          return false;
      }
    });
  };

  const currentTxs = filterTxsForPeriod(currentDate);
  const prevTxs = filterTxsForPeriod(currentDate.subtract(1, periodType));

  // Current stats
  const currentIncome = currentTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const currentExpense = currentTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Prev stats
  const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Calculate top 5 expense categories for current period
  const expenseTxs = currentTxs.filter(t => t.type === 'expense');
  const expenseByCategory: Record<string, number> = {};
  
  expenseTxs.forEach(t => {
    expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
  });

  const categoryRankData = Object.entries(expenseByCategory)
    .map(([catId, amount], idx) => {
      const cat = categories.find(c => c.id === catId) || {
        name: '未知分类',
        icon: '📦',
      };
      const percentage = currentExpense > 0 ? (amount / currentExpense) * 100 : 0;
      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      
      return {
        categoryId: catId,
        name: cat.name,
        icon: cat.icon,
        amount,
        percentage,
        color,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const top5Rank = categoryRankData.slice(0, 5);

  // Generate last 6 months trend data (excluding current if period type isn't month, but let's keep it based on months for general navigation)
  // Sparkline displays last 6 periods based on selected periodType
  const getTrendPreviewData = () => {
    const dataPoints = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = currentDate.subtract(i, periodType);
      const targetTxs = filterTxsForPeriod(targetDate);
      const inc = targetTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = targetTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      let label = '';
      if (periodType === 'day') label = targetDate.format('DD');
      else if (periodType === 'week') label = targetDate.format('W');
      else if (periodType === 'month') label = targetDate.format('MM');
      else if (periodType === 'year') label = targetDate.format('YY');

      dataPoints.push({
        label,
        income: inc,
        expense: exp,
      });
    }
    return dataPoints;
  };

  const trendData = getTrendPreviewData();

  // Handle segment changes
  const handlePeriodChange = (val: string) => {
    setPeriodType(val as 'day' | 'week' | 'month' | 'year');
    setCurrentDate(dayjs()); // reset to today
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none min-h-screen">
      <PageHeader title="财务报表" />

      {/* Period Selection */}
      <div className="px-4 py-2 bg-canvas border-b border-hairline/50 flex flex-col gap-2">
        <SegmentControl
          options={[
            { value: 'day', label: '日' },
            { value: 'week', label: '周' },
            { value: 'month', label: '月' },
            { value: 'year', label: '年' },
          ]}
          value={periodType}
          onChange={handlePeriodChange}
        />

        {/* Date Selector Row */}
        <div className="flex items-center justify-between py-1 px-2">
          <button 
            onClick={handlePrevPeriod} 
            className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
            aria-label={`上个${getPeriodLabel()}`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="stroke-2" />
          </button>
          <span className="text-xs font-semibold text-ink">
            {getPeriodText()}
          </span>
          <button 
            onClick={handleNextPeriod} 
            className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
            aria-label={`下个${getPeriodLabel()}`}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="stroke-2" />
          </button>
        </div>
      </div>

      {currentTxs.length === 0 ? (
        <div className="px-4 py-8">
          <EmptyState
            title="该期间没有任何账单记录"
            description="您可以去记账或者切换到其他时间周期查看数据。"
            icon="📊"
            action={{
              label: "记一笔",
              onClick: () => navigate('/transaction/new'),
            }}
          />
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* Summary stats */}
          <SummaryCard
            income={currentIncome}
            expense={currentExpense}
            prevIncome={prevIncome}
            prevExpense={prevExpense}
            periodLabel={getPeriodLabel()}
          />

          {/* Navigation Shortcuts */}
          <div className="flex flex-col gap-3">
            <TrendPreviewCard data={trendData} />
            <BreakdownPreviewCard data={categoryRankData} />
          </div>

          {/* TOP 5 Rank */}
          {currentExpense > 0 && (
            <TopCategoriesRank 
              data={top5Rank} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
