import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Subscriber,
  PopulatedSubscriber,
  SubscriberFilters,
  PaginatedResponse,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useSubscribers(filters: SubscriberFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedSubscriber>>(
    ['subscribers', filters],
    () => api.get(`/subscribers${buildQueryString(filters)}`)
  );
}

export function useUpdateSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subscriber> }) =>
      api.patch<{ data: Subscriber }>(`/subscribers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
    meta: { successMessage: 'Subscriber updated!' },
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/subscribers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
    meta: { successMessage: 'Subscriber removed.' },
  });
}

export function useUnsubscribe() {
  return useMutation({
    mutationFn: (data: { email: string; portfolioId: string }) =>
      api.post<{ data: { message: string } }>('/subscribers/unsubscribe', data),
  });
}
