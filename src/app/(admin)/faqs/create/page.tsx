'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCreateFaq } from '@/hooks/use-faqs';
import { Button } from '@/components/ui/button';
import { FaqForm } from '../FaqForm';

export default function CreateFaqPage() {
  const router = useRouter();
  const createMutation = useCreateFaq();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (formData: any) => {
    createMutation.mutate(formData, {
      onSuccess: (data) => {
        router.push(`/faqs/${data.id}`);
      },
    });
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-10 w-10">
            <Link href="/faqs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">
              New FAQ
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Create a new frequently asked question
            </p>
          </div>
        </div>
      </div>

      <FaqForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitText="CREATE FAQ"
      />
    </div>
  );
}
