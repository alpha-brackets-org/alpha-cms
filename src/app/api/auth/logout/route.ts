import { apiHandler, sendData } from '@/lib/api-utils';

export const POST = apiHandler(
  async () => {
    const response = sendData({ loggedOut: true });
    response.cookies.delete('alpha_auth_token');
    return response;
  },
  { isPublic: true }
);
