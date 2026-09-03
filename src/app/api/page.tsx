import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';
import { UserRole } from '@/schemas/cms';
import { ApiDocsClient } from './ApiDocsClient';

export default async function ApiDocsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/login');
  }

  return <ApiDocsClient />;
}
