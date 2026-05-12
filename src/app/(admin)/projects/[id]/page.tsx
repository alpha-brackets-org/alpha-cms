'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProjectForm } from '../ProjectForm';
import { Project } from '@/types/cms';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading } = useProject(id);
  const updateMutation = useUpdateProject(id);

  const handleSubmit = (formData: Project) => {
    updateMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/projects');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-3 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button asChild className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <ProjectForm
      initialData={project as unknown as Project}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitText="SAVE CHANGES"
      isNew={false}
    />
  );
}
