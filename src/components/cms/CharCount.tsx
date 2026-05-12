'use client';

import { cn } from '@/lib/utils';

interface CharCountProps {
  current: number;
  max?: number;
  min?: number;
  className?: string;
}

export const CharCount = ({ current, max, min, className }: CharCountProps) => {
  const isError = (max && current > max) || (min && current < min);
  const isWarning = max && current > max * 0.9;

  return (
    <div
      className={cn(
        'mt-1.5 flex justify-end font-mono text-[9px] font-bold uppercase tracking-widest',
        isError
          ? 'text-destructive'
          : isWarning
            ? 'text-amber-500'
            : 'text-muted-foreground',
        className
      )}
    >
      <span className="mr-1">LENGTH:</span>
      <span>{current}</span>
      {max && (
        <>
          <span className="mx-0.5">/</span>
          <span>{max}</span>
        </>
      )}
    </div>
  );
};
