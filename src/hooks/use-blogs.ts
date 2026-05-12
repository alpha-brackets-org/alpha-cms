import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaginatedResponse,
  Blog,
  PopulatedBlog,
  BlogFilters,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useBlogs(filters: BlogFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedBlog>>(['blogs', filters], () =>
    api.get(`/blogs${buildQueryString(filters)}`)
  );
}

export function useBlog(id: string) {
  return useCmsQuery<PopulatedBlog>(['blog', id], () => api.get(`/blogs/${id}`), {
    enabled: id !== 'new' && !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Blog>) =>
      api.post<{ id: string }>('/blogs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Article created successfully!' },
  });
}

export function useUpdateBlog(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Blog>) => api.patch(`/blogs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Article updated successfully!' },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Article deleted successfully.' },
  });
}
