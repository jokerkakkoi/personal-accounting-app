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
import { IconPicker } from './IconPicker';
import { Category } from '../../types';

interface CategoryEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  type: 'expense' | 'income';
  onSave: (name: string, icon: string) => void;
  onDelete?: () => void;
}

export const CategoryEditDrawer: React.FC<CategoryEditDrawerProps> = ({
  open,
  onOpenChange,
  category,
  type,
  onSave,
  onDelete,
}) => {
  const isEditMode = !!category;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');

  // Reset fields when drawer opens
  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
    } else {
      setName('');
      setIcon(type === 'expense' ? '🍔' : '💰');
    }
  }, [category, type, open]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave(name.trim(), icon);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-canvas border border-hairline max-h-[80vh] flex flex-col">
        <DrawerHeader className="shrink-0 select-none">
          <DrawerTitle className="text-base font-heading font-medium text-ink text-center">
            {isEditMode ? '修改分类' : '新增分类'}
          </DrawerTitle>
          <DrawerDescription className="text-center text-[10px] text-muted-token">
            设置分类的显示名称和 Emoji 图标
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4 pb-6">
          {/* Name input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name" className="text-xs text-muted-token select-none">分类名称</Label>
            <Input
              id="cat-name"
              placeholder="请输入分类名称，如：猫粮"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-canvas border border-hairline h-10 text-xs"
              maxLength={10}
            />
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-token select-none">选择图标</Label>
            <div className="flex items-center gap-3 mb-1.5 select-none">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-xl shadow-sm border border-brand-active">
                {icon}
              </div>
              <span className="text-[10px] text-muted-soft">预览效果</span>
            </div>
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>
        </div>

        {/* Action buttons */}
        <DrawerFooter className="border-t border-hairline p-4 flex flex-col gap-2 shrink-0 select-none">
          <div className="flex gap-3">
            {isEditMode && onDelete && !category.isPredefined && (
              <Button
                variant="outline"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                className="flex-1 py-5 text-sm rounded-md border-error/20 hover:bg-error/5 text-error active:scale-95 transition-transform"
              >
                删除分类
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
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
export default CategoryEditDrawer;
