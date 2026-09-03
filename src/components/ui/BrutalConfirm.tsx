'use client';

import React, { useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-background/95 backdrop-blur-md" />
        <DialogPrimitive.Content
          onEscapeKeyDown={onClose}
          className="animate-in fade-in zoom-in fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xl duration-200 focus:outline-none md:p-8"
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {message}
          </DialogPrimitive.Description>
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
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                {message}
              </p>
            </div>

            {requireTextMatch && (
              <div className="w-full space-y-2 text-left">
                <label className="text-xs font-medium text-muted-foreground">
                  Type{' '}
                  <span className="text-foreground">
                    &quot;{requireTextMatch}&quot;
                  </span>{' '}
                  to confirm
                </label>
                <input
                  type="text"
                  value={matchInput}
                  onChange={(e) => setMatchInput(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder={`Type '${requireTextMatch}' here...`}
                />
              </div>
            )}

            <div className="grid w-full grid-cols-2 gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant={isDestructive ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={
                  isLoading ||
                  (requireTextMatch ? matchInput !== requireTextMatch : false)
                }
              >
                {isLoading ? 'Processing...' : confirmText}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
