import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Alert01Icon } from '@hugeicons/core-free-icons';
import { formatCurrency } from '../../utils/format';

interface BudgetBannerProps {
  spent: number;
  total?: number | null;
}

export const BudgetBanner: React.FC<BudgetBannerProps> = ({ spent, total }) => {
  if (total == null || total <= 0) return null;

  const usagePercent = (spent / total) * 100;
  
  if (spent > total) {
    const overspent = spent - total;
    return (
      <Alert variant="destructive" className="bg-error/10 border-error/20 text-error">
        <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 text-error" />
        <div>
          <AlertTitle className="text-sm font-semibold select-none">超出预算！</AlertTitle>
          <AlertDescription className="text-xs mt-1 select-none">
            本月累计支出已超支 <span className="font-semibold">{formatCurrency(overspent)}</span>（当前预算: {formatCurrency(total)}）。请合理控制消费。
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (usagePercent >= 80) {
    return (
      <Alert className="bg-warning/10 border-warning/20 text-warning">
        <HugeiconsIcon icon={Alert01Icon} size={18} className="shrink-0 text-warning" />
        <div>
          <AlertTitle className="text-sm font-semibold select-none">预算预警</AlertTitle>
          <AlertDescription className="text-xs mt-1 select-none">
            本月预算已使用 <span className="font-semibold">{usagePercent.toFixed(1)}%</span>（剩余可用: {formatCurrency(total - spent)}）。
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return null;
};
export default BudgetBanner;
