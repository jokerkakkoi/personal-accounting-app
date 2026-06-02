import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { BudgetProgressCard } from '../features/budgets/BudgetProgressCard';
import { CategoryBudgetItem } from '../features/budgets/CategoryBudgetItem';
import { BudgetEditDrawer } from '../features/budgets/BudgetEditDrawer';
import { EmptyState } from '../components/EmptyState';
import { formatMonth, formatCurrency } from '../utils/format';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircleIcon, ArrowLeft01Icon, ArrowRight01Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const budgets = useAppStore(state => state.budgets);
  const categories = useAppStore(state => state.categories);
  const transactions = useAppStore(state => state.transactions);
  const updateTotalBudget = useAppStore(state => state.updateTotalBudget);
  const updateCategoryBudget = useAppStore(state => state.updateCategoryBudget);
  const deleteCategoryBudget = useAppStore(state => state.deleteCategoryBudget);
  const settings = useAppStore(state => state.settings);

  // States
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().format('YYYY-MM'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'total' | 'category'>('total');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonth(prev => dayjs(prev + '-01').subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => dayjs(prev + '-01').add(1, 'month').format('YYYY-MM'));
  };

  // Get current month budget
  const monthBudget = budgets.find(b => b.month === currentMonth) || {
    id: '',
    month: currentMonth,
    totalAmount: 0,
    spent: 0,
    categoryBudgets: [],
  };

  // Dynamically calculate spent amount for the total month to keep it fresh
  const monthExpenseTxs = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth));
  const currentMonthSpent = monthExpenseTxs.reduce((sum, t) => sum + t.amount, 0);

  // Drawer triggers
  const handleOpenTotalEdit = () => {
    setDrawerMode('total');
    setSelectedCatId(null);
    setDrawerOpen(true);
  };

  const handleOpenCategoryEdit = (catId: string) => {
    setDrawerMode('category');
    setSelectedCatId(catId);
    setDrawerOpen(true);
  };

  const handleOpenCategoryAdd = () => {
    setDrawerMode('category');
    setSelectedCatId(null);
    setDrawerOpen(true);
  };

  // Save budget handlers
  const handleSaveTotal = (amount: number) => {
    updateTotalBudget(currentMonth, amount);
  };

  const handleSaveCategory = (catId: string, amount: number) => {
    updateCategoryBudget(currentMonth, catId, amount);
  };

  const handleDeleteCategory = (catId: string) => {
    deleteCategoryBudget(currentMonth, catId);
  };

  // Header options
  const historyButton = (
    <button
      onClick={() => navigate('/budgets/history')}
      className="text-xs text-brand-primary hover:text-brand-active font-medium py-1 px-2 select-none active:scale-95 transition-transform"
    >
      历史
    </button>
  );

  // Month Switcher Component
  const monthSwitcher = (
    <div className="flex items-center gap-1 justify-center shrink-0">
      <button 
        onClick={handlePrevMonth} 
        className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
        aria-label="上个月"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="stroke-2" />
      </button>
      <span className="text-xs font-semibold text-ink min-w-[76px] text-center">
        {formatMonth(currentMonth)}
      </span>
      <button 
        onClick={handleNextMonth} 
        className="p-1.5 text-muted-token hover:text-ink active:scale-90 transition-transform"
        aria-label="下个月"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="stroke-2" />
      </button>
    </div>
  );

  // Find initial amount to display in editing Drawer
  const getInitialAmount = () => {
    if (drawerMode === 'total') {
      return monthBudget.totalAmount;
    }
    if (selectedCatId) {
      return monthBudget.categoryBudgets.find(cb => cb.categoryId === selectedCatId)?.amount || 0;
    }
    return 0;
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none">
      <PageHeader
        title="预算管理"
        rightAction={historyButton}
      />
      
      {/* Month Selector row */}
      <div className="w-full flex justify-center py-2 bg-canvas border-b border-hairline/50">
        {monthSwitcher}
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Total Budget Card */}
        <BudgetProgressCard
          spent={currentMonthSpent}
          total={monthBudget.totalAmount}
          onClick={handleOpenTotalEdit}
        />

        {/* Overspend warning banner if over limit */}
        {settings.budgetNotification && monthBudget.totalAmount > 0 && currentMonthSpent > monthBudget.totalAmount && (
          <Alert variant="destructive" className="bg-error/10 border-error/20 text-error">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 text-error stroke-2" />
            <div>
              <AlertTitle className="text-xs font-bold">总支出超出预算</AlertTitle>
              <AlertDescription className="text-[10px] mt-0.5">
                您的支出已超过预算上限 {formatCurrency(currentMonthSpent - monthBudget.totalAmount)}，请调整本月开销。
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Category Budget Section */}
        <div className="flex flex-col mt-2">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-xs font-heading font-semibold text-muted-token uppercase tracking-wider">
              分类预算明细
            </h3>
            
            {/* Add Category Budget Trigger */}
            <button
              onClick={handleOpenCategoryAdd}
              disabled={monthBudget.totalAmount <= 0}
              className="flex items-center gap-0.5 text-xs text-brand-primary disabled:text-brand-disabled font-medium active:scale-95 transition-transform"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} className="stroke-2" />
              添加
            </button>
          </div>

          {/* List of Category budgets */}
          {monthBudget.totalAmount <= 0 ? (
            <div className="mt-2">
              <EmptyState
                title="请先设置本月总预算"
                description="只有在设置了总预算后，才能对具体的消费分类设定额度。"
                icon="💡"
                action={{
                  label: "设置总预算",
                  onClick: handleOpenTotalEdit,
                }}
              />
            </div>
          ) : monthBudget.categoryBudgets.length === 0 ? (
            <div className="mt-2">
              <EmptyState
                title="未设置分类预算"
                description="您可以对餐饮、交通、购物等分类设定单独的消费预算上限。"
                icon="📊"
                action={{
                  label: "添加分类预算",
                  onClick: handleOpenCategoryAdd,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
              {monthBudget.categoryBudgets.map((cb) => {
                const cat = categories.find(c => c.id === cb.categoryId) || {
                  name: '未知分类',
                  icon: '📦',
                };
                
                // Dynamically calculate spent inside category for the month
                const cbSpent = monthExpenseTxs
                  .filter(t => t.categoryId === cb.categoryId)
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <CategoryBudgetItem
                    key={cb.categoryId}
                    categoryName={cat.name}
                    categoryIcon={cat.icon}
                    spent={cbSpent}
                    budgetAmount={cb.amount}
                    onClick={() => handleOpenCategoryEdit(cb.categoryId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings Dialog Drawer */}
      <BudgetEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        month={currentMonth}
        initialAmount={getInitialAmount()}
        selectedCategoryId={selectedCatId}
        categories={categories}
        existingCategoryBudgets={monthBudget.categoryBudgets}
        onSaveTotal={handleSaveTotal}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};
export default BudgetsPage;
