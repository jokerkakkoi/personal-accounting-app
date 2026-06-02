import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { SegmentControl } from '../components/SegmentControl';
import { CategoryIcon } from '../components/CategoryIcon';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatPercent } from '../utils/format';
import { cn } from '@/lib/utils';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const CATEGORY_COLORS = [
  '#cc785c', // Coral (brand primary)
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

export const CategoryBreakdownPage: React.FC = () => {
  const navigate = useNavigate();
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);

  // States
  const [rangeType, setRangeType] = useState<'this-month' | 'last-month' | '3m' | '12m' | 'custom'>('this-month');
  const [customStart, setCustomStart] = useState(() => dayjs().subtract(2, 'month').format('YYYY-MM'));
  const [customEnd, setCustomEnd] = useState(() => dayjs().format('YYYY-MM'));
  const [showCustomSelector, setShowCustomSelector] = useState(false);
  const [highlightedCatId, setHighlightedCatId] = useState<string | null>(null);

  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Filter transactions for the selected range (only expenses)
  const getFilteredExpenses = () => {
    const now = dayjs();
    const expenseTxs = transactions.filter(t => t.type === 'expense');

    return expenseTxs.filter(t => {
      const txDate = dayjs(t.date);
      switch (rangeType) {
        case 'this-month':
          return t.date.startsWith(now.format('YYYY-MM'));
        case 'last-month':
          return t.date.startsWith(now.subtract(1, 'month').format('YYYY-MM'));
        case '3m': {
          const limit = now.subtract(2, 'month').startOf('month');
          return (txDate.isAfter(limit) || txDate.isSame(limit, 'day')) && (txDate.isBefore(now) || txDate.isSame(now, 'day'));
        }
        case '12m': {
          const limit = now.subtract(11, 'month').startOf('month');
          return (txDate.isAfter(limit) || txDate.isSame(limit, 'day')) && (txDate.isBefore(now) || txDate.isSame(now, 'day'));
        }
        case 'custom': {
          const start = dayjs(customStart + '-01').startOf('month');
          const end = dayjs(customEnd + '-01').endOf('month');
          return (txDate.isAfter(start) || txDate.isSame(start, 'day')) && (txDate.isBefore(end) || txDate.isSame(end, 'day'));
        }
        default:
          return false;
      }
    });
  };

  const currentExpenses = getFilteredExpenses();
  const totalExpenseAmount = currentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseCount = currentExpenses.length;

  // Group by category
  const expenseByCategory: Record<string, { amount: number; count: number }> = {};
  currentExpenses.forEach(t => {
    if (!expenseByCategory[t.categoryId]) {
      expenseByCategory[t.categoryId] = { amount: 0, count: 0 };
    }
    expenseByCategory[t.categoryId].amount += t.amount;
    expenseByCategory[t.categoryId].count += 1;
  });

  const breakdownData = Object.entries(expenseByCategory)
    .map(([catId, stats], idx) => {
      const cat = categories.find(c => c.id === catId) || {
        name: '未知分类',
        icon: '📦',
      };
      const percentage = totalExpenseAmount > 0 ? (stats.amount / totalExpenseAmount) * 100 : 0;
      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      const avgAmount = stats.count > 0 ? stats.amount / stats.count : 0;

      return {
        categoryId: catId,
        name: cat.name,
        icon: cat.icon,
        amount: stats.amount,
        count: stats.count,
        percentage,
        avgAmount,
        color,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // ECharts Donut Chart options
  const seriesData = breakdownData.map(d => ({
    name: d.name,
    value: parseFloat(d.amount.toFixed(2)),
    categoryId: d.categoryId,
    itemStyle: {
      color: d.color
    }
  }));

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: '#efe9de',
      borderColor: '#e6dfd8',
      borderWidth: 1,
      textStyle: {
        color: '#141413',
        fontFamily: 'Inter Variable, sans-serif',
        fontSize: 11,
      }
    },
    series: [
      {
        name: '分类支出占比',
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#faf9f5',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: false, // We render the center total using DOM for styling control
          }
        },
        labelLine: {
          show: false
        },
        data: seriesData,
      }
    ]
  };

  // ECharts Click Event
  const onChartClick = (params: any) => {
    const catName = params.name;
    const matched = breakdownData.find(d => d.name === catName);
    if (matched) {
      setHighlightedCatId(matched.categoryId);
      
      // Clear any existing timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Automatically reset highlight after a visual feedback interval
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedCatId(null);
      }, 3000);

      // Scroll to that element if it exists in DOM
      const element = document.getElementById(`cat-item-${matched.categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleRangeChange = (val: string) => {
    if (val === 'custom') {
      setRangeType('custom');
      setShowCustomSelector(true);
    } else {
      setRangeType(val as 'this-month' | 'last-month' | '3m' | '12m');
      setShowCustomSelector(false);
    }
    setHighlightedCatId(null);
  };

  // Click on list item navigates to search
  const handleItemClick = (catId: string) => {
    // Navigate to Search Page with specific filter pre-filled
    navigate('/search', {
      state: {
        categoryIds: [catId],
        type: 'expense'
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none min-h-screen">
      <PageHeader
        title="分类支出明细"
        showBack={true}
      />

      {/* Segment controls */}
      <div className="px-4 py-3 bg-canvas border-b border-hairline/50 flex flex-col gap-3">
        <SegmentControl
          options={[
            { value: 'this-month', label: '本月' },
            { value: 'last-month', label: '上月' },
            { value: '3m', label: '近3月' },
            { value: '12m', label: '近12月' },
            { value: 'custom', label: '自定义' },
          ]}
          value={rangeType}
          onChange={handleRangeChange}
        />

        {/* Custom Range pickers */}
        {rangeType === 'custom' && showCustomSelector && (
          <div className="flex items-center gap-2 justify-center bg-surface-soft p-2 rounded-lg">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-token font-medium">开始</span>
              <input
                type="month"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={customEnd}
                className="bg-canvas border border-hairline rounded px-1.5 py-0.5 text-xs text-ink font-semibold outline-none focus:border-brand-primary"
              />
            </div>
            <span className="text-muted-token text-xs font-semibold">至</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-token font-medium">结束</span>
              <input
                type="month"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                min={customStart}
                max={dayjs().format('YYYY-MM')}
                className="bg-canvas border border-hairline rounded px-1.5 py-0.5 text-xs text-ink font-semibold outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        )}
      </div>

      {breakdownData.length === 0 ? (
        <div className="px-4 py-8">
          <EmptyState
            title="该期间无任何支出账目"
            description="您可以去记账或者切换到其他时间周期查看数据。"
            icon="🥧"
            action={{
              label: "去记账",
              onClick: () => navigate('/transaction/new'),
            }}
          />
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* ECharts Donut Chart Container */}
          <div className="bg-surface-card border border-hairline rounded-lg p-3 shadow-sm flex flex-col relative">
            <div className="flex justify-between items-center mb-1 px-1">
              <span className="text-[10px] text-muted-token uppercase font-bold tracking-wider">支出占比构成</span>
              <span className="text-[9px] text-muted-soft">💡 提示：点击饼图区域可定位分类</span>
            </div>

            {/* Render donut chart + center text overlay */}
            <div className="relative w-full h-[220px] flex items-center justify-center">
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none z-10">
                <span className="text-[10px] text-muted-soft uppercase font-semibold">总支出</span>
                <span className="text-xl font-sans font-semibold text-ink mt-0.5">
                  {formatCurrency(totalExpenseAmount)}
                </span>
                <span className="text-[9px] text-muted-soft mt-0.5">{totalExpenseCount}笔支出</span>
              </div>

              <div className="w-full h-full">
                <ReactECharts
                  option={chartOption}
                  style={{ height: '100%', width: '100%' }}
                  onEvents={{
                    click: onChartClick
                  }}
                  notMerge={true}
                />
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-xs font-heading font-semibold text-muted-token uppercase tracking-wider">
                分类支出排行
              </h3>
            </div>

            <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
              {breakdownData.map((item) => {
                const isHighlighted = highlightedCatId === item.categoryId;

                return (
                  <div
                    key={item.categoryId}
                    id={`cat-item-${item.categoryId}`}
                    onClick={() => handleItemClick(item.categoryId)}
                    className={cn(
                      "flex items-center gap-3 p-3 bg-canvas border-b border-hairline/50 hover:bg-surface-soft active:bg-surface-soft/80 cursor-pointer select-none transition-all duration-300 min-h-[64px]",
                      isHighlighted && "bg-brand-primary/10 border-brand-primary/30"
                    )}
                  >
                    {/* Category Icon */}
                    <CategoryIcon icon={item.icon} size="sm" className="shrink-0" />

                    {/* Left: Details */}
                    <div className="flex-1 flex flex-col min-w-0 gap-0.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-semibold text-ink truncate">{item.name}</span>
                        <span className="text-[10px] text-muted-soft font-medium">
                          {item.count} 笔
                        </span>
                      </div>
                      
                      {/* Subtext: Average */}
                      <span className="text-[10px] text-muted-soft">
                        笔均: {formatCurrency(item.avgAmount)}
                      </span>
                    </div>

                    {/* Right: Amount & Percent */}
                    <div className="shrink-0 text-right min-w-[70px] flex flex-col gap-0.5 items-end justify-center pl-2">
                      <span className="text-xs font-semibold text-error font-sans">
                        -{formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] font-semibold text-ink tabular-nums" style={{ color: item.color }}>
                        {formatPercent(item.percentage)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Summary Row */}
              <div className="bg-surface-soft/30 p-3.5 border-t border-hairline/80 flex justify-between items-center text-xs font-semibold text-ink">
                <span>合计记录: {totalExpenseCount} 笔</span>
                <span>总金额: {formatCurrency(totalExpenseAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBreakdownPage;
