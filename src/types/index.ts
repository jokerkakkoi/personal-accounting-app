export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string; // ISO date string YYYY-MM-DD
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  note: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  aiClassified?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  type: 'income' | 'expense';
  isPredefined: boolean;
  isDefault?: boolean;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number;
  spent: number;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  totalAmount: number;
  spent: number;
  categoryBudgets: CategoryBudget[];
}

export interface AIConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number; // in seconds
  promptTemplate: string;
}

export interface BackupMetadata {
  version: string;
  exportDate: string; // ISO string
  transactionCount: number;
  categoryCount: number;
  budgetCount: number;
}

export interface AppSettings {
  budgetNotification: boolean;
  recurringNotification: boolean;
  hasSeenWelcome: boolean;
}

export interface DateRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface AmountRange {
  min?: number;
  max?: number;
}

export interface SearchFilters {
  keyword: string;
  type?: 'income' | 'expense' | 'all';
  categoryIds?: string[];
  dateRange?: DateRange;
  amountRange?: AmountRange;
}
