import React, { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { SegmentControl } from '../components/SegmentControl';
import { CategoryIcon } from '../components/CategoryIcon';
import { Button } from '../components/ui/button';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle 
} from '../components/ui/drawer';
import { CategoryEditDrawer } from '../features/categories/CategoryEditDrawer';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, MoreHorizontalIcon, StarIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

export const CategoriesPage: React.FC = () => {
  const categories = useAppStore(state => state.categories);
  const addCategory = useAppStore(state => state.addCategory);
  const updateCategory = useAppStore(state => state.updateCategory);
  const deleteCategory = useAppStore(state => state.deleteCategory);
  const setDefaultCategory = useAppStore(state => state.setDefaultCategory);

  // States
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  // Handlers for adding category
  const handleAddNew = () => {
    setSelectedCategory(null);
    setEditDrawerOpen(true);
  };

  // Handlers for click options
  const handleRowClick = (cat: any) => {
    setSelectedCategory(cat);
    setOptionsDrawerOpen(true);
  };

  const handleSetDefault = () => {
    if (selectedCategory) {
      setDefaultCategory(selectedCategory.id);
      toast.success(`已将“${selectedCategory.name}”设为默认分类`);
      setOptionsDrawerOpen(false);
    }
  };

  const handleTriggerEdit = () => {
    setOptionsDrawerOpen(false);
    // Timeout to let options drawer close before edit drawer opens (smooth transition)
    setTimeout(() => {
      setEditDrawerOpen(true);
    }, 200);
  };

  const handleDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
      toast.success(`已删除分类“${selectedCategory.name}”`);
      setOptionsDrawerOpen(false);
      setEditDrawerOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleSaveCategory = (name: string, icon: string) => {
    if (selectedCategory) {
      // Edit Mode
      updateCategory(selectedCategory.id, name, icon);
      toast.success('分类更新成功');
    } else {
      // Add Mode
      addCategory({ name, icon, type });
      toast.success('新增分类成功');
    }
  };

  // Header Add button
  const addButton = (
    <button
      onClick={handleAddNew}
      className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform"
      aria-label="新增分类"
    >
      <HugeiconsIcon icon={Add01Icon} size={22} className="stroke-2" />
    </button>
  );

  // Group current categories
  const currentCategories = categories.filter(c => c.type === type);
  const predefinedList = currentCategories.filter(c => c.isPredefined);
  const customList = currentCategories.filter(c => !c.isPredefined);

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-6 select-none">
      <PageHeader
        title="分类管理"
        showBack={true}
        rightAction={addButton}
      />

      <div className="px-4 py-3 flex flex-col gap-4">
        {/* Toggle Type */}
        <SegmentControl
          options={[
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
          ]}
          value={type}
          onChange={(val) => setType(val as 'expense' | 'income')}
        />

        {/* Categories List groups */}
        <div className="flex flex-col gap-4">
          {/* Section: Custom Categories (if any) */}
          {customList.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-semibold text-muted-token tracking-wider px-1">自定义分类</h3>
              <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
                {customList.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleRowClick(cat)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(cat);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between p-3 border-b border-hairline/50 hover:bg-surface-soft active:bg-surface-soft/80 cursor-pointer text-sm focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={cat.icon} size="sm" />
                      <span className="font-medium text-ink">{cat.name}</span>
                      {cat.isDefault && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full font-semibold">
                          <HugeiconsIcon icon={StarIcon} size={8} className="fill-brand-primary" />
                          默认
                        </span>
                      )}
                    </div>
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="text-muted-token" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Predefined Categories */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold text-muted-token tracking-wider px-1">预定义分类</h3>
            <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
              {predefinedList.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleRowClick(cat)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(cat);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-3 border-b border-hairline/50 hover:bg-surface-soft active:bg-surface-soft/80 cursor-pointer text-sm focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon icon={cat.icon} size="sm" />
                    <span className="font-medium text-ink">{cat.name}</span>
                    {cat.isDefault && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full font-semibold">
                        <HugeiconsIcon icon={StarIcon} size={8} className="fill-brand-primary" />
                        默认
                      </span>
                    )}
                  </div>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="text-muted-token/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row Click Options Bottom Sheet/Drawer */}
      <Drawer open={optionsDrawerOpen} onOpenChange={setOptionsDrawerOpen}>
        <DrawerContent className="bg-canvas border border-hairline">
          <DrawerHeader className="text-center select-none">
            <DrawerTitle className="text-base font-heading font-medium text-ink flex items-center justify-center gap-2">
              {selectedCategory && (
                <>
                  <span>{selectedCategory.icon}</span>
                  <span>{selectedCategory.name}</span>
                </>
              )}
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-muted-token">
              管理这个收支账目分类选项
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 flex flex-col gap-2.5 select-none">
            {/* Action 1: Set Default (shown only if not already default) */}
            {selectedCategory && !selectedCategory.isDefault && (
              <Button
                onClick={handleSetDefault}
                className="w-full bg-brand-primary hover:bg-brand-active text-white py-5 text-sm font-semibold rounded-md shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                设为默认分类
              </Button>
            )}

            {/* Action 2: Edit (shown only for custom categories) */}
            {selectedCategory && !selectedCategory.isPredefined && (
              <Button
                onClick={handleTriggerEdit}
                variant="outline"
                className="w-full py-5 text-sm font-semibold border-hairline text-ink rounded-md active:scale-95 transition-transform"
              >
                编辑名称与图标
              </Button>
            )}

            {/* Action 3: Delete (shown only for custom categories) */}
            {selectedCategory && !selectedCategory.isPredefined && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full py-5 text-sm font-semibold border-error/20 hover:bg-error/5 text-error rounded-md active:scale-95 transition-transform"
              >
                删除分类
              </Button>
            )}

            <Button
              onClick={() => setOptionsDrawerOpen(false)}
              variant="outline"
              className="w-full py-5 text-sm border-hairline text-muted-soft rounded-md active:scale-95 transition-transform"
            >
              取消
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add / Edit Category details drawer */}
      <CategoryEditDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        category={selectedCategory}
        type={type}
        onSave={handleSaveCategory}
        onDelete={handleDelete}
      />
    </div>
  );
};
export default CategoriesPage;
