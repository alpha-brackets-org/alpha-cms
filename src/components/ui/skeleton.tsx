import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('brutal-border animate-pulse bg-secondary/50', className)}
      {...props}
    />
  );
}

export { Skeleton };
