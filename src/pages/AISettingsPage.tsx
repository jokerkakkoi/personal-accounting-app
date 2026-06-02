import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { PageHeader } from '../components/PageHeader';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  EyeIcon, 
  EyeOffIcon, 
  AiCloudIcon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon,
  PlayIcon,
  CleanIcon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';
import { DEFAULT_AI_PROMPT_TEMPLATE } from '../utils/constants';

export const AISettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const aiConfig = useAppStore(state => state.aiConfig);
  const updateAIConfig = useAppStore(state => state.updateAIConfig);

  // Form local states
  const [enabled, setEnabled] = useState(aiConfig.enabled);
  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl);
  const [apiKey, setApiKey] = useState(aiConfig.apiKey);
  const [modelPreset, setModelPreset] = useState<'gpt-4o-mini' | 'gpt-4o' | 'deepseek-chat' | 'custom'>(() => {
    if (['gpt-4o-mini', 'gpt-4o', 'deepseek-chat'].includes(aiConfig.model)) {
      return aiConfig.model as any;
    }
    return 'custom';
  });
  const [customModel, setCustomModel] = useState(() => {
    if (['gpt-4o-mini', 'gpt-4o', 'deepseek-chat'].includes(aiConfig.model)) {
      return '';
    }
    return aiConfig.model;
  });
  const [timeout, setTimeoutVal] = useState(aiConfig.timeout);
  const [promptTemplate, setPromptTemplate] = useState(aiConfig.promptTemplate || DEFAULT_AI_PROMPT_TEMPLATE);

  // Visual states
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);



  const handleSave = () => {
    const cleanedBaseUrl = baseUrl.trim();
    const cleanedApiKey = apiKey.trim();
    const cleanedCustomModel = customModel?.trim();
    const finalModel = modelPreset === 'custom' ? cleanedCustomModel : modelPreset;

    if (enabled && !cleanedApiKey) {
      toast.error('启用 AI 功能时必须提供 API 密钥');
      return;
    }
    if (enabled && modelPreset === 'custom' && !cleanedCustomModel) {
      toast.error('请输入自定义模型名称');
      return;
    }

    updateAIConfig({
      enabled,
      baseUrl: cleanedBaseUrl,
      apiKey: cleanedApiKey,
      model: finalModel,
      timeout,
      promptTemplate,
    });

    toast.success('AI 智能分类配置已保存');
    navigate(-1);
  };

  const handleClear = () => {
    setEnabled(false);
    setBaseUrl('https://api.openai.com/v1');
    setApiKey('');
    setModelPreset('gpt-4o-mini');
    setCustomModel('');
    setTimeoutVal(10);
    setPromptTemplate(DEFAULT_AI_PROMPT_TEMPLATE);
    setTestResult(null);

    updateAIConfig({
      enabled: false,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      timeout: 10,
      promptTemplate: DEFAULT_AI_PROMPT_TEMPLATE,
    });

    toast.info('AI 配置已清除并恢复默认');
  };

  const handleTestConnection = async () => {
    const finalModel = modelPreset === 'custom' ? customModel : modelPreset;
    
    if (!baseUrl) {
      setTestResult({ success: false, message: '测试失败：Base URL 不能为空。' });
      return;
    }
    if (!apiKey) {
      setTestResult({ success: false, message: '测试失败：API Key 密钥不能为空。' });
      return;
    }
    if (modelPreset === 'custom' && !finalModel) {
      setTestResult({ success: false, message: '测试失败：自定义模型名称不能为空。' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
    const startTime = performance.now();

    try {
      // Use the /models endpoint as a lightweight connectivity & auth check
      const url = baseUrl.replace(/\/+$/, '') + '/models';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        const detail = errorBody ? `（${response.status}: ${errorBody.slice(0, 120)}）` : `（HTTP ${response.status}）`;
        setTestResult({
          success: false,
          message: `连接失败：服务器返回错误状态 ${detail}`,
        });
        toast.error('AI 服务连接测试失败');
        return;
      }

      setTestResult({
        success: true,
        message: `连接成功！与模型 ${finalModel} 握手完成，响应延迟 ${elapsed}ms。`,
      });
      toast.success('AI 服务连接测试成功！');
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError';
      setTestResult({
        success: false,
        message: isAbort
          ? `连接失败：请求超时（${timeout}秒），请检查您的网络连接与代理地址。`
          : `连接失败：${e?.message || '网络错误，请检查 Base URL 或网络连接。'}`,
      });
      toast.error('AI 服务连接测试失败');
    } finally {
      clearTimeout(timeoutId);
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas pb-20 select-none min-h-screen">
      <PageHeader
        title="AI 智能分类"
        showBack={true}
      />

      <div className="px-4 py-4 flex flex-col gap-5 overflow-y-auto">
        {/* Enable AI Banner & Switch */}
        <div className="bg-surface-card border border-hairline p-4 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={AiCloudIcon} size={20} className="text-brand-primary stroke-2" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-semibold text-ink">AI 智能账单分类</span>
              <span className="text-[10px] text-muted-soft">使用大语言模型智能预测记账分类</span>
            </div>
          </div>

          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="启用 AI"
          />
        </div>

        {/* Configuration settings form */}
        {enabled && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Base URL */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="baseUrl" className="text-xs font-semibold text-muted-token pl-0.5">
                API 接口地址 (Base URL)
              </Label>
              <Input
                id="baseUrl"
                type="text"
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="h-10 text-xs bg-surface-soft border border-hairline focus:border-brand-primary"
              />
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5 relative">
              <Label htmlFor="apiKey" className="text-xs font-semibold text-muted-token pl-0.5">
                API 密钥 (API Key)
              </Label>
              <div className="relative w-full">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-10 text-xs bg-surface-soft border border-hairline focus:border-brand-primary pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-token hover:text-ink"
                  aria-label={showKey ? '隐藏密码' : '显示密码'}
                >
                  <HugeiconsIcon icon={showKey ? EyeOffIcon : EyeIcon} size={16} className="stroke-2" />
                </button>
              </div>
            </div>

            {/* Model & Custom Model selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="modelPreset" className="text-xs font-semibold text-muted-token pl-0.5">
                  AI 模型预设
                </Label>
                <Select
                  value={modelPreset}
                  onValueChange={(val: any) => setModelPreset(val)}
                >
                  <SelectTrigger id="modelPreset" className="h-10 text-xs bg-surface-soft border border-hairline">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent className="bg-canvas border border-hairline">
                    <SelectItem value="gpt-4o-mini" className="text-xs">gpt-4o-mini</SelectItem>
                    <SelectItem value="gpt-4o" className="text-xs">gpt-4o</SelectItem>
                    <SelectItem value="deepseek-chat" className="text-xs">deepseek-chat</SelectItem>
                    <SelectItem value="custom" className="text-xs">自定义...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {modelPreset === 'custom' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customModel" className="text-xs font-semibold text-muted-token pl-0.5">
                    自定义模型名称
                  </Label>
                  <Input
                    id="customModel"
                    type="text"
                    placeholder="claude-3-5-sonnet"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="h-10 text-xs bg-surface-soft border border-hairline focus:border-brand-primary"
                  />
                </div>
              )}
            </div>

            {/* Timeout Slider */}
            <div className="flex flex-col gap-2 bg-surface-soft/40 p-3 border border-hairline rounded-lg">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-token pl-0.5">
                <span>请求超时时间</span>
                <span className="text-ink font-sans">{timeout} 秒</span>
              </div>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[timeout]}
                onValueChange={(val) => setTimeoutVal(val[0])}
                className="py-1 cursor-pointer"
              />
            </div>

            {/* Advanced Prompt Template */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promptTemplate" className="text-xs font-semibold text-muted-token pl-0.5">
                系统提示词模板 (Advanced)
              </Label>
              <Textarea
                id="promptTemplate"
                rows={4}
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="请输入提示词模板..."
                className="text-xs bg-surface-soft border border-hairline focus:border-brand-primary font-mono resize-none leading-normal p-2.5"
              />
              <span className="text-[9px] text-muted-soft leading-normal px-1">
                模板中需包含 <code>[CATEGORIES_LIST]</code> 与 <code>[USER_INPUT]</code> 占位符，以便应用实时替换分类与记账内容。
              </span>
            </div>

            {/* Test Connection Button and status */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className={cn(
                  "w-full py-2.5 rounded-md text-xs font-semibold select-none flex items-center justify-center gap-1.5 border border-hairline active:scale-98 transition-transform",
                  isTesting 
                    ? "bg-brand-disabled text-muted-token cursor-not-allowed" 
                    : "bg-surface-card hover:bg-surface-cream-strong text-ink"
                )}
              >
                <HugeiconsIcon icon={PlayIcon} size={14} className="stroke-2 shrink-0 text-muted-token" />
                {isTesting ? '正在测试连接...' : '测试 API 连接'}
              </button>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className={cn(
                  "border",
                  testResult.success 
                    ? "bg-success/10 border-success/20 text-success" 
                    : "bg-error/10 border-error/20 text-error"
                )}>
                  <HugeiconsIcon 
                    icon={testResult.success ? CheckmarkCircle02Icon : AlertCircleIcon} 
                    size={16} 
                    className="shrink-0 stroke-2" 
                  />
                  <div>
                    <AlertTitle className="text-xs font-bold">
                      {testResult.success ? '连接成功' : '连接失败'}
                    </AlertTitle>
                    <AlertDescription className="text-[10px] mt-0.5 leading-normal">
                      {testResult.message}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* AI Information note when disabled */}
        {!enabled && (
          <div className="bg-surface-soft/50 border border-hairline/80 p-4 rounded-lg flex gap-3 text-xs leading-relaxed text-muted-token mt-2 select-none">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-brand-primary stroke-2 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-ink">AI 功能提示</span>
              <span>
                启用 AI 功能后，在记一笔的备注中输入自然语言描述（如“中午吃火锅花了120元”），系统将调用大语言模型进行分类，并自动推荐最佳匹配分类。
              </span>
              <span className="mt-1">
                所有配置数据均保存在本地 <b>LocalStorage</b> 中，不会上传至第三方记账服务器，保障数据隐私。
              </span>
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-md text-xs font-semibold select-none border border-hairline bg-surface-soft hover:bg-surface-cream-strong text-muted-token flex items-center justify-center gap-1 active:scale-98 transition-transform"
          >
            <HugeiconsIcon icon={CleanIcon} size={14} className="stroke-2 shrink-0 text-muted-token" />
            清除并重置
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-md text-xs font-semibold select-none bg-brand-primary hover:bg-brand-active text-white flex items-center justify-center gap-1 shadow-sm active:scale-98 transition-transform"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettingsPage;
