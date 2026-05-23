'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useTestimonial,
  useUpdateTestimonial,
} from '@/hooks/use-testimonials';
import { TestimonialForm } from '../TestimonialForm';
import { Testimonial } from '@/types/cms';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTestimonialPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: testimonial, isLoading } = useTestimonial(id);
  const updateMutation = useUpdateTestimonial(id);

  const handleSubmit = (formData: Testimonial) => {
    updateMutation.mutate(formData, {
      onSuccess: () => router.push('/testimonials'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TestimonialForm
        initialData={testimonial as unknown as Parameters<typeof TestimonialForm>[0]['initialData']}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        submitText="SAVE CHANGES"
      />
    </div>
  );
}
