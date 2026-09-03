import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CaseStudy,
  PopulatedCaseStudy,
  CaseStudyFilters,
  PaginatedResponse,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useCaseStudies(filters: CaseStudyFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedCaseStudy>>(
    ['case-studies', filters],
    () => api.get(`/case-studies${buildQueryString(filters)}`)
  );
}

export function useCaseStudy(id: string) {
  return useCmsQuery<{ data: PopulatedCaseStudy }>(
    ['case-study', id],
    () => api.get(`/case-studies/${id}`),
    {
      enabled: id !== 'new' && !!id,
    }
  );
}

export function useCreateCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaseStudy>) =>
      api.post<{ data: CaseStudy }>('/case-studies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Case study created successfully!' },
  });
}

export function useUpdateCaseStudy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaseStudy>) =>
      api.patch<{ data: CaseStudy }>(`/case-studies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
      queryClient.invalidateQueries({ queryKey: ['case-study', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Case study updated successfully!' },
  });
}

export function useDeleteCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/case-studies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Case study deleted permanently.' },
  });
}
