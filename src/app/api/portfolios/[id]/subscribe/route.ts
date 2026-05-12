import mongoose from 'mongoose';
import {
  apiHandler,
  DbUtils,
  sendSuccess,
  sendBadRequest,
} from '@/lib/api-utils';
import { CollectionName, SubscriberStatus } from '@/types/cms';
import { SubscriberSchema } from '@/schemas/cms';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUBLIC SUBSCRIBE ENDPOINT
 * Allows visitors to subscribe to a portfolio's newsletter.
 */
export const POST = apiHandler(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json();

  // Validate the request body
  const validation = SubscriberSchema.safeParse({
    ...body,
    portfolio: id,
    status: SubscriberStatus.ACTIVE,
  });

  if (!validation.success) {
    return sendBadRequest(validation.error.issues[0].message);
  }

  const { email } = validation.data;
  const portfolioId = new mongoose.Types.ObjectId(id);

  // Check if already subscribed
  const existing = await mongoose.connection.db
    .collection(CollectionName.SUBSCRIBERS)
    .findOne({ email: email.toLowerCase(), portfolio: portfolioId });

  if (existing) {
    if (existing.status === SubscriberStatus.ACTIVE) {
      return sendBadRequest(
        'This email is already subscribed to this portfolio.'
      );
    } else {
      // Re-activate if previously unsubscribed
      await mongoose.connection.db
        .collection(CollectionName.SUBSCRIBERS)
        .updateOne(
          { _id: existing._id },
          {
            $set: {
              status: SubscriberStatus.ACTIVE,
              updatedAt: new Date(),
            },
          }
        );
      return sendSuccess({ message: 'Subscription re-activated.' });
    }
  }

  // Create new subscriber
  await DbUtils.createDoc(CollectionName.SUBSCRIBERS, {
    email: email.toLowerCase(),
    portfolio: portfolioId,
    status: SubscriberStatus.ACTIVE,
    subscribedAt: new Date(),
  });

  return sendSuccess(
    { message: 'Successfully subscribed to the newsletter.' },
    201
  );
});
