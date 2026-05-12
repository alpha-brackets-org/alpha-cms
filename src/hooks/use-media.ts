import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResponse, Media } from '@/types/cms';
import { MediaFolder } from '@/schemas/cms';
import { api } from '@/lib/api-client';
import { buildQueryString } from '@/lib/utils';
import { useCmsQuery } from './use-cms-query';
export function useMedia(
  portfolioId?: string | null,
  folder?: string | null,
  search?: string | null
) {
  const filters = {
    portfolio: portfolioId || undefined,
    folder: folder && folder !== 'all' ? folder : undefined,
    search: search || undefined,
  };

  return useCmsQuery<PaginatedResponse<Media>>(['media', filters], () =>
    api.get(`/media${buildQueryString(filters)}`)
  );
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Media deleted.' },
  });
}

export function useBatchDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.delete('/media', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Selected media items removed.' },
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      portfolio,
      folder = MediaFolder.UNORGANIZED,
    }: {
      file: File;
      portfolio: string;
      folder?: MediaFolder;
    }) => {
      // 1. Prepare Unified Multipart Form Data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portfolio', portfolio);
      formData.append('virtualFolder', folder);
      formData.append(
        'fileName',
        `media_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      );
      formData.append('folder', `/media/${portfolio}`); // ImageKit actual folder

      // 2. Execute Single Atomic Upload & Registration
      return api.post('/media/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    meta: { successMessage: 'Media uploaded and registered successfully!' },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Media> }) =>
      api.patch(`/media/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    meta: { successMessage: 'Media updated.' },
  });
}
