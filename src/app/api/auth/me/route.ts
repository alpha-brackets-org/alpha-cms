import { apiHandler, getCurrentUser, sendData } from '@/lib/api-utils';

export const GET = apiHandler(
  async () => {
    const user = await getCurrentUser();

    if (!user) {
      return sendData(null);
    }

    return sendData({
      _id: user._id,
      email: user.email,
      role: user.role,
      portfolios: user.portfolios || [],
    });
  },
  { isPublic: true }
);
