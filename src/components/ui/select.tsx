import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    const [hasValue, setHasValue] = React.useState(
      !!props.value || !!props.defaultValue
    );

    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    return (
      <div className={cn('group relative w-full', wrapperClassName)}>
        <select
          className={cn(
            'flex h-12 w-full cursor-pointer appearance-none rounded-md border border-border bg-background pl-4 pr-10 text-sm font-medium transition-all hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            hasValue ? 'text-foreground' : 'text-muted-foreground',
            className
          )}
          ref={ref}
          {...props}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            if (props.onChange) props.onChange(e);
          }}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors group-hover:text-primary">
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground"
          >
            <path
              d="M2 2L6 6L10 2"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
