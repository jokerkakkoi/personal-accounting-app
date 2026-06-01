import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { CategoryIcon } from '../components/CategoryIcon';
import { AmountDisplay } from '../components/AmountDisplay';
import { Button } from '../components/ui/button';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from '../components/ui/drawer';
import { toast } from 'sonner';
import { formatDate, formatTime } from '../utils/format';
import { SparklesIcon, Calendar02Icon, Time02Icon, Note01Icon, Task01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);
  const deleteTransaction = useAppStore(state => state.deleteTransaction);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const tx = transactions.find(t => t.id === id);

  if (!tx) {
    return (
      <div className="flex-1 flex flex-col bg-canvas pb-6 select-none">
        <PageHeader title="详情" showBack={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <span className="text-4xl mb-4 select-none">⚠️</span>
          <h3 className="text-lg font-heading font-medium text-ink mb-1 select-none">未找到交易记录</h3>
          <p className="text-sm text-muted-token mb-4 select-none">该笔交易可能已被删除或不存在。</p>
          <Button onClick={() => navigate(-1)} className="bg-brand-primary text-white text-xs px-4">返回</Button>
        </div>
      </div>
    );
  }

  const category = categories.find(c => c.id === tx.categoryId) || {
    name: '未知分类',
    icon: '📦',
  };

  const handleDelete = () => {
    deleteTransaction(tx.id);
    setDrawerOpen(false);
    toast.success('删除账目成功');
    navigate('/', { replace: true });
  };

  // Header Edit Button
  const editButton = (
    <Button
      onClick={() => navigate(`/transaction/edit/${tx.id}`)}
      variant="ghost"
      className="text-brand-primary hover:text-brand-active hover:bg-transparent font-medium p-0 active:scale-95"
    >
      编辑
    </Button>
  );

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-6 select-none">
      <PageHeader
        title={tx.type === 'expense' ? '支出详情' : '收入详情'}
        showBack={true}
        rightAction={editButton}
      />

      <div className="flex-1 flex flex-col px-4 py-6 justify-between">
        <div className="flex flex-col gap-6">
          {/* Top Big Amount Display */}
          <div className="flex flex-col items-center py-6 bg-surface-soft border border-hairline rounded-lg text-center">
            <CategoryIcon icon={category.icon} size="lg" className="mb-3" />
            <span className="text-sm text-muted-token mb-1 select-none">{category.name}</span>
            <AmountDisplay amount={tx.amount} size="2xl" type={tx.type} showSign={true} />
            
            {tx.aiClassified && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-accent-teal/10 text-accent-teal px-2 py-0.5 rounded-full mt-3 font-medium select-none">
                <HugeiconsIcon icon={SparklesIcon} size={10} className="fill-accent-teal" />
                AI 智能分类
              </span>
            )}
          </div>

          {/* Details Row List */}
          <div className="flex flex-col border border-hairline rounded-lg bg-canvas overflow-hidden">
            {/* Row 1: Type */}
            <div className="flex justify-between items-center p-3 border-b border-hairline/50 text-xs">
              <span className="text-muted-token flex items-center gap-1.5 select-none">
                <HugeiconsIcon icon={Task01Icon} size={14} className="text-muted-token stroke-2" />
                收支类型
              </span>
              <span className={`font-medium ${tx.type === 'expense' ? 'text-brand-primary' : 'text-success'}`}>
                {tx.type === 'expense' ? '支出' : '收入'}
              </span>
            </div>

            {/* Row 2: Date */}
            <div className="flex justify-between items-center p-3 border-b border-hairline/50 text-xs">
              <span className="text-muted-token flex items-center gap-1.5 select-none">
                <HugeiconsIcon icon={Calendar02Icon} size={14} className="text-muted-token stroke-2" />
                账目日期
              </span>
              <span className="text-ink font-medium">{formatDate(tx.date)}</span>
            </div>

            {/* Row 3: Time */}
            <div className="flex justify-between items-center p-3 border-b border-hairline/50 text-xs">
              <span className="text-muted-token flex items-center gap-1.5 select-none">
                <HugeiconsIcon icon={Time02Icon} size={14} className="text-muted-token stroke-2" />
                账目时间
              </span>
              <span className="text-ink font-medium">{formatTime(tx.time)}</span>
            </div>

            {/* Row 4: Note */}
            <div className="flex justify-between items-start p-3 border-b border-hairline/50 text-xs">
              <span className="text-muted-token flex items-center gap-1.5 shrink-0 select-none">
                <HugeiconsIcon icon={Note01Icon} size={14} className="text-muted-token stroke-2" />
                账目备注
              </span>
              <span className="text-ink text-right max-w-[200px] break-all font-medium">
                {tx.note || '无备注'}
              </span>
            </div>

            {/* Row 5: Recurring */}
            {tx.isRecurring && (
              <div className="flex justify-between items-center p-3 border-b border-hairline/50 text-xs">
                <span className="text-muted-token flex items-center gap-1.5 select-none">🔄 循环交易</span>
                <span className="text-ink font-medium">
                  {tx.recurringConfig?.frequency === 'daily' && '每天'}
                  {tx.recurringConfig?.frequency === 'weekly' && '每周'}
                  {tx.recurringConfig?.frequency === 'monthly' && '每月'}
                  {tx.recurringConfig?.frequency === 'yearly' && '每年'}
                  {tx.recurringConfig?.endDate && ` (至 ${tx.recurringConfig.endDate})`}
                </span>
              </div>
            )}

            {/* Row 6: Created Time */}
            <div className="flex justify-between items-center p-3 text-[10px] text-muted-soft">
              <span className="select-none">记录创建时间</span>
              <span>{dayjs(tx.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
          </div>
        </div>

        {/* Delete Trigger Button with Drawer confirmation */}
        <div className="mt-8 select-none">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className="w-full py-6 border-error/20 hover:bg-error/5 text-error font-semibold rounded-md active:scale-98 transition-transform"
              >
                删除交易
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-canvas border border-hairline">
              <DrawerHeader className="text-center">
                <DrawerTitle className="text-lg font-heading font-medium text-ink select-none">确认删除这笔账目？</DrawerTitle>
                <DrawerDescription className="text-xs text-muted-token mt-2 select-none">
                  删除后将永久移除该账目，且本月的预算与支出汇总统计将自动重新计算。此操作无法撤销。
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter className="flex flex-col gap-2 p-4">
                <Button
                  onClick={handleDelete}
                  className="w-full bg-error hover:bg-error/90 text-white font-medium py-5 text-sm rounded-md shadow-sm active:scale-95 transition-transform"
                >
                  确认删除
                </Button>
                <Button
                  onClick={() => setDrawerOpen(false)}
                  variant="outline"
                  className="w-full py-5 text-sm border-hairline text-ink rounded-md active:scale-95 transition-transform"
                >
                  取消
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
};
export default TransactionDetailPage;
