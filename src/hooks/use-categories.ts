import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Category,
  PopulatedCategory,
  CategoryFilters,
  PaginatedResponse,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useCategories(filters: CategoryFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedCategory>>(
    ['categories', filters],
    () => api.get(`/categories${buildQueryString(filters)}`)
  );
}

export function useCategory(id: string) {
  return useCmsQuery<{ data: PopulatedCategory }>(['category', id], () =>
    api.get(`/categories/${id}`)
  );
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) =>
      api.post<{ data: Category }>('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Category created successfully!' },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) =>
      api.patch<{ data: Category }>(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
    meta: { successMessage: 'Category updated successfully!' },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Category deleted permanently.' },
  });
}
