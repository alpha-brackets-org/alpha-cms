import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResponse, Faq, BaseFilters, PopulatedFaq } from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useFaqs(filters: BaseFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedFaq>>(['faqs', filters], () =>
    api.get(`/faqs${buildQueryString(filters)}`)
  );
}

export function useFaq(id: string) {
  return useCmsQuery<Faq>(['faq', id], () => api.get(`/faqs/${id}`), {
    enabled: id !== 'new' && !!id,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Faq>) => api.post<{ id: string }>('/faqs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'FAQ created successfully!' },
  });
}

export function useUpdateFaq(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Faq>) => api.patch(`/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'FAQ updated successfully!' },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/faqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'FAQ deleted successfully.' },
  });
}
