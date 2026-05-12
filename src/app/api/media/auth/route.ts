import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';
import { apiHandler } from '@/lib/api-utils';

export const GET = apiHandler(async () => {
  const authParams = imagekit.helper.getAuthenticationParameters();
  return NextResponse.json(authParams);
});
