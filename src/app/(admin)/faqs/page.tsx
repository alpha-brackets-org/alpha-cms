'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useFaqs, useDeleteFaq } from '@/hooks/use-faqs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PublishStatus } from '@/types/cms';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { Badge } from '@/components/ui/badge';

export default function FaqsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { activePortfolio } = usePortfolio();

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetFaq, setTargetFaq] = useState<{
    id: string;
    question: string;
  } | null>(null);

  const { data: response, isLoading } = useFaqs({
    search: debouncedSearch,
    status,
    page,
    limit,
  });
  const deleteMutation = useDeleteFaq();

  const faqs = response?.data || [];
  const total = response?.total || 0;
  const hasNextPage = response?.hasNextPage || false;
  const hasPrevPage = response?.hasPrevPage || false;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('all');
    setPage(1);
  };

  const handleDeleteTrigger = (id: string, question: string) => {
    setTargetFaq({ id, question });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetFaq) return;
    deleteMutation.mutate(targetFaq.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            FAQs
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Manage frequently asked questions
          </p>
        </div>
        <Button asChild>
          <Link href="/faqs/create" className="gap-2">
            <Plus className="h-4 w-4" />
            NEW FAQ
          </Link>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col items-end gap-4 border-2 border-border bg-secondary/30 p-4 md:flex-row">
        <div className="relative w-full flex-1">
          <Label className="mb-1 block opacity-60">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by question or answer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-[42px] pl-10"
            />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-end gap-4 md:w-auto">
          <div className="flex-1 md:flex-none">
            <Label className="mb-1 block opacity-60">Status</Label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-[42px] min-w-[140px]"
            >
              <option value="all">All Status</option>
              {Object.values(PublishStatus).map((stat) => (
                <option key={stat} value={stat}>
                  {stat.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-none">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!searchTerm && status === 'all'}
              className="h-[42px] px-6"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <BrutalTable
        headers={
          [
            'Question',
            'Group',
            !activePortfolio && 'Portfolio',
            'Status',
            'Order',
            'Actions',
          ].filter(Boolean) as string[]
        }
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="mb-2 h-4 w-48" />
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <Skeleton className="h-4 w-24" />
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <Skeleton className="h-4 w-16" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-12" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : faqs.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Search className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No FAQs matched your filters
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          faqs.map((faq) => (
            <BrutalTableRow key={faq._id} className="group">
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <div className="cursor-pointer text-sm font-bold transition-colors group-hover:text-primary">
                    {faq.question}
                  </div>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                  {faq.group || '-'}
                </div>
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <div className="text-[10px] font-bold uppercase tracking-tight">
                    {faq.portfolio?.name}
                  </div>
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <Badge
                  variant={
                    faq.status === 'published'
                      ? 'default'
                      : faq.status === 'draft'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {faq.status}
                </Badge>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="font-mono text-sm">{faq.order}</div>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/faqs/${faq._id}`}
                    className="border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTrigger(faq._id, faq.question)}
                    disabled={deleteMutation.isPending}
                    className="group/del border border-transparent p-2 transition-colors hover:border-destructive/20 hover:bg-destructive/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover/del:text-destructive" />
                  </button>
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        )}
      </BrutalTable>

      {/* Pagination */}
      {response && response.totalPages > 1 && (
        <BrutalPagination
          currentPage={page}
          totalPages={response.totalPages}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageChange={setPage}
          totalItems={total}
          itemsCount={faqs.length}
          label="FAQS"
        />
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE FAQ?"
        message={`Are you sure you want to delete this FAQ? This action is irreversible.`}
        confirmText="DELETE NOW"
        isDestructive={true}
      />
    </div>
  );
}
