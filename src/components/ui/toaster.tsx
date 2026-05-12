'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '../../hooks/use-toast';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
} from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        const Icon = {
          default: Terminal,
          success: CheckCircle2,
          destructive: AlertCircle,
          warning: AlertTriangle,
          info: Info,
        }[variant || 'default'];

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-4">
              {Icon && (
                <div className="mt-0.5 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
