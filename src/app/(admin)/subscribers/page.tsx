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
import { getSubscriberSourceStyle } from '@/lib/badge-colors';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

export default function SubscribersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError } = useSubscribers({
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
          <h2 className="mb-2 text-3xl font-semibold tracking-tight">
            Newsletter Audience
          </h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Monitor and manage cross-portfolio subscribers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 md:w-64">
            <Input
              placeholder="Search email..."
              className="h-10 text-xs font-medium"
              leftSection={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFilters({ ...filters, page: 1 });
              }}
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(val) =>
              setFilters({ ...filters, status: val, page: 1 })
            }
          >
            <SelectTrigger className="h-10 w-40 shrink-0 text-xs font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(SubscriberStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.source}
            onValueChange={(val) =>
              setFilters({ ...filters, source: val, page: 1 })
            }
          >
            <SelectTrigger className="h-10 w-48 shrink-0 text-xs font-medium">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.values(SubscriberSource).map((source) => (
                <SelectItem key={source} value={source}>
                  {source
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-primary/10 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-primary/80">
            Total Subscribers
          </p>
          <p className="text-4xl font-semibold text-primary">
            {data?.pagination.total || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Active Subscribers
          </p>
          <p className="text-4xl font-semibold text-foreground">
            {data?.data.filter((s) => s.status === SubscriberStatus.ACTIVE)
              .length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Portfolios Reached
          </p>
          <p className="text-4xl font-semibold text-foreground">
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
        ) : isError ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6}>
              <QueryErrorState />
            </BrutalTableCell>
          </BrutalTableRow>
        ) : data?.data.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6} className="p-20 text-center">
              <div className="flex flex-col items-center justify-center opacity-50">
                <Mail className="mb-4 h-12 w-12" />
                <p className="text-xs uppercase tracking-wide">
                  No subscribers found
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          data?.data.map((subscriber) => (
            <BrutalTableRow key={subscriber._id}>
              <BrutalTableCell>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-border bg-secondary p-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {subscriber.email}
                  </span>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {subscriber.portfolio.name}
                  </span>
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                {(() => {
                  const config = getSubscriberSourceStyle(
                    subscriber.source as SubscriberSource
                  );
                  return (
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-2 py-0 text-[10px] uppercase tracking-wide',
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
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary">
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
                    className="px-3 py-0.5 text-[10px] uppercase tracking-wide"
                  >
                    {subscriber.status === SubscriberStatus.ACTIVE ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Unsubscribed
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
                  className="h-10 w-10 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        )}
      </BrutalTable>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <BrutalPagination
          currentPage={filters.page}
          totalPages={data.pagination.totalPages}
          hasPrevPage={data.pagination.hasPrevPage}
          hasNextPage={data.pagination.hasNextPage}
          onPageChange={(page) => setFilters({ ...filters, page })}
          totalItems={data.pagination.total}
          itemsCount={data.data.length}
          label="IDENTITIES"
        />
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Subscriber?"
        message="This will permanently delete this subscriber from the database. They will no longer receive any updates from this portfolio."
        confirmText="Delete Subscriber"
      />
    </div>
  );
}
