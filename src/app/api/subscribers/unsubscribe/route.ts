import {
  apiHandler,
  sendData,
  sendBadRequest,
  sendNotFound,
} from '@/lib/api-utils';
import { unsubscribeSubscriber } from '@/lib/subscribers';

/**
 * PUBLIC UNSUBSCRIBE ENDPOINT
 */
export const POST = apiHandler(
  async (request) => {
    const { email, portfolioId } = await request.json();

    if (!email || !portfolioId) {
      return sendBadRequest('Email and Portfolio ID are required.');
    }

    const result = await unsubscribeSubscriber(email, portfolioId);

    if (result.matchedCount === 0) {
      return sendNotFound('Subscriber');
    }

    return sendData({ message: 'You have been successfully unsubscribed.' });
  },
  { isPublic: true }
);
