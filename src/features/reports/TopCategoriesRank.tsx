import React from 'react';
import { CategoryIcon } from '../../components/CategoryIcon';
import { formatCurrency, formatPercent } from '../../utils/format';
import { cn } from '@/lib/utils';

interface TopCategoryItem {
  categoryId: string;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TopCategoriesRankProps {
  data: TopCategoryItem[];
}

export const TopCategoriesRank: React.FC<TopCategoriesRankProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-token">
        本期无支出排行数据。
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
      <div className="px-4 py-2.5 bg-surface-soft/40 border-b border-hairline/40">
        <h4 className="text-[10px] font-bold text-muted-token uppercase tracking-wider">
          支出排行榜 (TOP 5)
        </h4>
      </div>

      <div className="flex flex-col">
        {data.map((item, index) => {
          return (
            <div 
              key={item.categoryId || index}
              className="flex items-center gap-3 px-4 py-3 border-b border-hairline/30 last:border-b-0 min-h-[52px] select-none"
            >
              {/* Rank Number Badge */}
              <span className={cn(
                "text-xs font-bold w-4 text-center shrink-0",
                index === 0 ? "text-error" : index === 1 ? "text-brand-primary" : "text-muted-token"
              )}>
                {index + 1}
              </span>

              {/* Category Icon */}
              <CategoryIcon icon={item.icon} size="sm" className="shrink-0" />

              {/* Progress Detail */}
              <div className="flex-1 flex flex-col min-w-0 gap-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-ink truncate">{item.name}</span>
                  <span className="text-[10px] text-muted-soft">
                    {formatCurrency(item.amount)}
                    <span className="ml-1.5 font-semibold text-ink">
                      {formatPercent(item.percentage)}
                    </span>
                  </span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full h-1.5 bg-brand-disabled rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TopCategoriesRank;
