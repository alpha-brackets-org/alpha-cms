'use client';

import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Target,
  Phone,
  Building2,
  User,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useLeads, useDeleteLead, useUpdateLead } from '@/hooks/use-leads';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LeadSource, LeadStatus } from '@/schemas/cms';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

export default function LeadsPage() {
  const { activePortfolio } = usePortfolio();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetLead, setTargetLead] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: response, isLoading } = useLeads({
    search: debouncedSearch,
    status: status === 'all' ? undefined : status,
    page,
    limit,
    portfolio: activePortfolio || undefined,
  });

  const deleteMutation = useDeleteLead();
  const updateMutation = useUpdateLead();

  const items = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;
  const hasNextPage = response?.hasNextPage || false;
  const hasPrevPage = response?.hasPrevPage || false;

  const handleDeleteTrigger = (id: string, name: string) => {
    setTargetLead({ id, name });
    setConfirmOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('all');
    setPage(1);
  };

  const handleConfirmDelete = () => {
    if (!targetLead) return;
    deleteMutation.mutate(targetLead.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Leads (CRM)
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Manage your B2B contacts and gated-content downloads
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          onClick={() => {
            const url = activePortfolio
              ? `/api/leads/export?portfolio=${activePortfolio}`
              : '/api/leads/export';
            window.open(url, '_blank');
          }}
        >
          <Download className="h-4 w-4" />
          EXPORT LEADS (CSV)
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-end gap-4 border-2 border-border bg-secondary/30 p-4 md:flex-row">
        <div className="relative w-full flex-1">
          <Label className="mb-1 block opacity-60">Search Leads</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
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
          <div className="w-full flex-1 md:w-40 md:flex-none">
            <Label className="mb-1 block opacity-60">Lead Status</Label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-[42px]"
            >
              <option value="all">All Status</option>
              {Object.values(LeadStatus).map((stat) => (
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

      {/* Table */}
      <BrutalTable
        headers={['Contact', 'Company Details', 'Source', 'Status', 'Actions']}
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-32" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-20" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8" />
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : items.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={5} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Target className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No leads found
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          items.map((item) => (
            <BrutalTableRow key={item._id}>
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">
                    {item.firstName} {item.lastName}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <a
                    href={`mailto:${item.email}`}
                    className="transition-colors hover:text-primary"
                  >
                    {item.email}
                  </a>
                  {item.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {item.phone}
                      </span>
                    </>
                  )}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                  <Building2 className="h-3 w-3 text-primary" />
                  {item.company || 'Not Provided'}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                  <User className="h-3 w-3" /> {item.jobTitle}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <Badge variant="outline" className="text-[9px]">
                  {item.source === LeadSource.CASE_STUDY
                    ? 'CASE STUDY DOWNLOAD'
                    : item.source.toUpperCase()}
                </Badge>
                {item.downloadedItems && item.downloadedItems.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                    <FileText className="h-3 w-3" />{' '}
                    {item.downloadedItems.length} Files
                  </div>
                )}
              </BrutalTableCell>
              <BrutalTableCell>
                <Select
                  value={item.status}
                  onChange={(e) =>
                    handleStatusChange(item._id!, e.target.value as LeadStatus)
                  }
                  className={cn(
                    'h-8 w-32 border-2 text-[10px] font-black uppercase tracking-tighter',
                    {
                      [LeadStatus.NEW]:
                        'border-blue-500 bg-blue-50 text-blue-700',
                      [LeadStatus.CONTACTED]:
                        'border-yellow-500 bg-yellow-50 text-yellow-700',
                      [LeadStatus.QUALIFIED]:
                        'border-green-500 bg-green-50 text-green-700',
                      [LeadStatus.DISQUALIFIED]:
                        'border-red-500 bg-red-50 text-red-700',
                    }[item.status]
                  )}
                >
                  {Object.values(LeadStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/leads/${item._id}`}
                    className="group/view border border-transparent p-2 transition-all hover:border-primary/20 hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground group-hover/view:text-primary" />
                  </Link>
                  <button
                    onClick={() =>
                      handleDeleteTrigger(
                        item._id!,
                        `${item.firstName} ${item.lastName}`
                      )
                    }
                    className="group/del border border-transparent p-2 transition-all hover:border-destructive/20 hover:bg-destructive/10"
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
      <BrutalPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        hasPrevPage={hasPrevPage}
        hasNextPage={hasNextPage}
        totalItems={total}
        itemsCount={items.length}
        label="LEADS"
      />

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE LEAD?"
        message={`Are you sure you want to delete "${targetLead?.name.toUpperCase()}"? This action cannot be undone.`}
      />
    </div>
  );
}
