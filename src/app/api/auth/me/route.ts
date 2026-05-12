import { NextResponse } from 'next/server';
import { apiHandler, getCurrentUser } from '@/lib/api-utils';

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      portfolios: user.portfolios || [],
    },
  });
});
