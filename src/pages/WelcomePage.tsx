import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { FeatureCard } from '../features/welcome/FeatureCard';
import { ProgressDots } from '../features/welcome/ProgressDots';
import { Button } from '../components/ui/button';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const updateSettings = useAppStore(state => state.updateSettings);
  const [step, setStep] = useState(0);

  const handleFinish = () => {
    updateSettings({ hasSeenWelcome: true });
    navigate('/', { replace: true });
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between px-6 py-8 bg-canvas select-none">
      {/* Top action row */}
      <div className="flex justify-end h-8">
        <button
          onClick={handleFinish}
          className="text-xs text-muted-token hover:text-ink active:scale-95 transition-transform"
        >
          跳过
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-6">
        {step === 0 ? (
          <div className="flex flex-col items-center text-center animate-fade-in">
            {/* Logo */}
            <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 relative shadow-sm border border-brand-primary/20">
              <HugeiconsIcon icon={SparklesIcon} size={40} className="text-brand-primary fill-brand-primary animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-teal rounded-full animate-ping" />
            </div>

            {/* App Name */}
            <div className="flex items-center gap-1.5 justify-center mb-4">
              <span className="text-2xl font-bold font-heading text-ink">Antigravity Ledger</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl font-heading text-ink tracking-tight leading-snug mb-3">
              简单、智能、本地化
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-body leading-relaxed max-w-xs px-2">
              极简流畅的本地优先记账体验，配合强大的 AI 分类和多维报表，轻松掌握您的财务状况。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Display Head */}
            <div className="text-center mb-2">
              <h2 className="text-2xl font-heading text-ink tracking-tight mb-2">
                探索强大功能
              </h2>
              <p className="text-xs text-muted-token">本应用所有数据均保存在本地，绝不上传</p>
            </div>

            {/* Feature Cards */}
            <div className="flex flex-col gap-4">
              <FeatureCard
                emoji="📒"
                title="轻松记账"
                description="精心设计的交互，配合数字小键盘与自动匹配，几秒钟内完成一笔记录。"
              />
              <FeatureCard
                emoji="🤖"
                title="AI 智能分类"
                description="配置大模型 API，自动根据您的输入描述将交易归类到合适的分类中。"
              />
              <FeatureCard
                emoji="📊"
                title="预算与报表"
                description="详细的收支折线图、占比饼图和超支警戒，让每一笔开销都一目了然。"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom control row */}
      <div className="flex flex-col gap-6">
        <ProgressDots total={2} current={step} />

        <div className="flex gap-4">
          {step === 0 ? (
            <Button
              onClick={() => setStep(1)}
              className="flex-1 bg-brand-primary hover:bg-brand-active text-white py-6 text-sm font-medium rounded-md shadow-md active:scale-95 transition-transform"
            >
              下一步
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="flex-1 bg-brand-primary hover:bg-brand-active text-white py-6 text-sm font-medium rounded-md shadow-md active:scale-95 transition-transform"
            >
              开始使用
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default WelcomePage;
