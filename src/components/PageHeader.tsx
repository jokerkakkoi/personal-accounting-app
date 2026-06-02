import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack = false,
  leftAction,
  rightAction,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'w-full flex items-center justify-between px-4 bg-canvas border-b border-hairline safe-padding-top sticky top-0 z-50 select-none',
        className
      )}
      style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))' }}
    >
      {/* Left Slot */}
      <div className="flex items-center w-12 shrink-0">
        {leftAction ? (
          leftAction
        ) : showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-surface-soft active:scale-90 transition-transform"
            aria-label="返回"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={22} className="stroke-2" />
          </button>
        ) : null}
      </div>

      {/* Title Slot */}
      <h1 className="text-lg font-heading font-medium text-ink truncate text-center flex-1 max-w-[200px]">
        {title}
      </h1>

      {/* Right Slot */}
      <div className="flex items-center justify-end w-12 shrink-0">
        {rightAction}
      </div>
    </header>
  );
};
