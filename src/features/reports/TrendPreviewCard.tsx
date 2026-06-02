import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight01Icon, TrendingUpDownIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface TrendPreviewCardProps {
  // Array of monthly sums for preview (last 5-6 points)
  data: {
    label: string;
    income: number;
    expense: number;
  }[];
}

export const TrendPreviewCard: React.FC<TrendPreviewCardProps> = ({ data }) => {
  const navigate = useNavigate();

  // Generate SVG path for sparkline
  const generateSparklinePaths = () => {
    if (data.length < 2) return { incomePath: '', expensePath: '' };

    const width = 120;
    const height = 40;
    const padding = 2;

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);
    const minVal = 0;
    const range = maxVal - minVal;

    const pointsCount = data.length;
    const stepX = (width - padding * 2) / (pointsCount - 1);

    const incomePoints = data.map((d, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((d.income - minVal) / range) * (height - padding * 2);
      return { x, y };
    });

    const expensePoints = data.map((d, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((d.expense - minVal) / range) * (height - padding * 2);
      return { x, y };
    });

    const buildPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      // Smooth curve using cubic bezier approximations or simple lines
      return points.reduce((path, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        // Linear path is fine for small sparklines, or we can use smooth curves
        return `${path} L ${p.x} ${p.y}`;
      }, '');
    };

    return {
      incomePath: buildPath(incomePoints),
      expensePath: buildPath(expensePoints),
    };
  };

  const { incomePath, expensePath } = generateSparklinePaths();

  return (
    <div
      onClick={() => navigate('/reports/trends')}
      className="bg-surface-card border border-hairline p-4 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:bg-surface-cream-strong active:scale-98 transition-transform select-none"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-ink">
          <HugeiconsIcon icon={TrendingUpDownIcon} size={16} className="text-brand-primary stroke-2" />
          <span className="text-xs font-semibold">收支趋势</span>
        </div>
        <span className="text-[10px] text-muted-soft">连续的收支走向与盈余分析</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Sparkline Canvas */}
        {data.length >= 2 ? (
          <svg width="120" height="40" className="overflow-visible shrink-0 select-none">
            {/* Income line */}
            <path
              d={incomePath}
              fill="none"
              stroke="#5db872"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Expense line */}
            <path
              d={expensePath}
              fill="none"
              stroke="#cc785c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="w-[120px] h-[40px] flex items-center justify-center text-[9px] text-muted-soft">
            暂无趋势数据
          </div>
        )}

        <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-token stroke-2" />
      </div>
    </div>
  );
};
export default TrendPreviewCard;
