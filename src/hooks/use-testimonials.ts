import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BaseFilters,
  Testimonial,
  PopulatedTestimonial,
  PaginatedResponse,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useTestimonials(filters: BaseFilters = {}) {
  return useCmsQuery<PaginatedResponse<PopulatedTestimonial>>(
    ['testimonials', filters],
    () => api.get(`/testimonials${buildQueryString(filters)}`)
  );
}

export function useTestimonial(id: string) {
  return useCmsQuery<{ data: Testimonial }>(
    ['testimonial', id],
    () => api.get(`/testimonials/${id}`),
    { enabled: !!id && id !== 'new' }
  );
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Testimonial>) =>
      api.post<{ data: Testimonial }>('/testimonials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Testimonial created successfully!' },
  });
}

export function useUpdateTestimonial(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Testimonial>) =>
      api.patch<{ data: Testimonial }>(`/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonial', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Testimonial updated successfully!' },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { id: string } }>(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    meta: { successMessage: 'Testimonial deleted.' },
  });
}
