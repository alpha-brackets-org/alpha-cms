'use client';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { LeadStatus } from '@/schemas/cms';
import { cn } from '@/lib/utils';

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'border-blue-500 bg-blue-50 text-blue-700',
  [LeadStatus.CONTACTED]: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  [LeadStatus.QUALIFIED]: 'border-green-500 bg-green-50 text-green-700',
  [LeadStatus.DISQUALIFIED]: 'border-red-500 bg-red-50 text-red-700',
};

interface LeadStatusSelectProps {
  value: LeadStatus;
  onValueChange: (value: LeadStatus) => void;
  className?: string;
}

/**
 * Shared color-coded LeadStatus select — used by both the leads list (table
 * cell) and the lead detail page, so the options list and color mapping only
 * exist in one place.
 */
export function LeadStatusSelect({
  value,
  onValueChange,
  className,
}: LeadStatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as LeadStatus)}
    >
      <SelectTrigger
        className={cn(
          'border-2 text-[10px] font-black uppercase tracking-tighter',
          LEAD_STATUS_STYLES[value],
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(LeadStatus).map((status) => (
          <SelectItem key={status} value={status}>
            {status.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
