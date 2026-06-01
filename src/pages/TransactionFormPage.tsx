import React, { useState, useEffect } from 'react';
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

export const TransactionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);
  const addTransaction = useAppStore(state => state.addTransaction);
  const updateTransaction = useAppStore(state => state.updateTransaction);

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

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
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
        toast.error('未找到该交易记录');
        navigate('/', { replace: true });
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
    // Reset AI recommendations when type changes
    setAiRecommendedId(null);
  }, [type, categories, categoryId]);

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

  // Trigger Mock AI classification
  const handleAICall = () => {
    if (!note.trim()) {
      toast.warning('请输入交易备注，以便 AI 进行智能分析分类。');
      return;
    }

    setAiLoading(true);
    setAiRecommendedId(null);

    // Mock API delay
    setTimeout(() => {
      setAiLoading(false);
      
      const searchNote = note.toLowerCase();
      let matchedId = null;

      // Simple keyword heuristics matching predefined and custom categories
      if (type === 'expense') {
        if (searchNote.includes('吃') || searchNote.includes('饭') || searchNote.includes('外卖') || searchNote.includes('麦当劳') || searchNote.includes('星巴克') || searchNote.includes('咖啡') || searchNote.includes('菜') || searchNote.includes('火锅') || searchNote.includes('饮')) {
          matchedId = 'exp_food';
        } else if (searchNote.includes('车') || searchNote.includes('地铁') || searchNote.includes('公交') || searchNote.includes('打车') || searchNote.includes('滴滴') || searchNote.includes('机票') || searchNote.includes('火车') || searchNote.includes('加油')) {
          matchedId = 'exp_transport';
        } else if (searchNote.includes('猫') || searchNote.includes('狗') || searchNote.includes('宠') || searchNote.includes('兽医') || searchNote.includes('罐头')) {
          matchedId = 'exp_pet';
        } else if (searchNote.includes('买') || searchNote.includes('淘宝') || searchNote.includes('数码') || searchNote.includes('配件') || searchNote.includes('日用') || searchNote.includes('超市')) {
          matchedId = 'exp_shopping';
        } else if (searchNote.includes('房租') || searchNote.includes('水电') || searchNote.includes('物业') || searchNote.includes('租房')) {
          matchedId = 'exp_housing';
        } else if (searchNote.includes('玩') || searchNote.includes('游戏') || searchNote.includes('电影') || searchNote.includes('音乐') || searchNote.includes('会员') || searchNote.includes('娱乐')) {
          matchedId = 'exp_entertainment';
        } else if (searchNote.includes('病') || searchNote.includes('药') || searchNote.includes('医院') || searchNote.includes('配方') || searchNote.includes('感冒')) {
          matchedId = 'exp_medical';
        } else {
          matchedId = 'exp_other';
        }
      } else {
        if (searchNote.includes('工资') || searchNote.includes('薪水') || searchNote.includes('月薪')) {
          matchedId = 'inc_salary';
        } else if (searchNote.includes('奖金') || searchNote.includes('绩效') || searchNote.includes('年终')) {
          matchedId = 'inc_bonus';
        } else if (searchNote.includes('兼职') || searchNote.includes('外包') || searchNote.includes('私活')) {
          matchedId = 'inc_parttime';
        } else if (searchNote.includes('利息') || searchNote.includes('理财') || searchNote.includes('基金') || searchNote.includes('股票') || searchNote.includes('投资')) {
          matchedId = 'inc_interest';
        } else {
          matchedId = 'inc_other';
        }
      }

      if (matchedId) {
        setAiRecommendedId(matchedId);
        toast.success('AI 已成功推荐分类，已用闪烁小图标标记！');
      } else {
        toast.info('AI 暂未能识别该描述的分类，请手动选择。');
      }
    }, 600);
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
            <span className={`text-4xl font-heading font-medium tracking-tight ${type === 'expense' ? 'text-error' : 'text-success'}`}>
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
            <Label className="text-xs text-muted-token select-none">选择日期</Label>
            <div className="relative flex items-center">
              <HugeiconsIcon icon={Calendar02Icon} size={14} className="absolute left-2.5 text-muted-token stroke-2 pointer-events-none" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-canvas border border-hairline h-10 pl-8 pr-2 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-token select-none">选择时间</Label>
            <div className="relative flex items-center">
              <HugeiconsIcon icon={Time02Icon} size={14} className="absolute left-2.5 text-muted-token stroke-2 pointer-events-none" />
              <Input
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
            <Label className="text-xs text-ink font-semibold select-none">定期交易</Label>
            <span className="text-[10px] text-muted-token select-none">在固定周期自动生成这笔记录</span>
          </div>
          <Switch
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
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
