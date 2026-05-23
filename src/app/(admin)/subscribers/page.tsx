'use client';

import React, { useState } from 'react';
import { Mail, Search, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import {
  useSubscribers,
  useUpdateSubscriber,
  useDeleteSubscriber,
} from '@/hooks/use-subscribers';
import { Skeleton } from '@/components/ui/skeleton';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SubscriberStatus, SubscriberSource } from '@/schemas/cms';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function SubscribersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    page: 1,
    limit: 10,
  });

  const { data, isLoading } = useSubscribers({
    ...filters,
    search: debouncedSearch,
  });
  const updateMutation = useUpdateSubscriber();
  const deleteMutation = useDeleteSubscriber();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleDeleteTrigger = (id: string) => {
    setTargetId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetId) return;
    deleteMutation.mutate(targetId, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus =
      currentStatus === SubscriberStatus.ACTIVE
        ? SubscriberStatus.UNSUBSCRIBED
        : SubscriberStatus.ACTIVE;
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  return (
    <div className="relative min-h-full space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-black uppercase tracking-tight">
            Newsletter Audience
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Monitor and manage cross-portfolio subscribers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="SEARCH EMAIL..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFilters({ ...filters, page: 1 });
              }}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="h-10 w-40"
          >
            <option value="all">ALL STATUS</option>
            {Object.values(SubscriberStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            value={filters.source}
            onChange={(e) =>
              setFilters({ ...filters, source: e.target.value, page: 1 })
            }
            className="h-10 w-40"
          >
            <option value="all">ALL SOURCES</option>
            {Object.values(SubscriberSource).map((source) => (
              <option key={source} value={source}>
                {source.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-primary/20 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Total Subscribers
          </p>
          <p className="text-4xl font-bold text-primary">
            {data?.total || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Active Nodes
          </p>
          <p className="text-4xl font-bold text-foreground">
            {data?.data.filter((s) => s.status === SubscriberStatus.ACTIVE)
              .length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-secondary/50 p-6 shadow-sm backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Portfolios Reached
          </p>
          <p className="text-4xl font-bold text-foreground">
            {new Set(data?.data.map((s) => s.portfolio._id)).size || 0}
          </p>
        </div>
      </div>

      <BrutalTable
        headers={[
          'Subscriber Identity',
          'Environment',
          'Source',
          'Activity/Intent',
          'Status',
          'Actions',
        ]}
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="h-4 w-48" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-32" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-6 w-20" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-16" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8" />
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : data?.data.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6} className="p-20 text-center">
              <div className="flex flex-col items-center justify-center opacity-50">
                <Mail className="mb-4 h-12 w-12" />
                <p className="text-xs font-black uppercase tracking-widest">
                  No subscribers detected in perimeter
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          data?.data.map((subscriber) => (
            <BrutalTableRow key={subscriber._id}>
              <BrutalTableCell>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-white/10 bg-secondary p-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-sm font-bold">
                    {subscriber.email}
                  </span>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">
                    {subscriber.portfolio.name}
                  </span>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                {(() => {
                  const sourceStyles: Record<
                    SubscriberSource,
                    { color: string; label: string }
                  > = {
                    [SubscriberSource.NEWSLETTER]: {
                      color: 'border-blue-500 text-blue-500 bg-blue-500/5',
                      label: SubscriberSource.NEWSLETTER.replace(
                        /_/g,
                        ' '
                      ).toUpperCase(),
                    },
                    [SubscriberSource.CASE_STUDY_DOWNLOAD]: {
                      color: 'border-amber-500 text-amber-500 bg-amber-500/5',
                      label: SubscriberSource.CASE_STUDY_DOWNLOAD.replace(
                        /_/g,
                        ' '
                      ).toUpperCase(),
                    },
                    [SubscriberSource.MANUAL]: {
                      color:
                        'border-purple-500 text-purple-500 bg-purple-500/5',
                      label: SubscriberSource.MANUAL.replace(
                        /_/g,
                        ' '
                      ).toUpperCase(),
                    },
                  };

                  const config =
                    sourceStyles[subscriber.source as SubscriberSource] ||
                    sourceStyles[SubscriberSource.NEWSLETTER];

                  return (
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-none border-2 px-2 py-0 text-[9px] font-black uppercase tracking-tighter',
                        config.color
                      )}
                    >
                      {config.label}
                    </Badge>
                  );
                })()}
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="max-w-[200px]">
                  {subscriber.intent ? (
                    <p
                      className="truncate text-[10px] italic text-muted-foreground"
                      title={subscriber.intent}
                    >
                      {subscriber.intent}
                    </p>
                  ) : (
                    <span className="text-[10px] italic text-muted-foreground/30">
                      No intent recorded
                    </span>
                  )}
                  {subscriber.downloadHistory &&
                    subscriber.downloadHistory.length > 0 && (
                      <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-primary">
                        {subscriber.downloadHistory.length} Downloads
                      </p>
                    )}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <button
                  onClick={() =>
                    toggleStatus(subscriber._id!, subscriber.status)
                  }
                  className="cursor-pointer transition-transform active:scale-95"
                >
                  <Badge
                    variant={
                      subscriber.status === SubscriberStatus.ACTIVE
                        ? 'default'
                        : 'destructive'
                    }
                    className="rounded-none border-2 border-foreground px-3 py-0.5 font-black uppercase tracking-widest"
                  >
                    {subscriber.status === SubscriberStatus.ACTIVE ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> UNSUBSCRIBED
                      </span>
                    )}
                  </Badge>
                </button>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTrigger(subscriber._id!)}
                  className="h-10 w-10 border-2 border-transparent hover:border-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        )}
      </BrutalTable>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <BrutalPagination
          currentPage={filters.page}
          totalPages={data.totalPages}
          hasPrevPage={data.hasPrevPage}
          hasNextPage={data.hasNextPage}
          onPageChange={(page) => setFilters({ ...filters, page })}
          totalItems={data.total}
          itemsCount={data.data.length}
          label="IDENTITIES"
        />
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="WIPE SUBSCRIBER?"
        message="This will permanently delete this subscriber from the database. They will no longer receive any updates from this portfolio."
        confirmText="ERASE IDENTITY"
      />
    </div>
  );
}
