'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTestimonial } from '@/hooks/use-testimonials';
import { TestimonialForm } from '../TestimonialForm';
import { Testimonial } from '@/types/cms';

export default function CreateTestimonialPage() {
  const router = useRouter();
  const createMutation = useCreateTestimonial();

  const handleSubmit = (formData: Testimonial) => {
    createMutation.mutate(formData, {
      onSuccess: () => router.push('/testimonials'),
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TestimonialForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitText="CREATE TESTIMONIAL"
        isNew={true}
      />
    </div>
  );
}
