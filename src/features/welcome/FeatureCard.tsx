import React from 'react';

interface FeatureCardProps {
  emoji: string;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ emoji, title, description }) => {
  return (
    <div className="bg-surface-card border border-hairline p-4 rounded-lg flex items-start gap-3 text-left">
      <span className="text-3xl select-none" role="img" aria-label={title}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-base font-semibold text-ink mb-0.5 select-none">{title}</h4>
        <p className="text-xs text-body leading-relaxed select-none">{description}</p>
      </div>
    </div>
  );
};
export default FeatureCard;
