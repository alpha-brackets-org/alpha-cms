import React from 'react';
import { cn } from '@/lib/utils';

interface BrutalTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
}

export function BrutalTable({
  headers,
  children,
  className,
  tableClassName,
}: BrutalTableProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto border-4 border-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]',
        className
      )}
    >
      <table
        className={cn(
          'w-full border-collapse bg-card text-left',
          tableClassName
        )}
      >
        <thead>
          <tr className="border-b-4 border-border bg-secondary/50">
            {headers.map((header, i) => (
              <th
                key={i}
                className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function BrutalTableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b-2 border-border transition-colors hover:bg-secondary/20',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function BrutalTableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn('p-4', className)}>
      {children}
    </td>
  );
}
