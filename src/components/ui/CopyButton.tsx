'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CopyButtonProps {
  value: string;
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

export function CopyButton({
  value,
  className,
  iconSize = 14,
  showText = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 transition-all hover:text-primary active:scale-95',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="text-primary" size={iconSize} />
      ) : (
        <Copy size={iconSize} />
      )}
      {showText && (
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {copied ? 'Copied' : 'Copy'}
        </span>
      )}
    </button>
  );
}
