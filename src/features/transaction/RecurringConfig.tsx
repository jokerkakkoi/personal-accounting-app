import React from 'react';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';

interface RecurringConfigData {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string;
}

interface RecurringConfigProps {
  value: RecurringConfigData;
  onChange: (value: RecurringConfigData) => void;
  className?: string;
}

export const RecurringConfig: React.FC<RecurringConfigProps> = ({
  value,
  onChange,
  className,
}) => {
  const handleFrequencyChange = (freq: string) => {
    onChange({
      ...value,
      frequency: freq as 'daily' | 'weekly' | 'monthly' | 'yearly',
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: e.target.value || undefined,
    });
  };

  return (
    <div className={className}>
      <div className="bg-surface-soft border border-hairline p-3 rounded-lg flex flex-col gap-3">
        {/* Frequency Choice */}
        <div className="flex items-center justify-between gap-4">
          <Label className="text-xs text-ink shrink-0 select-none">重复频率</Label>
          <Select value={value.frequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="w-28 h-8 text-xs bg-canvas border border-hairline">
              <SelectValue placeholder="选择频率" />
            </SelectTrigger>
            <SelectContent className="bg-canvas border border-hairline">
              <SelectItem value="daily" className="text-xs">每天</SelectItem>
              <SelectItem value="weekly" className="text-xs">每周</SelectItem>
              <SelectItem value="monthly" className="text-xs">每月</SelectItem>
              <SelectItem value="yearly" className="text-xs">每年</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* End Date Choice */}
        <div className="flex items-center justify-between gap-4">
          <Label className="text-xs text-ink shrink-0 select-none">结束日期 (可选)</Label>
          <Input
            type="date"
            value={value.endDate || ''}
            onChange={handleEndDateChange}
            className="w-36 h-8 text-xs bg-canvas border border-hairline"
          />
        </div>
      </div>
    </div>
  );
};
export default RecurringConfig;
