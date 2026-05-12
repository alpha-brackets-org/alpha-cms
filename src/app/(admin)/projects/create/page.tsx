'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateProject } from '@/hooks/use-projects';
import { ProjectForm } from '../ProjectForm';
import { Project } from '@/types/cms';

export default function CreateProjectPage() {
  const router = useRouter();
  const createMutation = useCreateProject();

  const handleSubmit = (formData: Project) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/projects');
      },
    });
  };

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitText="CREATE PROJECT"
      isNew={true}
    />
  );
}
