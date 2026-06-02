import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle,
  DrawerClose,
  DrawerFooter
} from '../components/ui/drawer';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  ArrowDown01Icon, 
  ArrowUp01Icon, 
  AlertCircleIcon, 
  CheckmarkCircle02Icon, 
  Task01Icon, 
  Note01Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

const validateBackup = (json: any): void => {
  if (!json || typeof json !== 'object') {
    throw new Error('备份文件格式不正确：必须是 JSON 对象');
  }
  if (!Array.isArray(json.transactions)) {
    throw new Error('备份文件格式不正确：交易流水 (transactions) 必须是数组');
  }
  if (!Array.isArray(json.categories)) {
    throw new Error('备份文件格式不正确：分类 (categories) 必须是数组');
  }
  if (!Array.isArray(json.budgets)) {
    throw new Error('备份文件格式不正确：预算 (budgets) 必须是数组');
  }

  // Validate transactions
  for (let i = 0; i < json.transactions.length; i++) {
    const tx = json.transactions[i];
    if (!tx || typeof tx !== 'object') {
      throw new Error(`交易流水第 ${i + 1} 项数据格式不正确`);
    }
    if (typeof tx.id !== 'string') {
      throw new Error(`交易流水第 ${i + 1} 项缺少或包含无效的 id`);
    }
    if (typeof tx.amount !== 'number' || isNaN(tx.amount)) {
      throw new Error(`交易流水第 ${i + 1} 项缺少或包含无效的金额 (amount)`);
    }
    if (typeof tx.date !== 'string') {
      throw new Error(`交易流水第 ${i + 1} 项缺少或包含无效的日期 (date)`);
    }
  }

  // Validate categories
  for (let i = 0; i < json.categories.length; i++) {
    const cat = json.categories[i];
    if (!cat || typeof cat !== 'object') {
      throw new Error(`分类数据第 ${i + 1} 项数据格式不正确`);
    }
    if (typeof cat.id !== 'string') {
      throw new Error(`分类数据第 ${i + 1} 项缺少或包含无效的 id`);
    }
    if (typeof cat.name !== 'string') {
      throw new Error(`分类数据第 ${i + 1} 项缺少或包含无效的名称 (name)`);
    }
  }

  // Validate budgets
  for (let i = 0; i < json.budgets.length; i++) {
    const b = json.budgets[i];
    if (!b || typeof b !== 'object') {
      throw new Error(`预算数据第 ${i + 1} 项数据格式不正确`);
    }
    if (typeof b.id !== 'string') {
      throw new Error(`预算数据第 ${i + 1} 项缺少或包含无效的 id`);
    }
    if (typeof b.totalAmount !== 'number' || isNaN(b.totalAmount)) {
      throw new Error(`预算数据第 ${i + 1} 项缺少或包含无效的预算额度 (totalAmount)`);
    }
    if (typeof b.month !== 'string') {
      throw new Error(`预算数据第 ${i + 1} 项缺少或包含无效的期间 (month)`);
    }
  }
};

export const BackupRestorePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load store states & action
  const transactions = useAppStore(state => state.transactions);
  const categories = useAppStore(state => state.categories);
  const budgets = useAppStore(state => state.budgets);
  const settings = useAppStore(state => state.settings);
  const aiConfig = useAppStore(state => state.aiConfig);
  const importData = useAppStore(state => state.importData);

  // States
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const exportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate current database stats
  const transactionCount = transactions.length;
  const categoryCount = categories.length;
  const budgetCount = budgets.length;
  
  // Calculate size in KB
  const currentDbSizeKB = Math.round(
    JSON.stringify({ transactions, categories, budgets, settings, aiConfig }).length / 1024
  );

  // Export handlers
  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);

    if (exportIntervalRef.current) {
      clearInterval(exportIntervalRef.current);
      exportIntervalRef.current = null;
    }

    exportIntervalRef.current = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + 25, 100));
    }, 200);
  };

  // Side-effect: trigger download when progress reaches 100
  useEffect(() => {
    if (exportProgress === 100) {
      if (exportIntervalRef.current) {
        clearInterval(exportIntervalRef.current);
        exportIntervalRef.current = null;
      }
      triggerDownload();
    }
  }, [exportProgress]);

  // Cleanup export interval on unmount
  useEffect(() => {
    return () => {
      if (exportIntervalRef.current) {
        clearInterval(exportIntervalRef.current);
        exportIntervalRef.current = null;
      }
    };
  }, []);

  const triggerDownload = async () => {
    try {
      const backupData = {
        version: '1.0.0',
        exportDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        transactions,
        categories,
        budgets,
        settings,
        aiConfig,
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      
      const isTauri = !!(window as any).__TAURI_INTERNALS__;
      if (isTauri) {
        // Native Tauri Save
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        
        const path = await save({
          filters: [{
            name: 'JSON Backup',
            extensions: ['json']
          }],
          defaultPath: `personal_accounting_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`
        });
        
        if (path) {
          await writeTextFile(path, dataStr);
          toast.success('数据备份文件导出成功！');
        } else {
          toast.info('已取消备份导出');
        }
      } else {
        // Browser Download
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `personal_accounting_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('数据备份文件导出成功！');
      }

      setIsExporting(false);
    } catch (e) {
      setIsExporting(false);
      toast.error('数据备份导出失败');
    }
  };

  // Import file selection handler
  const handleFileClick = async () => {
    const isTauri = !!(window as any).__TAURI_INTERNALS__;
    if (isTauri) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        
        const selected = await open({
          multiple: false,
          filters: [{
            name: 'JSON Backup',
            extensions: ['json']
          }]
        });
        
        if (selected && typeof selected === 'string') {
          const contents = await readTextFile(selected);
          const json = JSON.parse(contents);
          
          try {
            validateBackup(json);
            setParsedBackup(json);
            
            const pathParts = selected.split(/[/\\]/);
            const fileName = pathParts[pathParts.length - 1];
            
            setSelectedFile({
              name: fileName,
              size: contents.length,
            } as any);
            
            toast.success('备份文件解析成功，可进行数据恢复。');
          } catch (e: any) {
            setParsedBackup(null);
            setSelectedFile(null);
            toast.error(e.message || '解析失败：JSON 结构不符合记账备份格式。');
          }
        }
      } catch (err: any) {
        setParsedBackup(null);
        setSelectedFile(null);
        toast.error(err.message || '读取或解析备份文件失败');
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        validateBackup(json);
        setParsedBackup(json);
        toast.success('备份文件解析成功，可进行数据恢复。');
      } catch (err: any) {
        setParsedBackup(null);
        setSelectedFile(null);
        toast.error(err.message || '解析错误：无法解析为 JSON，文件可能损坏。');
      }
    };
    reader.readAsText(file);
  };

  const handleClearSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setParsedBackup(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger restore confirmation drawer
  const handleRestore = () => {
    if (!parsedBackup) return;
    setDrawerOpen(true);
  };

  // Final confirmation of restoration
  const executeRestore = () => {
    try {
      importData({
        transactions: parsedBackup.transactions,
        categories: parsedBackup.categories,
        budgets: parsedBackup.budgets,
        settings: parsedBackup.settings || settings,
        aiConfig: parsedBackup.aiConfig || aiConfig,
      });

      setDrawerOpen(false);
      setSelectedFile(null);
      setParsedBackup(null);
      toast.success('所有备份数据恢复成功！');
      
      // Redirect to settings page or homepage after refresh
      setTimeout(() => {
        navigate('/settings');
      }, 500);
    } catch (e) {
      toast.error('备份数据恢复失败，文件可能在解析时发生错误。');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none">
      <PageHeader
        title="备份与恢复"
        showBack={true}
      />

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Data overview card */}
        <div className="bg-surface-card border border-hairline p-4 rounded-lg flex flex-col gap-3 shadow-sm select-none">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Task01Icon} size={16} className="text-brand-primary stroke-2" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">本地数据统计</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="bg-canvas border border-hairline/50 p-2.5 rounded flex flex-col">
              <span className="text-[9px] text-muted-soft">交易流水记录</span>
              <span className="text-sm font-semibold text-ink mt-0.5">{transactionCount} 笔</span>
            </div>
            <div className="bg-canvas border border-hairline/50 p-2.5 rounded flex flex-col">
              <span className="text-[9px] text-muted-soft">已用分类数量</span>
              <span className="text-sm font-semibold text-ink mt-0.5">{categoryCount} 个</span>
            </div>
            <div className="bg-canvas border border-hairline/50 p-2.5 rounded flex flex-col">
              <span className="text-[9px] text-muted-soft">历史预算周期</span>
              <span className="text-sm font-semibold text-ink mt-0.5">{budgetCount} 个月</span>
            </div>
            <div className="bg-canvas border border-hairline/50 p-2.5 rounded flex flex-col">
              <span className="text-[9px] text-muted-soft">估计占用空间</span>
              <span className="text-sm font-semibold text-ink mt-0.5">{currentDbSizeKB} KB</span>
            </div>
          </div>
        </div>

        {/* Data Export section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-0.5 mb-1">
            <h3 className="text-xs font-heading font-semibold text-muted-token uppercase tracking-wider">数据备份 (导出)</h3>
          </div>

          <div className="bg-surface-card border border-hairline p-4 rounded-lg flex flex-col gap-3 shadow-sm">
            <span className="text-[10px] text-muted-soft leading-normal">
              将您的账单历史流水、预算定额设置、自定义分类等数据汇聚为一个 <b>JSON 备份文件</b> 供下载。您可以通过此文件在其他设备或重装应用后恢复数据。
            </span>

            {isExporting ? (
              <div className="flex flex-col gap-2 mt-2">
                <Progress value={exportProgress} className="h-2" />
                <div className="flex justify-between text-[9px] text-muted-token font-medium">
                  <span>正在生成备份数据...</span>
                  <span className="font-semibold text-brand-primary">{exportProgress}%</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleExport}
                className="w-full mt-1 bg-brand-primary hover:bg-brand-active text-white py-2.5 rounded-md text-xs font-semibold select-none flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-sm"
              >
                <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="stroke-2 shrink-0 text-white" />
                导出为 JSON 备份
              </button>
            )}
          </div>
        </div>

        {/* Data Import section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-0.5 mb-1">
            <h3 className="text-xs font-heading font-semibold text-muted-token uppercase tracking-wider">数据恢复 (导入)</h3>
          </div>

          <div className="bg-surface-card border border-hairline p-4 rounded-lg flex flex-col gap-4 shadow-sm">
            {/* Override warning banner */}
            <Alert variant="destructive" className="bg-error/10 border-error/20 text-error">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 stroke-2 text-error" />
              <div>
                <AlertTitle className="text-xs font-bold">高危警告</AlertTitle>
                <AlertDescription className="text-[10px] mt-0.5 leading-normal">
                  恢复备份会覆盖当前所有的流水与分类，该过程无法撤销。强烈建议您在操作前先对当前数据做一次导出备份！
                </AlertDescription>
              </div>
            </Alert>

            {/* Custom file selector button/card */}
            <div 
              onClick={handleFileClick}
              className={cn(
                "border-2 border-dashed border-hairline hover:border-brand-primary hover:bg-surface-cream-strong rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 select-none",
                selectedFile && "border-success/60 bg-success/5 hover:bg-success/10 hover:border-success"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              
              <HugeiconsIcon 
                icon={selectedFile ? CheckmarkCircle02Icon : Note01Icon} 
                size={26} 
                className={cn("stroke-1.5 text-muted-soft", selectedFile && "text-success stroke-2")} 
              />
              
              <div className="flex flex-col items-center text-center gap-0.5">
                {selectedFile ? (
                  <>
                    <span className="text-xs font-semibold text-success truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[9px] text-muted-soft flex items-center gap-1">
                      大小: {Math.round(selectedFile.size / 1024)} KB
                      <button 
                        onClick={handleClearSelected}
                        className="text-error hover:text-error/80 font-bold ml-1 p-0.5 inline-flex items-center justify-center active:scale-90"
                        title="清除文件"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={10} className="stroke-2" />
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-ink">选择 JSON 备份文件</span>
                    <span className="text-[9px] text-muted-soft">仅支持 .json 备份文件导入</span>
                  </>
                )}
              </div>
            </div>

            {/* File Preview details card */}
            {parsedBackup && (
              <div className="bg-canvas border border-hairline p-3.5 rounded flex flex-col gap-2 animate-fade-in text-xs">
                <span className="font-semibold text-ink border-b border-hairline/50 pb-1 flex justify-between">
                  <span>备份预览</span>
                  <span className="text-[9px] text-muted-soft font-normal">备份版本: {parsedBackup.version || '1.0.0'}</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-soft py-1">
                  <span>导出时间: <b className="text-ink">{parsedBackup.exportDate || '未知'}</b></span>
                  <span>交易记录: <b className="text-ink">{parsedBackup.transactions?.length || 0} 笔</b></span>
                  <span>分类数目: <b className="text-ink">{parsedBackup.categories?.length || 0} 个</b></span>
                  <span>预算历史: <b className="text-ink">{parsedBackup.budgets?.length || 0} 期</b></span>
                </div>
                
                <button
                  type="button"
                  onClick={handleRestore}
                  className="w-full mt-1.5 bg-error hover:bg-error-active text-white py-2.5 rounded-md text-xs font-semibold select-none flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-sm"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} size={16} className="stroke-2 shrink-0 text-white" />
                  导入并恢复此备份
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Bottom Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-canvas border border-hairline">
          <DrawerHeader className="text-center select-none pb-2">
            <DrawerTitle className="text-base font-heading font-medium text-error flex items-center justify-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-error stroke-2" />
              确认执行恢复数据？
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-muted-token mt-0.5 leading-normal max-w-xs mx-auto">
              导入备份后，本地现有的 {transactionCount} 笔交易记录及所有分类将被彻底覆盖清除，请确保您已知晓风险！
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-5 py-2">
            <div className="bg-error/5 border border-error/20 rounded-lg p-3 text-left flex flex-col gap-1.5 text-xs text-error font-medium">
              <span>⚠️ 恢复过程不可撤销</span>
              <span>⚠️ 本地所有新记账流水将被抹除</span>
              <span>⚠️ 应用数据将回滚到备份生成时点</span>
            </div>
          </div>

          <DrawerFooter className="px-5 pb-8 pt-4 gap-2">
            <button
              onClick={executeRestore}
              className="w-full py-2.5 text-xs text-white bg-error hover:bg-error/90 rounded-md font-semibold select-none border border-error active:scale-98 transition-transform"
            >
              确认恢复
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

export default BackupRestorePage;
