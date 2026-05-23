import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaginatedResponse,
  BaseFilters,
  Testimonial,
  PopulatedTestimonial,
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
  return useCmsQuery<Testimonial>(
    ['testimonial', id],
    () => api.get(`/testimonials/${id}`),
    { enabled: !!id && id !== 'new' }
  );
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Testimonial>) =>
      api.post<{ id: string }>('/testimonials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    meta: { successMessage: 'Testimonial created successfully!' },
  });
}

export function useUpdateTestimonial(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Testimonial>) =>
      api.patch(`/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonial', id] });
    },
    meta: { successMessage: 'Testimonial updated successfully!' },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    meta: { successMessage: 'Testimonial deleted.' },
  });
}
