import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Stats } from '@/types/cms';

export function useStats(months: number = 6) {
  return useQuery<Stats>({
    queryKey: ['stats', months],
    queryFn: () => api.get(`/stats?months=${months}`),
  });
}
