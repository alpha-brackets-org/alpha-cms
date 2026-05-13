import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';
import { apiHandler, getCurrentUser, sendError } from '@/lib/api-utils';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return sendError('AUTHENTICATION REQUIRED', 401);
  }

  const authParams = imagekit.helper.getAuthenticationParameters();
  return NextResponse.json(authParams);
});
