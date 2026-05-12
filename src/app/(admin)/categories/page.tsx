'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Edit, Trash2, Tag, Loader2 } from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { Skeleton } from '@/components/ui/skeleton';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Category, CategorySchema } from '@/schemas/cms';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BrutalTable,
  BrutalTableRow,
  BrutalTableCell,
} from '@/components/ui/BrutalTable';
import { BrutalPagination } from '@/components/ui/BrutalPagination';
import { useState } from 'react';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { usePortfolios } from '@/hooks/use-portfolios';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/providers/AuthProvider';
import { hasPermission, CmsPermission } from '@/lib/auth';

export default function CategoriesPage() {
  const { user: currentUser } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: categoriesResponse, isLoading } = useCategories({
    search: debouncedSearch,
    page,
    limit: 10,
  });

  const categories = categoriesResponse?.data || [];
  const totalPages = categoriesResponse?.totalPages || 1;

  const { data: portfolios = [] } = usePortfolios();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(editingCategory?._id || '');
  const deleteMutation = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Category>({
    resolver: zodResolver(CategorySchema),
  });

  const openModal = (category: Category | null = null) => {
    setEditingCategory(category);
    if (category) {
      reset(category);
    } else {
      reset({
        name: '',
        slug: '',
        portfolio: activePortfolio === 'all' ? '' : activePortfolio,
      } as Category);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: Category) => {
    if (editingCategory) {
      updateMutation.mutate(data, { onSuccess: closeModal });
    } else {
      createMutation.mutate(data, { onSuccess: closeModal });
    }
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setTargetCategory({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetCategory) return;
    deleteMutation.mutate(targetCategory.id, {
      onSuccess: () => setConfirmOpen(false),
    });
  };

  return (
    <div className="relative min-h-full space-y-12 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold uppercase tracking-tight">
            Categories
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Organize your content taxonomies
          </p>
        </div>
        {hasPermission(currentUser, CmsPermission.CAN_EDIT_CONTENT) && (
          <Button onClick={() => openModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            NEW CATEGORY
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col items-end gap-4 border-2 border-border bg-secondary/30 p-4 md:flex-row">
        <div className="relative w-full flex-1">
          <Label className="mb-1 block opacity-60">Search Categories</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-[42px] pl-10"
            />
          </div>
        </div>
      </div>

      <BrutalTable
        headers={
          [
            'Category Name',
            !activePortfolio && 'Portfolio',
            'URL Slug',
            'Actions',
          ].filter(Boolean) as string[]
        }
      >
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <BrutalTableRow key={i}>
              <BrutalTableCell>
                <Skeleton className="h-4 w-48" />
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  <Skeleton className="h-4 w-32" />
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <Skeleton className="h-4 w-32" />
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        ) : categories.length === 0 ? (
          <BrutalTableRow>
            <BrutalTableCell
              colSpan={activePortfolio ? 3 : 4}
              className="p-20 text-center"
            >
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Tag className="h-12 w-12" />
                <p className="text-[10px] font-bold uppercase tracking-ultrawide">
                  No categories found
                </p>
              </div>
            </BrutalTableCell>
          </BrutalTableRow>
        ) : (
          categories.map((cat) => (
            <BrutalTableRow key={cat._id} className="group">
              <BrutalTableCell>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold transition-colors group-hover:text-primary">
                    {cat.name}
                  </div>
                  {cat.isDefault && <Badge variant="system">SYSTEM</Badge>}
                </div>
              </BrutalTableCell>
              {!activePortfolio && (
                <BrutalTableCell>
                  {cat.isDefault ? (
                    <span className="text-[10px] uppercase tracking-widest opacity-30">
                      Global
                    </span>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold uppercase leading-none opacity-80"
                    >
                      {cat.portfolio?.name}
                    </Badge>
                  )}
                </BrutalTableCell>
              )}
              <BrutalTableCell>
                <div className="font-mono text-[10px] text-muted-foreground">
                  /{cat.slug}
                </div>
              </BrutalTableCell>
              <BrutalTableCell className="text-right">
                {!cat.isDefault &&
                  hasPermission(
                    currentUser,
                    CmsPermission.CAN_EDIT_CONTENT
                  ) && (
                    <div className="flex justify-end gap-2 opacity-40 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          openModal({
                            ...cat,
                            portfolio: cat.portfolio?._id || '',
                          } as Category)
                        }
                        className="h-9 w-9 border border-transparent hover:border-border hover:bg-secondary"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteConfirm(cat._id, cat.name)}
                        className="h-9 w-9 border border-transparent hover:border-destructive/20 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
              </BrutalTableCell>
            </BrutalTableRow>
          ))
        )}
      </BrutalTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <BrutalPagination
          currentPage={page}
          totalPages={totalPages}
          hasPrevPage={page > 1}
          hasNextPage={page < totalPages}
          onPageChange={setPage}
          label="CATEGORIES"
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader className="mb-6 border-none p-0">
            <DialogTitle>
              {editingCategory ? 'Update Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              Configure the taxonomy settings for your content.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Development" />
              {errors.name && (
                <p className="text-[9px] font-bold uppercase text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input {...register('slug')} placeholder="development" />
              {errors.slug && (
                <p className="text-[9px] font-bold uppercase text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            {(!activePortfolio || activePortfolio === 'all') &&
              !editingCategory && (
                <div className="space-y-2">
                  <Label>Assign to Portfolio</Label>
                  <Select
                    {...register('portfolio')}
                    defaultValue={
                      activePortfolio === 'all' ? '' : activePortfolio || ''
                    }
                  >
                    <option value="" disabled>
                      Select a portfolio
                    </option>
                    {portfolios.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  {errors.portfolio && (
                    <p className="text-[9px] font-bold uppercase text-destructive">
                      {errors.portfolio.message}
                    </p>
                  )}
                </div>
              )}

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full py-8"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
              {editingCategory ? 'CONFIRM UPDATE' : 'CREATE CATEGORY'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Category"
        message={`Are you sure you want to delete "${targetCategory?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
