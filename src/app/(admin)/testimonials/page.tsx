'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  MessageSquareQuote,
} from 'lucide-react';
import {
  useTestimonials,
  useDeleteTestimonial,
} from '@/hooks/use-testimonials';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TestimonialStatus } from '@/types/cms';


export default function TestimonialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { activePortfolio } = usePortfolio();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  const { data: response, isLoading } = useTestimonials({
    search: debouncedSearch,
    status,
    page,
    limit,
  });
  const deleteMutation = useDeleteTestimonial();

  const testimonials = response?.data || [];
  const total = response?.total || 0;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('all');
    setPage(1);
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    setTarget({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!target) return;
    deleteMutation.mutate(target.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <MessageSquareQuote className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold uppercase tracking-tight">
              Testimonials
            </h2>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {total} testimonial{total !== 1 ? 's' : ''} · manage social proof
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/testimonials/create">
            <Plus className="h-4 w-4" />
            NEW TESTIMONIAL
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-end gap-4 rounded-2xl border border-white/10 bg-secondary/20 p-4 backdrop-blur-xl md:flex-row">
        <div className="relative w-full flex-1">
          <Label className="mb-1 block opacity-60">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="testimonials-search"
              placeholder="Search by name, company, content..."
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
              id="testimonials-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-[42px] min-w-[140px]"
            >
              <option value="all">All Status</option>
              {Object.values(TestimonialStatus).map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
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

      {/* Table */}
      <BrutalTable
        headers={
          [
            'Client',
            'Content',
            'Rating',
            !activePortfolio && 'Portfolio',
            'Status',
            'Actions',
          ].filter(Boolean) as string[]
        }
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-48" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-16" />
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <Skeleton className="h-4 w-20" />
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <Skeleton className="h-5 w-16" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : testimonials.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <MessageSquareQuote className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  No testimonials matched your filters
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          testimonials.map((t) => (
            <BrutalTableRow key={t._id} className="group">
              {/* Client */}
              <BrutalTableCell>
                <div className="font-bold transition-colors group-hover:text-primary">
                  {t.name}
                </div>
                {(t.role || t.company) && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {[t.role, t.company].filter(Boolean).join(' · ')}
                  </div>
                )}
                {t.platform && (
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-widest text-primary/70">
                    {t.platform}
                  </div>
                )}
              </BrutalTableCell>

              {/* Content snippet */}
              <BrutalTableCell>
                <p className="max-w-xs truncate text-sm text-muted-foreground">
                  &ldquo;{t.content}&rdquo;
                </p>
              </BrutalTableCell>

              {/* Rating */}
              <BrutalTableCell>
                <StarRating rating={t.rating} />
              </BrutalTableCell>

              {/* Portfolio */}
              {!activePortfolio && (
                <BrutalTableCell>
                  <div className="text-[10px] font-bold uppercase tracking-tight">
                    {t.portfolio?.name || '—'}
                  </div>
                </BrutalTableCell>
              )}

              {/* Status */}
              <BrutalTableCell>
                <StatusBadge status={t.status} />
                {t.featured && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase text-amber-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400" /> Featured
                  </div>
                )}
              </BrutalTableCell>

              {/* Actions */}
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/testimonials/${t._id}`}
                    className="rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTrigger(t._id!, t.name)}
                    disabled={deleteMutation.isPending}
                    className="group/del rounded-lg border border-transparent p-2 transition-colors hover:border-destructive/20 hover:bg-destructive/10 disabled:opacity-30"
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
          hasPrevPage={response.hasPrevPage}
          hasNextPage={response.hasNextPage}
          onPageChange={setPage}
          totalItems={total}
          itemsCount={testimonials.length}
          label="TESTIMONIALS"
        />
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE TESTIMONIAL?"
        message={`Delete "${target?.name}"? This action cannot be undone.`}
        confirmText="DELETE NOW"
        isDestructive={true}
      />
    </div>
  );
}
