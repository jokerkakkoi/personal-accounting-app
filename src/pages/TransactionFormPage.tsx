import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { SegmentControl } from '../components/SegmentControl';
import { NumPad } from '../features/transaction/NumPad';
import { CategoryGrid } from '../features/transaction/CategoryGrid';
import { RecurringConfig } from '../features/transaction/RecurringConfig';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { SparklesIcon, Calendar02Icon, Time02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import dayjs from 'dayjs';
import { aiService } from '../services/ai/ai-service';


export const TransactionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);
  const addTransaction = useAppStore(state => state.addTransaction);
  const updateTransaction = useAppStore(state => state.updateTransaction);
  const aiConfig = useAppStore(state => state.aiConfig);

  const isEditMode = !!id;

  // Local Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('0');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(() => dayjs().format('HH:mm'));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<{
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: string;
  }>({ frequency: 'monthly' });

  // AI State
  const [aiRecommendedId, setAiRecommendedId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Guard to prevent re-prefilling after initial load in edit mode
  const prefilledIdRef = useRef<string | null>(null);

  // Ref for AI AbortController to handle cancellations
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // Clean up any pending AI requests on unmount
  useEffect(() => {
    return () => {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Pre-fill form if editing (runs only once per id)
  useEffect(() => {
    if (isEditMode && prefilledIdRef.current !== id) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        prefilledIdRef.current = id!;
        setType(tx.type);
        setAmount(String(tx.amount));
        setCategoryId(tx.categoryId);
        setNote(tx.note);
        setDate(tx.date);
        setTime(tx.time);
        setIsRecurring(tx.isRecurring);
        if (tx.recurringConfig) {
          setRecurringConfig(tx.recurringConfig);
        }
      } else {
        // Transaction not found and we haven't prefilled for this id yet
        // Only trigger the not found redirection if transactions are loaded (not empty/undefined)
        if (transactions && transactions.length > 0) {
          prefilledIdRef.current = id!;
          toast.error('未找到该交易记录');
          navigate('/', { replace: true });
        }
      }
    }
  }, [id, isEditMode, transactions, navigate]);

  // Handle default category select when type changes
  useEffect(() => {
    // If category is not set, or belongs to a different type, pre-select default
    const currentCategory = categories.find(c => c.id === categoryId);
    if (!currentCategory || currentCategory.type !== type) {
      const defaultCat = categories.find(c => c.type === type && c.isDefault) || categories.find(c => c.type === type);
      setCategoryId(defaultCat ? defaultCat.id : null);
    }
  }, [type, categories, categoryId]);

  // Reset AI recommendations only when switching expense/income type
  useEffect(() => {
    setAiRecommendedId(null);
  }, [type]);

  // NumPad typing handler
  const handleKeyPress = (key: string) => {
    setAmount(prev => {
      if (key === 'backspace') {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      }
      
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      // Check decimal places constraint (at most 2 decimals)
      if (prev.includes('.')) {
        const decimals = prev.split('.')[1];
        if (decimals.length >= 2) return prev;
      }

      if (prev === '0') {
        return key;
      }
      
      return prev + key;
    });
  };

  // Trigger AI classification
  const handleAICall = async () => {
    if (!note.trim()) {
      toast.warning('请输入交易备注，以便 AI 进行智能分析分类。');
      return;
    }

    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    setAiLoading(true);
    setAiRecommendedId(null);

    try {
      const result = await aiService.classify(
        note,
        type,
        categories,
        aiConfig,
        controller.signal
      );

      if (result.categoryId) {
        setAiRecommendedId(result.categoryId);
        setCategoryId(result.categoryId);
        if (result.source === 'llm') {
          toast.success('AI 已智能预测分类，并自动为您选中该分类！');
        } else {
          toast.success('已根据备注为您自动推荐并选中最佳匹配分类！');
        }
      } else {
        toast.info('AI 暂未能识别该描述的分类，请手动选择。');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        toast.error(`智能推荐失败: ${e?.message || '未知错误'}`);
      }
    } finally {
      if (aiAbortControllerRef.current === controller) {
        setAiLoading(false);
      }
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('请输入有效的交易金额');
      return;
    }

    if (!categoryId) {
      toast.error('请选择一个交易分类');
      return;
    }

    const txData = {
      type,
      amount: numAmount,
      categoryId,
      note,
      date,
      time,
      isRecurring,
      recurringConfig: isRecurring ? recurringConfig : undefined,
      aiClassified: aiRecommendedId === categoryId,
    };

    if (isEditMode) {
      updateTransaction(id!, txData);
      toast.success('修改交易成功');
    } else {
      addTransaction(txData);
      toast.success('新增记录成功');
    }

    navigate(-1);
  };

  // Header Save Button
  const saveButton = (
    <Button
      onClick={handleSave}
      variant="ghost"
      className="text-brand-primary hover:text-brand-active hover:bg-transparent font-medium p-0 active:scale-95"
    >
      保存
    </Button>
  );

  // Categories list filtered by type
  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-6 select-none">
      <PageHeader
        title={isEditMode ? '编辑交易' : '记一笔'}
        showBack={true}
        rightAction={saveButton}
      />

      <div className="px-4 py-3 flex flex-col gap-4">
        {/* Income / Expense Tab Switch */}
        <SegmentControl
          options={[
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
          ]}
          value={type}
          onChange={(val) => setType(val as 'expense' | 'income')}
        />

        {/* Large Input Amount Display */}
        <div className="text-right py-4 border-b border-hairline flex items-center justify-end relative h-16">
          <span className="text-xs text-muted-token absolute left-0 bottom-2 select-none">金额 (元)</span>
          <div className="flex items-baseline gap-1 select-all">
            <span className={`text-4xl font-sans font-medium tracking-tight ${type === 'expense' ? 'text-error' : 'text-success'}`}>
              ¥ {amount}
            </span>
            <span className={`w-0.5 h-8 bg-brand-primary animate-ping ml-0.5 select-none`} style={{ animationDuration: '1s' }} />
          </div>
        </div>

        {/* Note block & AI classifier */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-note" className="text-xs text-muted-token select-none">交易备注</Label>
          <div className="flex gap-2">
            <Input
              id="tx-note"
              placeholder="例如：麦当劳板烧鸡腿堡套餐"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-canvas border border-hairline h-10 text-xs"
              maxLength={200}
            />
            {/* Show AI button (disabled if Note is empty) */}
            <Button
              type="button"
              onClick={handleAICall}
              disabled={aiLoading}
              className="bg-accent-teal hover:bg-accent-teal/80 text-white shrink-0 h-10 px-3 text-xs gap-1 active:scale-95 transition-transform"
            >
              <HugeiconsIcon icon={SparklesIcon} size={14} className={aiLoading ? 'animate-spin' : ''} />
              推荐
            </Button>
          </div>
        </div>

        {/* Categories Grid Picker */}
        <div className="flex flex-col">
          <Label className="text-xs text-muted-token mb-2 select-none">选择分类</Label>
          <CategoryGrid
            categories={filteredCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            aiRecommendedId={aiRecommendedId}
          />
        </div>

        {/* Date & Time Selectors */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-date-input" className="text-xs text-muted-token select-none">选择日期</Label>
            <div className="relative flex items-center">
              <HugeiconsIcon icon={Calendar02Icon} size={14} className="absolute left-2.5 text-muted-token stroke-2 pointer-events-none" />
              <Input
                id="tx-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-canvas border border-hairline h-10 pl-8 pr-2 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-time-input" className="text-xs text-muted-token select-none">选择时间</Label>
            <div className="relative flex items-center">
              <HugeiconsIcon icon={Time02Icon} size={14} className="absolute left-2.5 text-muted-token stroke-2 pointer-events-none" />
              <Input
                id="tx-time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-canvas border border-hairline h-10 pl-8 pr-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Recurring Settings Toggle */}
        <div className="flex items-center justify-between border-t border-hairline pt-3 mt-1">
          <div className="flex flex-col">
            <Label id="recurring-label" className="text-xs text-ink font-semibold select-none">定期交易</Label>
            <span className="text-[10px] text-muted-token select-none">在固定周期自动生成这笔记录</span>
          </div>
          <Switch
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
            aria-labelledby="recurring-label"
            className="data-[state=checked]:bg-brand-primary"
          />
        </div>

        {/* Collapsible Recurring Config */}
        {isRecurring && (
          <RecurringConfig
            value={recurringConfig}
            onChange={setRecurringConfig}
            className="animate-fade-in"
          />
        )}

        {/* Custom Numpad Grid */}
        <NumPad onKeyPress={handleKeyPress} className="mt-2" />
      </div>
    </div>
  );
};
export default TransactionFormPage;
