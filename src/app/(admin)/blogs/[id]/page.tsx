'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBlog, useUpdateBlog } from '@/hooks/use-blogs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BlogForm } from '../BlogForm';
import { Blog } from '@/types/cms';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: blog, isLoading } = useBlog(id);
  const updateMutation = useUpdateBlog(id);

  const handleSubmit = (formData: Blog) => {
    updateMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/blogs');
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

  if (!blog) {
    return (
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold">Article not found</h2>
        <Button asChild className="mt-4">
          <Link href="/blogs">Back to Articles</Link>
        </Button>
      </div>
    );
  }

  return (
    <BlogForm
      initialData={blog as unknown as Blog}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitText="SAVE CHANGES"
      isNew={false}
    />
  );
}
