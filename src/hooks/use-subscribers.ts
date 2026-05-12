import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Subscriber,
  PopulatedSubscriber,
  PaginatedResponse,
  SubscriberFilters,
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
      api.patch(`/subscribers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
    meta: { successMessage: 'Subscriber updated!' },
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/subscribers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    },
    meta: { successMessage: 'Subscriber removed.' },
  });
}

export function useUnsubscribe() {
  return useMutation({
    mutationFn: (data: { email: string; portfolioId: string }) =>
      api.post<{ message: string }>('/subscribers/unsubscribe', data),
  });
}
