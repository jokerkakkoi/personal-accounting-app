import React from 'react';
import { Category } from '../../types';
import { CategoryIcon } from '../../components/CategoryIcon';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  aiRecommendedId?: string | null;
  className?: string;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedId,
  onSelect,
  aiRecommendedId,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-4 gap-y-4 gap-x-2 py-2 max-h-[220px] overflow-y-auto pr-1', className)}>
      {categories.map((category) => {
        const isSelected = category.id === selectedId;
        const isAIRecommended = category.id === aiRecommendedId;

        return (
          <div
            key={category.id}
            onClick={() => onSelect(category.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(category.id);
              }
            }}
            role="button"
            tabIndex={0}
            className="flex flex-col items-center gap-1 cursor-pointer select-none active:scale-95 transition-transform focus:outline-none"
          >
            {/* Icon Container with optional AI badge */}
            <div className="relative">
              <CategoryIcon
                icon={category.icon}
                selected={isSelected}
                size="md"
              />
              
              {isAIRecommended && !isSelected && (
                <div className="absolute -top-1 -right-1 bg-accent-teal text-white p-0.5 rounded-full flex items-center justify-center shadow-sm animate-bounce" title="AI 推荐">
                  <HugeiconsIcon icon={SparklesIcon} size={8} className="fill-white" />
                </div>
              )}
            </div>
            
            {/* Category Name */}
            <span
              className={cn(
                'text-[10px] truncate max-w-[64px] text-center font-medium',
                isSelected ? 'text-brand-primary font-bold' : 'text-body',
                isAIRecommended && !isSelected && 'text-accent-teal'
              )}
            >
              {category.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
export default CategoryGrid;
