import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BrutalPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  totalItems?: number;
  itemsCount?: number;
  label?: string;
}

export function BrutalPagination({
  currentPage,
  totalPages,
  onPageChange,
  hasPrevPage,
  hasNextPage,
  totalItems,
  itemsCount,
  label = 'ITEMS',
}: BrutalPaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
      <div className="text-[10px] font-black uppercase tracking-ultrawide text-muted-foreground">
        {itemsCount !== undefined && totalItems !== undefined ? (
          <>
            SHOWING {itemsCount} OF {totalItems} {label}
          </>
        ) : (
          <>
            PAGE {currentPage} OF {totalPages}
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-24 gap-1 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-30"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
          PREV
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 w-24 gap-1 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-30"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!hasNextPage}
        >
          NEXT
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
