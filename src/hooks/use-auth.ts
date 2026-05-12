import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/cms';
import { api } from '@/lib/api-client';
import Cookies from 'js-cookie';
import { LoginPayload, ResetPasswordPayload, AuthResponse } from '@/types/auth';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const data = await api.get<{ user: User | null }>('/auth/me');
      return data.user;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginPayload) =>
      api.post<AuthResponse>('/auth/login', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      Cookies.remove('alpha_auth_token');
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ message: string }>('/auth/forgot-password', { email }),
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResetPasswordPayload) =>
      api.post<AuthResponse>('/auth/reset-password', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
