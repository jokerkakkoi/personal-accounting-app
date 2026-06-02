import { Transaction, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { AmountDisplay } from './AmountDisplay';
import { useAppStore } from '../stores/app-store';
import { cn } from '@/lib/utils';
import { formatTime } from '../utils/format';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon } from '@hugeicons/core-free-icons';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onClick?: () => void;
  className?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  onClick,
  className,
}) => {
  const storeCategories = useAppStore(state => state.categories);
  
  // Find category if not passed as prop
  const txCategory = category || storeCategories.find(c => c.id === transaction.categoryId) || {
    id: 'unknown',
    name: '未知分类',
    icon: '📦',
    type: transaction.type,
    isPredefined: true,
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-3 bg-canvas border-b border-hairline hover:bg-surface-cream-strong select-none',
        onClick && 'cursor-pointer active:bg-surface-cream-strong',
        className
      )}
      style={{ minHeight: '64px' }} // Ensures standard mobile tap area
    >
      <div className="flex items-center gap-3">
        <CategoryIcon icon={txCategory.icon} size="md" className="shrink-0" />
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-ink truncate">
              {txCategory.name}
            </span>
            {transaction.aiClassified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-accent-teal/10 text-accent-teal px-1 rounded-sm select-none">
                <HugeiconsIcon icon={SparklesIcon} size={8} className="fill-accent-teal" />
                AI
              </span>
            )}
          </div>
          <span className="text-xs text-muted-token truncate max-w-[180px]">
            {transaction.note || '无备注'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-end shrink-0">
        <AmountDisplay
          amount={transaction.amount}
          type={transaction.type}
          size="md"
          showSign={true}
        />
        <span className="text-[10px] text-muted-soft mt-0.5">
          {formatTime(transaction.time)}
        </span>
      </div>
    </div>
  );
};
