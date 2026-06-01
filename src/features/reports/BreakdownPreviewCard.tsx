import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight01Icon, PieChart02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface BreakdownDataPoint {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface BreakdownPreviewCardProps {
  data: BreakdownDataPoint[];
}

export const BreakdownPreviewCard: React.FC<BreakdownPreviewCardProps> = ({ data }) => {
  const navigate = useNavigate();

  // Helper to render mini donut chart segments
  const renderDonutChart = () => {
    if (data.length === 0) {
      return (
        <svg width="40" height="40" viewBox="0 0 32 32" className="shrink-0 select-none">
          <circle cx="16" cy="16" r="10" fill="none" stroke="#e6dfd8" strokeWidth="4" />
        </svg>
      );
    }

    const radius = 10;
    const strokeWidth = 4.5;
    const circumference = 2 * Math.PI * radius; // ~62.83
    const center = 16;

    let accumulatedPercentage = 0;

    return (
      <svg width="42" height="42" viewBox="0 0 32 32" className="shrink-0 select-none -rotate-90">
        {data.map((item, index) => {
          const strokeLength = (item.percentage / 100) * circumference;
          accumulatedPercentage += item.percentage;

          return (
            <circle
              key={item.categoryId || index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={-((accumulatedPercentage - item.percentage) / 100 * circumference)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          );
        })}
        {/* Draw a grey background circle if accumulated is less than 100 */}
        {accumulatedPercentage < 99 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e6dfd8"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference - (accumulatedPercentage / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((accumulatedPercentage / 100) * circumference)}
          />
        )}
      </svg>
    );
  };

  return (
    <div
      onClick={() => navigate('/reports/categories')}
      className="bg-surface-card border border-hairline p-4 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:bg-surface-cream-strong active:scale-98 transition-transform select-none"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-ink">
          <HugeiconsIcon icon={PieChart02Icon} size={16} className="text-brand-primary stroke-2" />
          <span className="text-xs font-semibold">分类占比</span>
        </div>
        <span className="text-[10px] text-muted-soft">查看各项支出的详细百分比构成</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Donut chart */}
        {renderDonutChart()}

        <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-token stroke-2" />
      </div>
    </div>
  );
};
export default BreakdownPreviewCard;
