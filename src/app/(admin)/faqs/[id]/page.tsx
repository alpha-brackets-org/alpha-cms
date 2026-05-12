'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/use-faqs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { FaqForm } from '../FaqForm';

export default function EditFaqPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: faq, isLoading } = useFaq(id);
  const updateMutation = useUpdateFaq(id);
  const deleteMutation = useDeleteFaq();

  const [confirmOpen, setConfirmOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        router.push('/faqs');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold">FAQ not found</h2>
        <Button asChild className="mt-4">
          <Link href="/faqs">Back to FAQs</Link>
        </Button>
      </div>
    );
  }

  const initialData = {
    question: faq.question || '',
    answer: faq.answer || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    portfolio: (faq.portfolio as any)?._id || faq.portfolio || '',
    status: faq.status || '',
    order: faq.order || 0,
    group: faq.group || '',
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
              Edit FAQ
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Update FAQ details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            DELETE
          </Button>
        </div>
      </div>

      <FaqForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        submitText="SAVE CHANGES"
      />

      <BrutalConfirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="DELETE FAQ?"
        message="Are you sure you want to delete this FAQ? This action is irreversible."
        confirmText="DELETE NOW"
        isDestructive={true}
      />
    </div>
  );
}
