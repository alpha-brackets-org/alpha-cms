'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, Building2, Plus } from 'lucide-react';
import { useCaseStudies, useDeleteCaseStudy } from '@/hooks/use-case-studies';
import { useCategories } from '@/hooks/use-categories';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PublishStatus } from '@/types/cms';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';

export default function CaseStudiesPage() {
  const { activePortfolio } = usePortfolio();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProject, setTargetProject] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: response, isLoading } = useCaseStudies({
    search: debouncedSearch,
    status,
    category,
    page,
    limit,
  });
  const { data: categoriesData } = useCategories();
  const deleteMutation = useDeleteCaseStudy();

  const categories = categoriesData?.data || [];
  const items = response?.data || [];
  const total = response?.total || 0;
  const hasNextPage = response?.hasNextPage || false;
  const hasPrevPage = response?.hasPrevPage || false;

  const handleDeleteTrigger = (id: string, title: string) => {
    setTargetProject({ id, title });
    setConfirmOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('all');
    setCategory('all');
    setPage(1);
  };

  const handleConfirmDelete = () => {
    if (!targetProject) return;
    deleteMutation.mutate(targetProject.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Case Studies
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Showcase your agency&apos;s finest work
          </p>
        </div>
        <Button asChild>
          <Link href="/case-studies/create" className="gap-2">
            <Plus className="h-4 w-4" />
            NEW PROJECT
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-end gap-4 border-2 border-border bg-secondary/30 p-4 md:flex-row">
        <div className="relative w-full flex-1">
          <Label className="mb-1 block opacity-60">Search Projects</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, client, industry..."
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
            <Label className="mb-1 block opacity-60">Category</Label>
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="h-[42px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full flex-1 md:w-40 md:flex-none">
            <Label className="mb-1 block opacity-60">Status</Label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-[42px]"
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
              disabled={!searchTerm && status === 'all' && category === 'all'}
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
            'Project',
            !activePortfolio && 'Portfolio',
            'Client / Industry',
            'Category',
            'Status',
            'Actions',
          ].filter(Boolean) as string[]
        }
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <Skeleton className="h-4 w-24" />
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-24" />
              </BrutalTableCell>
              <BrutalTableCell>
                <Skeleton className="h-4 w-16" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : items.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={6} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Search className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No case studies matched your filters
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          items.map((item) => (
            <BrutalTableRow key={item._id} className="group">
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <div className="cursor-pointer text-sm font-bold transition-colors group-hover:text-primary">
                    {item.projectTitle}
                  </div>
                  {item.featured && (
                    <Badge className="h-4 text-[8px]">FEATURED</Badge>
                  )}
                </div>
                <div className="mt-1 font-mono text-[8px] text-muted-foreground opacity-60">
                  /{item.slug} • {item.year || '2024'}
                </div>
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <div className="text-[10px] font-bold uppercase tracking-tight">
                    {item.portfolio?.name || 'Global'}
                  </div>
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                  <Building2 className="h-3 w-3 text-primary" />
                  {item.client || 'Confidential'}
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                  {item.industry || 'General'}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="text-[10px] font-medium uppercase opacity-80">
                  {item.category?.name}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <Badge
                  variant={
                    item.status === 'published'
                      ? 'default'
                      : item.status === 'draft'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {item.status || 'draft'}
                </Badge>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/case-studies/${item._id}`}
                    className="border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() =>
                      handleDeleteTrigger(item._id, item.projectTitle)
                    }
                    className="group/del border border-transparent p-2 transition-colors hover:border-destructive/20 hover:bg-destructive/10"
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
          itemsCount={items.length}
          label="PROJECTS"
        />
      )}

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE PROJECT?"
        message={`Are you sure you want to delete "${targetProject?.title.toUpperCase()}"? This project will be removed from all agency portfolios.`}
      />
    </div>
  );
}
