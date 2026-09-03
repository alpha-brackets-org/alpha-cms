import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Portfolio } from '@/types/cms';

export function usePortfolios() {
  return useQuery<{ data: Portfolio[] }>({
    queryKey: ['portfolios'],
    queryFn: () => api.get<{ data: Portfolio[] }>('/portfolios'),
  });
}

export function usePortfolio(id: string) {
  return useQuery<{ data: Portfolio }>({
    queryKey: ['portfolios', id],
    queryFn: () => api.get<{ data: Portfolio }>(`/portfolios/${id}`),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Portfolio>) =>
      api.post<{ data: Portfolio }>('/portfolios', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Portfolio provisioned successfully!' },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Portfolio> }) =>
      api.patch<{ data: Portfolio }>(`/portfolios/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Portfolio updated successfully!' },
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: { apiKey: string } }>(
        `/portfolios/${id}/api-key/regenerate`,
        {}
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios', id] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/portfolios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Portfolio deleted permanently.' },
  });
}
