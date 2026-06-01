import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Category, CategoryBudget } from '../../types';

interface BudgetEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'total' | 'category';
  month: string;
  initialAmount: number;
  selectedCategoryId?: string | null;
  categories: Category[];
  existingCategoryBudgets: CategoryBudget[];
  onSaveTotal: (amount: number) => void;
  onSaveCategory: (catId: string, amount: number) => void;
  onDeleteCategory: (catId: string) => void;
}

export const BudgetEditDrawer: React.FC<BudgetEditDrawerProps> = ({
  open,
  onOpenChange,
  mode,
  month,
  initialAmount,
  selectedCategoryId,
  categories,
  existingCategoryBudgets,
  onSaveTotal,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string>('');

  const isEditingCategory = mode === 'category' && !!selectedCategoryId;

  // Filter out categories that already have budgets set, except the one we're currently editing
  const availableCategories = categories.filter(c => 
    c.type === 'expense' && 
    (c.id === selectedCategoryId || !existingCategoryBudgets.some(eb => eb.categoryId === c.id))
  );

  // Sync initial values
  useEffect(() => {
    if (open) {
      setAmount(initialAmount > 0 ? String(initialAmount) : '');
      setCatId(selectedCategoryId || '');
    }
  }, [open, initialAmount, selectedCategoryId]);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) return;

    if (mode === 'total') {
      onSaveTotal(numAmount);
    } else {
      if (!catId) return;
      onSaveCategory(catId, numAmount);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (mode === 'category' && catId) {
      onDeleteCategory(catId);
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-canvas border border-hairline max-h-[80vh] flex flex-col">
        <DrawerHeader className="shrink-0 select-none">
          <DrawerTitle className="text-base font-heading font-medium text-ink text-center">
            {mode === 'total' ? '设置总预算' : isEditingCategory ? '修改分类预算' : '添加分类预算'}
          </DrawerTitle>
          <DrawerDescription className="text-center text-[10px] text-muted-token">
            月份: {month} — 设置您合理的支出预算限额
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4 pb-6">
          {/* Mode Category select dropdown (only if adding a new category budget) */}
          {mode === 'category' && !isEditingCategory && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-token select-none">选择费用分类</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="w-full h-10 text-xs bg-canvas border border-hairline">
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-canvas border border-hairline max-h-[200px]">
                  {availableCategories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mode Category title display (only if editing an existing category budget) */}
          {mode === 'category' && isEditingCategory && (
            <div className="flex items-center gap-3 bg-surface-soft border border-hairline p-3 rounded-lg select-none">
              <span className="text-2xl">
                {categories.find(c => c.id === catId)?.icon || '📦'}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-ink">
                  {categories.find(c => c.id === catId)?.name || '未知分类'}
                </span>
                <span className="text-[10px] text-muted-soft">编辑该分类的支出预算金额</span>
              </div>
            </div>
          )}

          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-amount" className="text-xs text-muted-token select-none">预算金额 (元)</Label>
            <Input
              id="budget-amount"
              type="number"
              placeholder="请输入预算金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-canvas border border-hairline h-10 text-xs"
            />
          </div>
        </div>

        {/* Action buttons */}
        <DrawerFooter className="border-t border-hairline p-4 flex flex-col gap-2 shrink-0 select-none">
          <div className="flex gap-3">
            {mode === 'category' && isEditingCategory && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 py-5 text-sm rounded-md border-error/20 hover:bg-error/5 text-error active:scale-95 transition-transform"
              >
                删除预算
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!amount || (mode === 'category' && !catId)}
              className="flex-1 bg-brand-primary hover:bg-brand-active text-white py-5 text-sm rounded-md shadow-sm active:scale-95 transition-transform"
            >
              保存
            </Button>
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="py-5 text-sm border-hairline text-ink rounded-md active:scale-95 transition-transform"
          >
            取消
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default BudgetEditDrawer;
