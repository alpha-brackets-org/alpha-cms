'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Edit, Trash2, Code, Plus } from 'lucide-react';
import { useProjects, useDeleteProject } from '@/hooks/use-projects';
import { useCategories } from '@/hooks/use-categories';
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

export default function ProjectsPage() {
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

  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  const { data: response, isLoading } = useProjects({
    search: debouncedSearch,
    status: status === 'all' ? undefined : status,
    category: category === 'all' ? undefined : category,
    page,
    limit,
    portfolio: activePortfolio || undefined,
  });

  const deleteMutation = useDeleteProject();

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
            Projects
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Manage your high-visual technical showcases
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/create" className="gap-2">
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
              placeholder="Search by title, tech stack..."
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
                  {cat.name.toUpperCase()}
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

      <BrutalTable headers={['Project', 'Tech Stack', 'Status', 'Actions']}>
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
                <Skeleton className="h-4 w-20" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8" />
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : items.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell colSpan={4} className="p-20 text-center">
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Code className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No projects found
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          items.map((item) => (
            <BrutalTableRow key={item._id}>
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">{item.title}</div>
                  {item.featured && (
                    <Badge className="h-4 text-[8px]">FEATURED</Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  /{item.slug}
                </div>
              </BrutalTableCell>
              <BrutalTableCell>
                <div className="flex flex-wrap gap-1">
                  {item.techStack?.map((tech) => (
                    <Badge
                      key={tech}
                      variant="outline"
                      className="bg-secondary text-[8px]"
                    >
                      {tech}
                    </Badge>
                  )) || (
                    <span className="text-[10px] text-muted-foreground opacity-50">
                      None
                    </span>
                  )}
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
                    href={`/projects/${item._id}`}
                    className="border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTrigger(item._id!, item.title)}
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
        message={`Are you sure you want to delete "${targetProject?.title.toUpperCase()}"? This action cannot be undone.`}
      />
    </div>
  );
}
