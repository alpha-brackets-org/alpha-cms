import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaginatedResponse,
  CaseStudy,
  PopulatedCaseStudy,
  CaseStudyFilters,
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
  return useCmsQuery<PopulatedCaseStudy>(['case-study', id], () => api.get(`/case-studies/${id}`), {
    enabled: id !== 'new' && !!id,
  });
}

export function useCreateCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaseStudy>) =>
      api.post<{ id: string }>('/case-studies', data),
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
      api.patch(`/case-studies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
      queryClient.invalidateQueries({ queryKey: ['case-study', id] });
    },
    meta: { successMessage: 'Changes saved successfully!' },
  });
}

export function useDeleteCaseStudy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/case-studies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Case study deleted permanently.' },
  });
}
