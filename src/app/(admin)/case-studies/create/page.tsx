'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCaseStudy } from '@/hooks/use-case-studies';
import { CaseStudyForm } from '../CaseStudyForm';
import { CaseStudy } from '@/types/cms';

export default function CreateCaseStudyPage() {
  const router = useRouter();
  const createMutation = useCreateCaseStudy();

  const handleSubmit = (formData: CaseStudy) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/case-studies');
      },
    });
  };

  return (
    <CaseStudyForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitText="CREATE CASE STUDY"
      isNew={true}
    />
  );
}
