import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

interface AmountDisplayProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSign?: boolean;
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  className,
}) => {
  const isExpense = type === 'expense' || (type === 'neutral' && amount < 0);
  const isIncome = type === 'income' || (type === 'neutral' && amount > 0);
  
  const colorClass = isExpense 
    ? 'text-error font-medium' 
    : isIncome 
      ? 'text-success font-medium' 
      : 'text-ink';

  const sizeClasses = {
    sm: 'text-sm font-sans',
    md: 'text-base font-sans',
    lg: 'text-lg font-heading tracking-wide',
    xl: 'text-2xl font-heading tracking-wider',
    '2xl': 'text-4xl font-heading tracking-wider',
  };

  // Ensure sign is correctly set for neutral types
  let displaySign = showSign;
  if (type === 'neutral') {
    displaySign = amount !== 0;
  }

  return (
    <span className={cn('tabular-nums', colorClass, sizeClasses[size], className)}>
      {formatCurrency(amount, displaySign)}
    </span>
  );
};
