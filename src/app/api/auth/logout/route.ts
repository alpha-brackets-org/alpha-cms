import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';

export const POST = apiHandler(
  async () => {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('alpha_auth_token');
    return response;
  },
  { isPublic: true }
);
