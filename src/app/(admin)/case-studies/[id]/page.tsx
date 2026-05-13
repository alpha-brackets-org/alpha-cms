'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCaseStudy, useUpdateCaseStudy } from '@/hooks/use-case-studies';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CaseStudyForm } from '../CaseStudyForm';
import { CaseStudy } from '@/types/cms';

export default function EditCaseStudyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: study, isLoading } = useCaseStudy(id);
  const updateMutation = useUpdateCaseStudy(id);

  const handleSubmit = (formData: CaseStudy) => {
    updateMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/case-studies');
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

  if (!study) {
    return (
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold">Case Study not found</h2>
        <Button asChild className="mt-4">
          <Link href="/case-studies">Back to Case Studies</Link>
        </Button>
      </div>
    );
  }

  return (
    <CaseStudyForm
      initialData={study}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitText="SAVE CHANGES"
      isNew={false}
    />
  );
}
