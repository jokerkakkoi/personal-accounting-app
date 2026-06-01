import React from 'react';
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
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { ScrollArea } from '../../components/ui/scroll-area';
import { CategoryIcon } from '../../components/CategoryIcon';
import { SearchFilters, Category } from '../../types';
import { cn } from '@/lib/utils';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  categories: Category[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onOpenChange,
  filters,
  onChange,
  categories,
}) => {
  const [localType, setLocalType] = React.useState<'all' | 'income' | 'expense'>(
    filters.type || 'all'
  );
  const [minAmount, setMinAmount] = React.useState(
    filters.amountRange?.min !== undefined ? String(filters.amountRange.min) : ''
  );
  const [maxAmount, setMaxAmount] = React.useState(
    filters.amountRange?.max !== undefined ? String(filters.amountRange.max) : ''
  );
  const [startDate, setStartDate] = React.useState(filters.dateRange?.startDate || '');
  const [endDate, setEndDate] = React.useState(filters.dateRange?.endDate || '');
  const [selectedCats, setSelectedCats] = React.useState<string[]>(
    filters.categoryIds || []
  );

  // Sync state if filters prop changes
  React.useEffect(() => {
    setLocalType(filters.type || 'all');
    setMinAmount(filters.amountRange?.min !== undefined ? String(filters.amountRange.min) : '');
    setMaxAmount(filters.amountRange?.max !== undefined ? String(filters.amountRange.max) : '');
    setStartDate(filters.dateRange?.startDate || '');
    setEndDate(filters.dateRange?.endDate || '');
    setSelectedCats(filters.categoryIds || []);
  }, [filters, open]);

  // Toggle Category selection
  const handleCatToggle = (catId: string) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleApply = () => {
    const minVal = minAmount !== '' ? parseFloat(minAmount) : undefined;
    const maxVal = maxAmount !== '' ? parseFloat(maxAmount) : undefined;

    const newFilters: SearchFilters = {
      ...filters,
      type: localType,
      amountRange: (minVal !== undefined || maxVal !== undefined) 
        ? { min: minVal, max: maxVal } 
        : undefined,
      dateRange: (startDate || endDate) 
        ? { startDate: startDate || undefined, endDate: endDate || undefined } 
        : undefined,
      categoryIds: selectedCats.length > 0 ? selectedCats : undefined,
    };

    onChange(newFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalType('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSelectedCats([]);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-canvas border border-hairline max-h-[85vh] flex flex-col">
        <DrawerHeader className="shrink-0">
          <DrawerTitle className="text-base font-heading font-medium text-ink select-none text-center">筛选账目</DrawerTitle>
          <DrawerDescription className="text-center text-[10px] text-muted-token select-none">缩小搜索范围以查找特定交易</DrawerDescription>
        </DrawerHeader>

        {/* Form elements Scroll Area */}
        <ScrollArea className="flex-1 overflow-y-auto px-5 py-2">
          <div className="flex flex-col gap-5 pb-6">
            {/* Type selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-ink select-none">收支类型</Label>
              <ToggleGroup
                type="single"
                value={localType}
                onValueChange={(val) => val && setLocalType(val as 'all' | 'income' | 'expense')}
                className="justify-start gap-2"
              >
                <ToggleGroupItem value="all" className="text-xs h-8 px-4 border border-hairline rounded-md data-[state=on]:bg-brand-primary data-[state=on]:text-white">全部</ToggleGroupItem>
                <ToggleGroupItem value="expense" className="text-xs h-8 px-4 border border-hairline rounded-md data-[state=on]:bg-brand-primary data-[state=on]:text-white">支出</ToggleGroupItem>
                <ToggleGroupItem value="income" className="text-xs h-8 px-4 border border-hairline rounded-md data-[state=on]:bg-brand-primary data-[state=on]:text-white">收入</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Date range selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-ink select-none">日期区间</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 h-8 text-xs bg-canvas border border-hairline"
                />
                <span className="text-muted-token text-xs select-none">至</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 h-8 text-xs bg-canvas border border-hairline"
                />
              </div>
            </div>

            {/* Amount range selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-ink select-none">金额范围 (元)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最小金额"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="flex-1 h-8 text-xs bg-canvas border border-hairline"
                />
                <span className="text-muted-token text-xs select-none">至</span>
                <Input
                  type="number"
                  placeholder="最大金额"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="flex-1 h-8 text-xs bg-canvas border border-hairline"
                />
              </div>
            </div>

            {/* Category multi-selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold text-ink select-none">选择分类 (可多选)</Label>
              <div className="grid grid-cols-4 gap-y-3 gap-x-1.5 py-1">
                {categories
                  .filter((c) => localType === 'all' || c.type === localType)
                  .map((category) => {
                    const isSelected = selectedCats.includes(category.id);
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleCatToggle(category.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCatToggle(category.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="flex flex-col items-center gap-1 cursor-pointer select-none active:scale-95 transition-transform focus:outline-none"
                      >
                        <CategoryIcon
                          icon={category.icon}
                          selected={isSelected}
                          size="sm"
                        />
                        <span
                          className={cn(
                            'text-[9px] truncate max-w-[56px] text-center font-medium',
                            isSelected ? 'text-brand-primary font-bold' : 'text-body'
                          )}
                        >
                          {category.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer controls */}
        <DrawerFooter className="border-t border-hairline p-4 flex flex-row gap-3 shrink-0 select-none">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 py-5 text-sm rounded-md border-hairline text-ink active:scale-95"
          >
            重置
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-brand-primary hover:bg-brand-active text-white py-5 text-sm rounded-md shadow-sm active:scale-95"
          >
            筛选
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default FilterDrawer;
