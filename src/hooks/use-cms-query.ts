import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { usePortfolio } from '@/providers/PortfolioProvider';

/**
 * A wrapper around TanStack Query's useQuery that automatically injects
 * the active portfolio context into the queryKey to ensure portfolio-specific
 * data caching and automatic refetching on portfolio switch.
 */
export function useCmsQuery<TData = unknown>(
  key: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, Error> {
  const { activePortfolio } = usePortfolio();

  return useQuery<TData, Error>({
    queryKey: [...key, activePortfolio],
    queryFn,
    ...options,
  });
}
