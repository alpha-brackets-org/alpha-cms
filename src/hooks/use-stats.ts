import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Stats } from '@/types/cms';

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats'),
  });
}
