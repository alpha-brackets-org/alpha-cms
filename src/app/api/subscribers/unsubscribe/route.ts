import mongoose from 'mongoose';
import {
  apiHandler,
  sendSuccess,
  sendBadRequest,
  sendNotFound,
} from '@/lib/api-utils';
import { CollectionName, SubscriberStatus } from '@/types/cms';

/**
 * PUBLIC UNSUBSCRIBE ENDPOINT
 */
export const POST = apiHandler(async (request) => {
  const { email, portfolioId } = await request.json();

  if (!email || !portfolioId) {
    return sendBadRequest('Email and Portfolio ID are required.');
  }

  const db = mongoose.connection.db;

  const result = await db.collection(CollectionName.SUBSCRIBERS).updateOne(
    {
      email: email.toLowerCase(),
      portfolio: new mongoose.Types.ObjectId(portfolioId),
    },
    {
      $set: {
        status: SubscriberStatus.UNSUBSCRIBED,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    return sendNotFound('Subscriber');
  }

  return sendSuccess({ message: 'You have been successfully unsubscribed.' });
}, { isPublic: true });
