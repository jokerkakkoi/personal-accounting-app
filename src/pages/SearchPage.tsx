import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { TransactionItem } from '../components/TransactionItem';
import { DateGroupHeader } from '../features/home/DateGroupHeader';
import { EmptyState } from '../components/EmptyState';
import { FilterDrawer } from '../features/search/FilterDrawer';
import { FilterChip } from '../features/search/FilterChip';
import { Input } from '../components/ui/input';
import { SearchFilters } from '../types';
import { groupTransactionsByDate } from '../utils/format';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft02Icon, FilterIcon } from '@hugeicons/core-free-icons';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);

  // Read initial filter state from navigation history
  const stateFilters = location.state as Partial<SearchFilters> | null;

  // States
  const [keyword, setKeyword] = useState(() => stateFilters?.keyword || '');
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    keyword: stateFilters?.keyword || '',
    type: stateFilters?.type || 'all',
    categoryIds: stateFilters?.categoryIds || undefined,
    dateRange: stateFilters?.dateRange || undefined,
    amountRange: stateFilters?.amountRange || undefined,
  }));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Synchronize state when location.state changes (re-navigation)
  useEffect(() => {
    const freshStateFilters = location.state as Partial<SearchFilters> | null;
    const nextKeyword = freshStateFilters?.keyword || '';
    setKeyword(nextKeyword);
    setFilters({
      keyword: nextKeyword,
      type: freshStateFilters?.type || 'all',
      categoryIds: freshStateFilters?.categoryIds || undefined,
      dateRange: freshStateFilters?.dateRange || undefined,
      amountRange: freshStateFilters?.amountRange || undefined,
    });
  }, [location.state]);

  // Update filters object whenever keyword changes
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    setFilters(prev => ({ ...prev, keyword: val }));
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Keyword search (note or amount)
      if (filters.keyword) {
        const kw = filters.keyword.trim().toLowerCase();
        const matchesNote = tx.note.toLowerCase().includes(kw);
        const matchesAmount = String(tx.amount).includes(kw);
        if (!matchesNote && !matchesAmount) return false;
      }

      // 2. Type filter
      if (filters.type && filters.type !== 'all') {
        if (tx.type !== filters.type) return false;
      }

      // 3. Category filter
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        if (!filters.categoryIds.includes(tx.categoryId)) return false;
      }

      // 4. Amount range filter
      if (filters.amountRange) {
        const { min, max } = filters.amountRange;
        if (min !== undefined && tx.amount < min) return false;
        if (max !== undefined && tx.amount > max) return false;
      }

      // 5. Date range filter
      if (filters.dateRange) {
        const { startDate, endDate } = filters.dateRange;
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Group transactions for display
  const groupedResults = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Active filter chip labels generator
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    // Type chip
    if (filters.type && filters.type !== 'all') {
      chips.push({
        key: 'type',
        label: filters.type === 'expense' ? '类型: 支出' : '类型: 收入',
        onRemove: () => setFilters(prev => ({ ...prev, type: 'all' })),
      });
    }

    // Date range chip
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate || endDate) {
        chips.push({
          key: 'dateRange',
          label: `日期: ${startDate || '不限'} ~ ${endDate || '不限'}`,
          onRemove: () => setFilters(prev => ({ ...prev, dateRange: undefined })),
        });
      }
    }

    // Amount range chip
    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      if (min !== undefined || max !== undefined) {
        chips.push({
          key: 'amountRange',
          label: `金额: ${[min !== undefined ? `≥${min}` : '', max !== undefined ? `≤${max}` : ''].filter(Boolean).join(' ')}`,
          onRemove: () => setFilters(prev => ({ ...prev, amountRange: undefined })),
        });
      }
    }

    // Categories chip
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const catNames = filters.categoryIds
        .map(id => categories.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      chips.push({
        key: 'categoryIds',
        label: `分类: ${catNames.length > 10 ? `${catNames.slice(0, 10)}...` : catNames}`,
        onRemove: () => setFilters(prev => ({ ...prev, categoryIds: undefined })),
      });
    }

    return chips;
  }, [filters, categories]);

  // Search input rendered in a control bar below the PageHeader
  const searchInputWidget = (
    <Input
      type="search"
      placeholder="搜索备注或金额..."
      value={keyword}
      onChange={handleKeywordChange}
      className="h-9 text-xs bg-surface-soft border border-hairline w-[210px] sm:w-[240px]"
      autoFocus
    />
  );

  const backButton = (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform"
      aria-label="返回"
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} size={20} className="stroke-2" />
    </button>
  );

  const filterButton = (
    <button
      onClick={() => setDrawerOpen(true)}
      className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform relative"
      aria-label="筛选账目"
    >
      <HugeiconsIcon icon={FilterIcon} size={20} className="stroke-2" />
      {activeChips.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-primary rounded-full ring-2 ring-canvas" />
      )}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-6 select-none">
      {/* Header bar */}
      <PageHeader
        title=""
        leftAction={backButton}
        rightAction={filterButton}
      />
      
      {/* Search Bar container block below PageHeader */}
      <div className="w-full flex justify-center py-2 px-4 bg-canvas border-b border-hairline/50">
        {searchInputWidget}
      </div>

      {/* Filter Chips List */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-hairline/30 bg-surface-soft/30 overflow-x-auto select-none">
          {activeChips.map(chip => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={chip.onRemove}
            />
          ))}
        </div>
      )}

      {/* Search Results List */}
      <div className="flex-1 flex flex-col pt-3">
        <div className="flex justify-between items-center px-4 mb-2 text-xs text-muted-token select-none">
          <span className="uppercase tracking-wider font-semibold">搜索结果</span>
          <span>共找到 {filteredTransactions.length} 笔记录</span>
        </div>

        {groupedResults.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              title="未找到匹配账目"
              description="请尝试更改搜索词，或调整筛选器的范围选项。"
              icon="🔍"
            />
          </div>
        ) : (
          <div className="flex flex-col">
            {groupedResults.map(group => (
              <div key={group.date} className="flex flex-col">
                <DateGroupHeader
                  date={group.date}
                  dayIncome={group.dayIncome}
                  dayExpense={group.dayExpense}
                />
                <div className="flex flex-col bg-canvas">
                  {group.transactions.map(tx => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onClick={() => navigate(`/transaction/${tx.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />
    </div>
  );
};
export default SearchPage;
