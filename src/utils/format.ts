import dayjs from 'dayjs';
import { Transaction } from '../types';

export function formatCurrency(amount: number, showSign: boolean = false): string {
  const formatted = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  // Replace the default Currency sign space if any
  const cleanFormatted = formatted.replace('CNY', '¥').replace('元', '');
  
  if (amount < 0) {
    return `-${cleanFormatted}`;
  }
  return showSign && amount > 0 ? `+${cleanFormatted}` : cleanFormatted;
}

export function formatDate(dateStr: string): string {
  const date = dayjs(dateStr);
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return '今天';
  } else if (date.isSame(yesterday, 'day')) {
    return '昨天';
  }
  
  return date.format('YYYY-MM-DD');
}

export function formatTime(timeStr: string): string {
  // Expected input 'HH:mm'
  return timeStr;
}

export function formatMonth(monthStr: string): string {
  // Expected input 'YYYY-MM'
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    return `${year} 年 ${month} 月`;
  }
  return monthStr;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export interface GroupedTransactions {
  date: string;
  transactions: Transaction[];
  dayIncome: number;
  dayExpense: number;
}

export function groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
  const groups: { [key: string]: Transaction[] } = {};
  
  // Sort transactions by date desc, then by time desc
  const sorted = [...transactions].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time}`;
    const dateTimeB = `${b.date}T${b.time}`;
    return dateTimeB.localeCompare(dateTimeA);
  });

  sorted.forEach(t => {
    if (!groups[t.date]) {
      groups[t.date] = [];
    }
    groups[t.date].push(t);
  });

  return Object.keys(groups).map(date => {
    const txs = groups[date];
    let dayIncome = 0;
    let dayExpense = 0;
    txs.forEach(t => {
      if (t.type === 'income') {
        dayIncome += t.amount;
      } else {
        dayExpense += t.amount;
      }
    });
    
    return {
      date,
      transactions: txs,
      dayIncome,
      dayExpense,
    };
  });
}
