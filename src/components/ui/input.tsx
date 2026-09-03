import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftSection, rightSection, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {leftSection && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted-foreground">
            {leftSection}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border bg-background py-2 text-sm font-medium ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            leftSection ? 'pl-10' : 'pl-4',
            rightSection ? 'pr-10' : 'pr-4',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightSection && (
          <div className="pointer-events-none absolute right-3 flex items-center justify-center text-muted-foreground">
            {rightSection}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
