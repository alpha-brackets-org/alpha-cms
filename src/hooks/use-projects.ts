import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaginatedResponse,
  Project,
  PopulatedProject,
  ProjectFilters,
} from '@/types/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';

export function useProjects(filters: ProjectFilters = {}) {
  return useCmsQuery<PaginatedResponse<Project>>(['projects', filters], () =>
    api.get(`/projects${buildQueryString(filters)}`)
  );
}

export function useProject(id: string) {
  return useCmsQuery<PopulatedProject>(
    ['projects', id],
    () => api.get(`/projects/${id}`),
    {
      enabled: id !== 'new' && !!id,
    }
  );
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      api.post<{ id: string }>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Project created successfully!' },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) => api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Project saved successfully!' },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Project deleted permanently.' },
  });
}
