import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Faq, BaseFilters, PopulatedFaq, PaginatedResponse } from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useFaqs(filters: BaseFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedFaq>>(['faqs', filters], () =>
    api.get(`/faqs${buildQueryString(filters)}`)
  );
}

export function useFaq(id: string) {
  return useCmsQuery<{ data: Faq }>(
    ['faq', id],
    () => api.get(`/faqs/${id}`),
    {
      enabled: id !== 'new' && !!id,
    }
  );
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Faq>) => api.post<{ data: Faq }>('/faqs', data),
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
    mutationFn: (data: Partial<Faq>) =>
      api.patch<{ data: Faq }>(`/faqs/${id}`, data),
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
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/faqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'FAQ deleted successfully.' },
  });
}
