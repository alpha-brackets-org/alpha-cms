import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface QueryErrorStateProps {
  message?: string;
}

/**
 * Shared error state for list/detail queries — without this, a failed fetch
 * renders identically to a genuinely empty list, silently hiding real errors.
 */
export function QueryErrorState({
  message = 'Something went wrong loading this data. Please try again.',
}: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-20 text-center text-destructive">
      <AlertTriangle className="h-12 w-12 opacity-60" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
