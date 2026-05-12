import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:scale-[1.01]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-2 border-primary shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)] hover:shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] hover:translate-x-[2px] hover:translate-y-[2px]',
        destructive:
          'bg-destructive text-destructive-foreground border-2 border-destructive shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,0.3)] hover:translate-x-[2px] hover:translate-y-[2px]',
        outline:
          'border-2 border-border bg-background hover:bg-secondary hover:text-secondary-foreground shadow-[4px_4px_0px_0px_rgba(var(--border),0.1)] hover:shadow-none',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-secondary shadow-[4px_4px_0px_0px_rgba(var(--secondary),0.3)]',
        ghost:
          'hover:bg-secondary hover:text-secondary-foreground border-2 border-transparent',
        link: 'text-primary underline-offset-4 hover:underline',
        brutal:
          'bg-background text-foreground border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
        xl: 'h-16 px-12 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
