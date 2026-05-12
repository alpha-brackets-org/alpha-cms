'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface BrutalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  requireTextMatch?: string;
}

export function BrutalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  isDestructive = true,
  isLoading = false,
  requireTextMatch,
}: BrutalConfirmProps) {
  const [matchInput, setMatchInput] = React.useState('');

  // Reset input when modal closes
  useEffect(() => {
    if (!isOpen) setMatchInput('');
  }, [isOpen]);
  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-background/95 backdrop-blur-md transition-opacity"
      />

      {/* Modal Content */}
      <div className="animate-in fade-in zoom-in relative w-full max-w-md overflow-hidden border-4 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] duration-200 md:p-8">
        {/* Warning Stripe */}
        <div
          className={`absolute left-0 top-0 h-2 w-full ${isDestructive ? 'bg-destructive' : 'bg-primary'}`}
        />

        <div className="mt-4 flex flex-col items-center space-y-6 text-center">
          <div
            className={`rounded-full p-4 ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
          >
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter">
              {title}
            </h3>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>

          {requireTextMatch && (
            <div className="w-full space-y-2 text-left">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Type{' '}
                <span className="text-foreground">"{requireTextMatch}"</span> to
                confirm
              </label>
              <input
                type="text"
                value={matchInput}
                onChange={(e) => setMatchInput(e.target.value)}
                className="h-10 w-full border-2 border-border bg-background px-3 text-sm focus-visible:border-primary focus-visible:ring-0"
                placeholder={`Type '${requireTextMatch}' here...`}
              />
            </div>
          )}

          <div className="grid w-full grid-cols-2 gap-4 pt-4">
            <button
              onClick={onClose}
              className="border-2 border-border px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-secondary"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={
                isLoading ||
                (requireTextMatch ? matchInput !== requireTextMatch : false)
              }
              className={`border-2 border-border px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                isDestructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              } disabled:opacity-50`}
            >
              {isLoading ? 'PROCESSING...' : confirmText}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 transition-colors hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
