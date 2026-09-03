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
      <div className="text-xs font-medium text-muted-foreground">
        {itemsCount !== undefined && totalItems !== undefined ? (
          <>
            Showing {itemsCount} of {totalItems} {label.toLowerCase()}
          </>
        ) : (
          <>
            Page {currentPage} of {totalPages}
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          className="w-24 gap-1 disabled:opacity-30"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-24 gap-1 disabled:opacity-30"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
