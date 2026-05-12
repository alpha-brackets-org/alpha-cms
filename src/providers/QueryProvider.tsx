'use client';

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure QueryClient is only created once per session to avoid re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Consider data fresh for 60 seconds
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            // Global error handling for all queries (fetches)
            toast({
              variant: 'destructive',
              title: 'DATA FETCH FAILED',
              description:
                error.message || 'Could not retrieve information from server.',
            });
          },
        }),
        mutationCache: new MutationCache({
          onSuccess: (data, _variables, _context, mutation) => {
            // Check if the mutation has specific success metadata or if the server returned a message
            const serverMessage = (data as { message?: string })?.message;
            const successMessage = mutation.meta?.successMessage;

            const message = serverMessage || successMessage;
            if (message) {
              toast({
                variant: 'success',
                title: 'SUCCESS',
                description: message,
              });
            }
          },
          onError: (error) => {
            // Global error handling for all mutations (POST, PUT, DELETE)
            toast({
              variant: 'destructive',
              title: 'ERROR',
              description:
                error.message || 'A system error occurred. Please try again.',
            });
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
