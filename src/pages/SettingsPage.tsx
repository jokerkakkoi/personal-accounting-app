import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { Switch } from '../components/ui/switch';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose,
  DrawerFooter
} from '../components/ui/drawer';
import { 
  Grid02Icon, 
  AiCloudIcon, 
  ArrowRight01Icon, 
  Delete02Icon,
  AlertCircleIcon,
  Task01Icon,
  UserIcon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Load Zustand store settings and actions
  const settings = useAppStore(state => state.settings);
  const updateSettings = useAppStore(state => state.updateSettings);
  const resetAllData = useAppStore(state => state.resetAllData);

  // States
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Toggle handlers
  const handleBudgetNotificationChange = (checked: boolean) => {
    updateSettings({ budgetNotification: checked });
    toast.success(checked ? '已开启预算超支提醒通知' : '已关闭预算超支提醒通知');
  };

  const handleRecurringNotificationChange = (checked: boolean) => {
    updateSettings({ recurringNotification: checked });
    toast.success(checked ? '已开启定期交易提醒通知' : '已关闭定期交易提醒通知');
  };

  const executeClearData = () => {
    try {
      resetAllData();
      setDrawerOpen(false);
      toast.success('应用数据已全部清除，并成功重置为初始状态！');
      
      // Redirect to welcome/home page
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (e) {
      toast.error('数据清除失败');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-24 select-none min-h-screen">
      <PageHeader title="系统设置" />

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* App Info Header Card */}
        <div className="bg-surface-card border border-hairline p-5 rounded-lg flex items-center gap-4 shadow-sm select-none">
          <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
            <HugeiconsIcon icon={UserIcon} size={24} className="stroke-2 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-heading font-semibold text-ink">个人记账助手</h2>
            <span className="text-[10px] text-muted-soft mt-0.5">本地优先 • 智能分类 • 极简记账</span>
            <span className="text-[9px] text-brand-primary mt-1 font-semibold">版本 v1.0.0</span>
          </div>
        </div>

        {/* General Settings Group */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-heading font-semibold text-muted-token pl-1 uppercase tracking-wider">
            通用设置
          </h3>
          
          <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm flex flex-col">
            {/* Budget Notification Switch */}
            <div className="flex justify-between items-center p-4 border-b border-hairline/40">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="text-xs font-semibold text-ink">预算超支提醒</span>
                <span className="text-[9px] text-muted-soft">当月总消费支出超出预算额度时进行红条警示</span>
              </div>
              <Switch
                checked={settings.budgetNotification}
                onCheckedChange={handleBudgetNotificationChange}
                aria-label="预算超支提醒开关"
              />
            </div>

            {/* Recurring Notification Switch */}
            <div className="flex justify-between items-center p-4 border-b border-hairline/40">
              <div className="flex flex-col gap-0.5 pr-2">
                <span className="text-xs font-semibold text-ink">定期交易提醒</span>
                <span className="text-[9px] text-muted-soft">若有设置定期交易（如房租、工资），生成日进行弹窗确认</span>
              </div>
              <Switch
                checked={settings.recurringNotification}
                onCheckedChange={handleRecurringNotificationChange}
                aria-label="定期交易提醒开关"
              />
            </div>

            {/* Category Management Button */}
            <div 
              onClick={() => navigate('/categories')}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-surface-cream-strong active:bg-surface-cream-strong/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Grid02Icon} size={16} className="text-muted-token stroke-2" />
                <span className="text-xs font-semibold text-ink">收支分类管理</span>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-token stroke-2" />
            </div>
          </div>
        </div>

        {/* Smart & Data Settings Group */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-heading font-semibold text-muted-token pl-1 uppercase tracking-wider">
            智能与数据
          </h3>

          <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm flex flex-col">
            {/* AI Classification Page */}
            <div 
              onClick={() => navigate('/settings/ai')}
              className="flex justify-between items-center p-4 border-b border-hairline/40 cursor-pointer hover:bg-surface-cream-strong active:bg-surface-cream-strong/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={AiCloudIcon} size={16} className="text-muted-token stroke-2" />
                <span className="text-xs font-semibold text-ink">AI 智能记账设置</span>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-token stroke-2" />
            </div>

            {/* Backup & Restore Page */}
            <div 
              onClick={() => navigate('/settings/backup')}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-surface-cream-strong active:bg-surface-cream-strong/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Task01Icon} size={16} className="text-muted-token stroke-2" />
                <span className="text-xs font-semibold text-ink">数据备份与恢复</span>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-token stroke-2" />
            </div>
          </div>
        </div>

        {/* Data Management Group */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-heading font-semibold text-muted-token pl-1 uppercase tracking-wider text-error">
            敏感数据管理
          </h3>

          <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm flex flex-col">
            {/* Clear All Data Button */}
            <div 
              onClick={() => setDrawerOpen(true)}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-error/5 active:bg-error/10 text-error transition-colors"
            >
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={Delete02Icon} size={16} className="text-error stroke-2 animate-pulse" />
                <span className="text-xs font-semibold">清空应用所有数据</span>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-error stroke-2" />
            </div>
          </div>
        </div>

        {/* About App Section */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-heading font-semibold text-muted-token pl-1 uppercase tracking-wider">
            关于我们
          </h3>

          <div className="bg-surface-card border border-hairline rounded-lg p-4 shadow-sm flex gap-3 text-[10px] leading-relaxed text-muted-soft select-none">
            <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-brand-primary stroke-2 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-ink text-xs">关于本软件</span>
              <span>
                本记账应用采用本地存储优先机制。除了您在<b>智能分类设置</b>中显式配置并启用的第三方 AI 服务大模型接口调用外，应用绝不会将您的任何消费明细、账单隐私上传到任何网络记账服务器，确保隐私资产绝对安全。
              </span>
              <span className="mt-1 flex gap-2 font-medium text-brand-primary">
                <span className="cursor-pointer hover:underline">隐私协议</span>
                <span>•</span>
                <span className="cursor-pointer hover:underline">开源许可</span>
                <span>•</span>
                <span className="cursor-pointer hover:underline">反馈建议</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Bottom Sheet Confirmation Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-canvas border border-hairline">
          <DrawerHeader className="text-center select-none pb-2">
            <DrawerTitle className="text-base font-heading font-medium text-error flex items-center justify-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-error stroke-2" />
              警告：清空所有本地数据？
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-muted-token mt-0.5 leading-normal max-w-xs mx-auto">
              此操作将永久清除应用中的所有账单流水、分类配置及预算设定，且该过程完全不可逆转。
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-5 py-2">
            <div className="bg-error/5 border border-error/20 rounded-lg p-3 text-left flex flex-col gap-1.5 text-xs text-error font-medium">
              <span>⚠️ 本地存储的数据将被彻底清空</span>
              <span>⚠️ 所有自定义分类将被删除</span>
              <span>⚠️ 应用所有状态将恢复至出厂重置状态</span>
            </div>
          </div>

          <DrawerFooter className="px-5 pb-8 pt-4 gap-2">
            <button
              onClick={executeClearData}
              className="w-full py-2.5 text-xs text-white bg-error hover:bg-error/90 rounded-md font-semibold select-none border border-error active:scale-98 transition-transform"
            >
              确认清空所有数据
            </button>
            <DrawerClose asChild>
              <button className="w-full py-2.5 text-xs text-muted-token bg-surface-soft hover:bg-surface-cream-strong rounded-md font-semibold select-none border border-hairline active:scale-98 transition-transform">
                取消
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SettingsPage;
