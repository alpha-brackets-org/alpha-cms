import * as React from 'react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      'peer h-5 w-5 shrink-0 cursor-pointer rounded-sm border border-border bg-background accent-primary ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
