import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResponse, Campaign, BaseFilters } from '@/types/cms';
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
  return useCmsQuery<Campaign>(
    ['campaign', id],
    () =>
      api.get<{ data: Campaign }>(`${API_URL}/${id}`).then((res) => res.data),
    { enabled: !!id }
  );
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Campaign>) => api.post(API_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<{ data: { sent: number } }>(`${API_URL}/${id}/send`, {})
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
