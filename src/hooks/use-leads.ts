import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResponse, Lead, LeadFilters } from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useLeads(filters: LeadFilters = {}) {
  return useCmsQuery<PaginatedResponse<Lead>>(['leads', filters], () =>
    api.get(`/leads${buildQueryString(filters)}`)
  );
}

export function useLead(id: string) {
  return useCmsQuery<Lead>(['lead', id], () => api.get(`/leads/${id}`));
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      api.patch(`/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    meta: { successMessage: 'Lead status updated!' },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Lead deleted.' },
  });
}
