import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrutalLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const BrutalLoader: React.FC<BrutalLoaderProps> = ({
  className,
  size = 'md',
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
    >
      <div className="relative">
        {/* Decorative Background Ring */}
        <div
          className={cn(
            'brutal-border absolute inset-0 border-4 border-secondary opacity-20',
            sizes[size]
          )}
        />

        {/* Animated Spinner */}
        <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      </div>

      {text && (
        <p className="animate-pulse text-[10px] font-bold uppercase tracking-ultrawide text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
};
