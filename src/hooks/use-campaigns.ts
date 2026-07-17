import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Campaign, BaseFilters, PaginatedResponse } from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

const API_URL = '/campaigns';

export function useCampaigns(filters: BaseFilters = {}) {
  return useCmsQuery<PaginatedResponse<Campaign>>(['campaigns', filters], () =>
    api.get<PaginatedResponse<Campaign>>(
      `${API_URL}${buildQueryString(filters)}`
    )
  );
}

export function useCampaign(id: string) {
  return useCmsQuery<{ data: Campaign }>(
    ['campaign', id],
    () => api.get<{ data: Campaign }>(`${API_URL}/${id}`),
    { enabled: !!id }
  );
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Campaign>) =>
      api.post<{ data: Campaign }>(API_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{
        data: { message: string; sent: number; failed: number };
      }>(`${API_URL}/${id}/send`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
