import React, { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { SegmentControl } from '../components/SegmentControl';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose,
  DrawerFooter
} from '../components/ui/drawer';
import { formatCurrency, formatPercent, formatMonth } from '../utils/format';
import { cn } from '@/lib/utils';
import ReactECharts from 'echarts-for-react';
import { Calendar01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';



export const TrendsPage: React.FC = () => {
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);

  // States
  const [rangeType, setRangeType] = useState<6 | 12 | 60 | 'custom'>(6);
  const [customStart, setCustomStart] = useState(() => dayjs().subtract(5, 'month').format('YYYY-MM'));
  const [customEnd, setCustomEnd] = useState(() => dayjs().format('YYYY-MM'));
  const [showCustomSelector, setShowCustomSelector] = useState(false);

  // Drawer for point details
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Helper to generate period list based on rangeType
  const getPeriods = () => {
    const periods: string[] = [];
    const now = dayjs();

    if (rangeType === 6) {
      for (let i = 5; i >= 0; i--) {
        periods.push(now.subtract(i, 'month').format('YYYY-MM'));
      }
    } else if (rangeType === 12) {
      for (let i = 11; i >= 0; i--) {
        periods.push(now.subtract(i, 'month').format('YYYY-MM'));
      }
    } else if (rangeType === 60) {
      for (let i = 4; i >= 0; i--) {
        periods.push(now.subtract(i, 'year').format('YYYY'));
      }
    } else if (rangeType === 'custom') {
      let current = dayjs(customStart + '-01');
      const end = dayjs(customEnd + '-01');
      // Limit safety check to prevent infinite loop
      let count = 0;
      while ((current.isBefore(end) || current.isSame(end, 'month')) && count < 60) {
        periods.push(current.format('YYYY-MM'));
        current = current.add(1, 'month');
        count++;
      }
    }

    return periods;
  };

  const periods = getPeriods();

  // Compute income and expenses per period
  const chartData = periods.map(period => {
    const periodTxs = transactions.filter(t => t.date.startsWith(period));
    const income = periodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = periodTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      period,
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      balance: parseFloat((income - expense).toFixed(2)),
    };
  });

  // Calculate overall statistics
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
  const netBalance = totalIncome - totalExpense;
  const avgExpense = chartData.length > 0 ? totalExpense / chartData.length : 0;
  const maxExpense = chartData.length > 0 ? Math.max(...chartData.map(d => d.expense)) : 0;

  // Chart configuration
  const xAxisData = chartData.map(d => {
    if (d.period.length === 4) {
      return d.period + '年';
    }
    return formatMonth(d.period);
  });

  const incomeSeriesData = chartData.map(d => d.income);
  const expenseSeriesData = chartData.map(d => d.expense);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#efe9de', // surface-card
      borderColor: '#e6dfd8', // hairline
      borderWidth: 1,
      textStyle: {
        color: '#141413',
        fontFamily: 'Inter Variable, sans-serif',
        fontSize: 11,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#cc785c',
          width: 1,
          type: 'dashed'
        }
      }
    },
    legend: {
      data: ['收入', '支出'],
      textStyle: {
        color: '#6c6a64',
        fontFamily: 'Inter Variable, sans-serif',
        fontSize: 10,
      },
      bottom: '0%',
      icon: 'circle',
    },
    grid: {
      left: '4%',
      right: '6%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: '#e6dfd8',
        }
      },
      axisLabel: {
        color: '#6c6a64',
        fontFamily: 'Inter Variable, sans-serif',
        fontSize: 9,
        interval: chartData.length > 8 ? 1 : 0, // avoid overlaps if too many points
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#ebe6df',
        }
      },
      axisLabel: {
        color: '#6c6a64',
        fontFamily: 'Inter Variable, sans-serif',
        fontSize: 9,
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: incomeSeriesData,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        itemStyle: {
          color: '#5db872',
        },
        lineStyle: {
          width: 2,
        }
      },
      {
        name: '支出',
        type: 'line',
        data: expenseSeriesData,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        itemStyle: {
          color: '#cc785c',
        },
        lineStyle: {
          width: 2,
        }
      }
    ]
  };

  // ECharts Click event handler
  const onChartClick = (params: any) => {
    // Look up matching data point from chartData
    const dataIndex = params.dataIndex;
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      const dataPoint = chartData[dataIndex];
      setSelectedPeriod(dataPoint.period);
      setDrawerOpen(true);
    }
  };

  const handleRangeChange = (val: string) => {
    if (val === 'custom') {
      setRangeType('custom');
      setShowCustomSelector(true);
    } else {
      setRangeType(Number(val) as 6 | 12 | 60);
      setShowCustomSelector(false);
    }
  };

  // Get details for the selected period in Drawer
  const getSelectedPeriodDetails = () => {
    if (!selectedPeriod) return null;
    const periodTxs = transactions.filter(t => t.date.startsWith(selectedPeriod));
    const income = periodTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = periodTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Group expense by category
    const expTxs = periodTxs.filter(t => t.type === 'expense');
    const categorySums: Record<string, number> = {};
    expTxs.forEach(t => {
      categorySums[t.categoryId] = (categorySums[t.categoryId] || 0) + t.amount;
    });

    const categoryList = Object.entries(categorySums)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId) || { name: '其他', icon: '📦' };
        return {
          id: catId,
          name: cat.name,
          icon: cat.icon,
          amount,
          percent: expense > 0 ? (amount / expense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4); // Limit to top 4

    return {
      period: selectedPeriod,
      income,
      expense,
      balance: income - expense,
      categories: categoryList,
      txCount: periodTxs.length,
    };
  };

  const drawerDetails = getSelectedPeriodDetails();

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none min-h-screen">
      <PageHeader
        title="收支趋势"
        showBack={true}
      />

      {/* Segment Range Control */}
      <div className="px-4 py-3 bg-canvas border-b border-hairline/50 flex flex-col gap-3">
        <SegmentControl
          options={[
            { value: '6', label: '近6月' },
            { value: '12', label: '近12月' },
            { value: '60', label: '近5年' },
            { value: 'custom', label: '自定义' },
          ]}
          value={String(rangeType)}
          onChange={handleRangeChange}
        />

        {/* Custom Range picker inputs */}
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

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* ECharts Line Chart container */}
        <div className="bg-surface-card border border-hairline rounded-lg p-3 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] text-muted-token uppercase font-bold tracking-wider">收支趋势曲线</span>
            <span className="text-[9px] text-muted-soft flex items-center gap-0.5">
              💡 提示：点击数据点可查看明细
            </span>
          </div>

          <div className="w-full h-[260px] relative select-none">
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%' }}
              onEvents={{
                click: onChartClick
              }}
              notMerge={true}
            />
          </div>
        </div>

        {/* Overall Stats Table */}
        <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-2.5 bg-surface-soft/40 border-b border-hairline/40">
            <h4 className="text-[10px] font-bold text-muted-token uppercase tracking-wider">
              本期数据汇总
            </h4>
          </div>

          <div className="divide-y divide-hairline/40 text-xs">
            <div className="flex justify-between py-2.5 px-4">
              <span className="text-muted-token">总计收入</span>
              <span className="font-semibold text-success">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between py-2.5 px-4">
              <span className="text-muted-token">总计支出</span>
              <span className="font-semibold text-error">{formatCurrency(totalExpense)}</span>
            </div>
            <div className="flex justify-between py-2.5 px-4">
              <span className="text-muted-token">净结余</span>
              <span className={cn("font-bold", netBalance >= 0 ? "text-ink" : "text-error")}>
                {formatCurrency(netBalance)}
              </span>
            </div>
            <div className="flex justify-between py-2.5 px-4">
              <span className="text-muted-token">{rangeType === 60 ? '平均年度支出' : '平均月度支出'}</span>
              <span className="font-medium text-ink">{formatCurrency(avgExpense)}</span>
            </div>
            <div className="flex justify-between py-2.5 px-4">
              <span className="text-muted-token">{rangeType === 60 ? '最高单年支出' : '最高单月支出'}</span>
              <span className="font-medium text-error">{formatCurrency(maxExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Point Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-canvas border border-hairline">
          {drawerDetails && (
            <>
              <DrawerHeader className="text-center select-none pb-2">
                <DrawerTitle className="text-base font-heading font-medium text-ink flex items-center justify-center gap-2">
                  <HugeiconsIcon icon={Calendar01Icon} size={18} className="text-brand-primary stroke-2" />
                  {drawerDetails.period.length === 4 
                    ? drawerDetails.period + '年' 
                    : formatMonth(drawerDetails.period)} 财务明细
                </DrawerTitle>
                <DrawerDescription className="text-[10px] text-muted-token mt-0.5">
                  共计 {drawerDetails.txCount} 笔账单记录
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-5 py-2 flex flex-col gap-4">
                {/* Stats Summary inside drawer */}
                <div className="grid grid-cols-3 gap-3 bg-surface-soft/60 border border-hairline/40 rounded-lg p-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-soft">收入</span>
                    <span className="text-xs font-semibold text-success mt-0.5 truncate">
                      {formatCurrency(drawerDetails.income)}
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-hairline/50">
                    <span className="text-[9px] text-muted-soft">支出</span>
                    <span className="text-xs font-semibold text-error mt-0.5 truncate">
                      {formatCurrency(drawerDetails.expense)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-soft">结余</span>
                    <span className={cn(
                      "text-xs font-bold mt-0.5 truncate",
                      drawerDetails.balance >= 0 ? "text-ink" : "text-error"
                    )}>
                      {formatCurrency(drawerDetails.balance)}
                    </span>
                  </div>
                </div>

                {/* Top Category Spending inside drawer */}
                {drawerDetails.expense > 0 && drawerDetails.categories.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-muted-token font-semibold uppercase tracking-wider">
                      支出占比 Top 4
                    </span>
                    <div className="flex flex-col border border-hairline/60 rounded-lg bg-canvas overflow-hidden">
                      {drawerDetails.categories.map((c, index) => {
                        return (
                          <div 
                            key={c.id || index}
                            className="flex items-center justify-between px-3 py-2 border-b border-hairline/40 last:border-b-0 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span>{c.icon}</span>
                              <span className="font-medium text-ink truncate">{c.name}</span>
                              <span className="text-[9px] text-muted-soft">({formatPercent(c.percent)})</span>
                            </div>
                            <span className="font-semibold text-error">{formatCurrency(c.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <DrawerFooter className="px-5 pb-8 pt-4 gap-2">
                <DrawerClose asChild>
                  <button className="w-full py-2.5 text-xs text-muted-token bg-surface-soft hover:bg-surface-cream-strong rounded-md font-semibold select-none border border-hairline active:scale-98 transition-transform">
                    关闭
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TrendsPage;
