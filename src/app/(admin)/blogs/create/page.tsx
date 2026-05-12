'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBlog } from '@/hooks/use-blogs';
import { BlogForm } from '../BlogForm';
import { Blog } from '@/types/cms';

export default function CreateBlogPage() {
  const router = useRouter();
  const createMutation = useCreateBlog();

  const handleSubmit = (formData: Blog) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        router.push('/blogs');
      },
    });
  };

  return (
    <BlogForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      submitText="CREATE ARTICLE"
      isNew={true}
    />
  );
}
